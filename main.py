import asyncio
import json
import re
import uvicorn
from typing import Dict, Any, List, Optional
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from prompts import BASE_GENERATOR_SYSTEM_PROMPT, AGENT_INJECTIONS, PEER_REVIEW_SYSTEM_PROMPT_TEMPLATE
from llm_client import call_llm

app = FastAPI(title="Multi-Agent Peer Voting Engine - Ultra Edition")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

class PeerReviewSchema(BaseModel):
    reasoning: str
    accuracy_score: int = Field(ge=1, le=5)
    completeness_score: int = Field(ge=1, le=5)
    clarity_score: int = Field(ge=1, le=5)

async def generate_response(agent_id: str, injection: str, user_query: str, semaphore: asyncio.Semaphore, queue: asyncio.Queue):
    await queue.put({"agent_id": agent_id, "status": "generating", "type": "status_update"})
    system_prompt = f"{BASE_GENERATOR_SYSTEM_PROMPT}\n\n{injection}"
    try:
        async with semaphore:
            response_text = await call_llm(
                system_prompt, 
                user_query, 
                temperature=0.7, 
                model="llama-3.1-8b-instant"
            )
        await queue.put({"agent_id": agent_id, "status": "reviewing_peers", "type": "status_update"})
        return agent_id, response_text
    except Exception as e:
        await queue.put({"agent_id": agent_id, "status": "generation_failed", "error": str(e), "type": "status_update"})
        return agent_id, None

async def peer_review_agent(reviewer_id: str, reviewer_injection: str, target_id: str, target_text: str, user_query: str, semaphore: asyncio.Semaphore, queue: asyncio.Queue):
    if not target_text:
        return reviewer_id, target_id, None
        
    await queue.put({
        "type": "peer_review_status",
        "reviewer": reviewer_id,
        "target": target_id,
        "status": "reviewing"
    })
    
    system_prompt = PEER_REVIEW_SYSTEM_PROMPT_TEMPLATE.format(agent_id=reviewer_id, injection=reviewer_injection)
    user_prompt = f"User Query: {user_query}\n\nCandidate Response to Review:\n{target_text}"
    
    for attempt in range(2):
        try:
            async with semaphore:
                await asyncio.sleep(1.5 * (ord(reviewer_id) % 5)) 
                judge_response = await call_llm(
                    system_prompt if attempt == 0 else system_prompt + "\n\nCRITICAL: Your previous output was malformed. Output ONLY valid JSON.",
                    user_prompt, 
                    temperature=0.1, 
                    model="llama-3.1-8b-instant"
                )
            
            match = re.search(r'\{.*\}', judge_response, re.DOTALL)
            if match:
                data_dict = json.loads(match.group(0))
                data = PeerReviewSchema(**data_dict)
                weighted_score = (data.accuracy_score * 2.0) + (data.completeness_score * 1.2) + (data.clarity_score * 0.8)
                
                result = data.dict()
                result["calculated_weighted_score"] = weighted_score
                
                await queue.put({
                    "type": "peer_review_status",
                    "reviewer": reviewer_id,
                    "target": target_id,
                    "status": "completed",
                    "score": weighted_score,
                    "reasoning": data.reasoning
                })
                return reviewer_id, target_id, result
        except Exception as e:
            if attempt == 1:
                await queue.put({
                    "type": "peer_review_status",
                    "reviewer": reviewer_id,
                    "target": target_id,
                    "evalStatus": "rate_limited",
                    "error": str(e)
                })
    return reviewer_id, target_id, None

async def event_generator(user_query: str):
    queue = asyncio.Queue()
    semaphore = asyncio.Semaphore(2)
    
    gen_tasks = [
        asyncio.create_task(generate_response(aid, inj, user_query, semaphore, queue))
        for aid, inj in AGENT_INJECTIONS.items()
    ]
    
    async def run_pipeline():
        try:
            gen_results = await asyncio.gather(*gen_tasks, return_exceptions=True)
            responses = {aid: txt for aid, txt in gen_results if isinstance(aid, str) and txt}
            
            review_tasks = []
            for r_id, r_inj in AGENT_INJECTIONS.items():
                for t_id, t_txt in responses.items():
                    if r_id != t_id:
                        review_tasks.append(
                            asyncio.create_task(peer_review_agent(r_id, r_inj, t_id, t_txt, user_query, semaphore, queue))
                        )
            
            review_results = await asyncio.gather(*review_tasks, return_exceptions=True)
            await queue.put({"status": "done", "responses": responses, "reviews": review_results})
        except Exception as e:
            await queue.put({"status": "done", "responses": {}, "reviews": [], "error": str(e)})

    asyncio.create_task(run_pipeline())

    while True:
        msg = await queue.get()
        if msg.get("status") == "done":
            responses = msg.get("responses", {})
            reviews = msg.get("reviews", [])
            
            voting_matrix = {}
            for res in reviews:
                if isinstance(res, Exception) or res is None or res[2] is None:
                    continue
                r_id, t_id, data = res
                if t_id not in voting_matrix: voting_matrix[t_id] = {}
                voting_matrix[t_id][r_id] = data
            
            scoreboard = {}
            for t_id, peer_votes in voting_matrix.items():
                if not peer_votes: continue
                total = sum(v["calculated_weighted_score"] for v in peer_votes.values())
                scoreboard[t_id] = total / len(peer_votes)
            
            best_agent = max(scoreboard, key=scoreboard.get) if scoreboard else None
            best_score = scoreboard.get(best_agent, 0) if best_agent else 0
            best_response = responses.get(best_agent, "") if best_agent else ""
            
            final_payload = {
                "status": "final",
                "scoreboard": scoreboard,
                "voting_matrix": voting_matrix,
                "execution_log": {
                    "query": user_query,
                    "winner_idx": best_agent,
                    "eval_success_rate": len([r for r in reviews if not isinstance(r, Exception) and r[2] is not None]) / 20.0,
                    "score_variance": 0
                },
                "best_response": best_response
            }
            yield f"data: {json.dumps(final_payload)}\n\n"
            break
        else:
            yield f"data: {json.dumps(msg)}\n\n"

@app.post("/api/evaluate")
async def evaluate_endpoint(request: QueryRequest):
    return StreamingResponse(event_generator(request.query), media_type="text/event-stream")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
