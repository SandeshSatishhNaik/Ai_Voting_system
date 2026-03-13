# Implementation Plan: Multi-Agent LLM Voting Engine

## Objective
Implement an asynchronous Python backend for a multi-agent LLM voting engine. The system will make parallel API calls to free-tier LLM APIs (Groq and Gemini) acting as distinct personas, evaluate their responses using an LLM judge, and aggregate the scores to select the best output. 

## Key Files & Context
- `requirements.txt`: Dependencies (`groq`, `google-generativeai`, `tenacity`, `python-dotenv`).
- `prompts.py`: Defines the system prompts, agent persona injections, and the judge prompt.
- `llm_client.py`: An asynchronous wrapper for API calls featuring rate-limit retry logic and error handling.
- `main.py`: The orchestrator script containing `parse_and_vote` to coordinate the parallel generation and evaluation phases.

## Implementation Steps

### 1. File System & Virtual Environment
- Ensure all work is confined to the `D:\multi-agent-voter` directory.
- Use a local Python virtual environment (`python -m venv venv`) within the work folder and install all dependencies strictly inside it. No global installations.

### 2. `requirements.txt`
Create the dependency file including:
- `groq`
- `google-generativeai`
- `tenacity` (for retry logic on 429 errors)
- `python-dotenv` (for loading API keys)

### 3. `prompts.py`
Define the prompt templates as outlined in the `GEMINI.md`:
- `BASE_GENERATOR_SYSTEM_PROMPT`: "You are an expert analytical engine. Do not include filler. Structure final output in <final_answer> tags. Show reasoning in <scratchpad> tags."
- `AGENT_INJECTIONS`:
  - Agent A: "APPROACH: First-Principles. Deconstruct into fundamental truths."
  - Agent B: "APPROACH: Devil's Advocate. Refute common misconceptions."
  - Agent C: "APPROACH: Step-by-Step Explicit (CoT). Break the problem into exactly 3 to 5 discrete, numbered logical steps."
  - Agent D: "APPROACH: Executive Summary. High density, bullet points."
  - Agent E: "APPROACH: Lateral Thinker. Edge cases and boundary conditions."
- `JUDGE_SYSTEM_PROMPT`: "You are a strict grading system. Grade Candidate Response against User Query from 1-5 for Accuracy, Completeness, Clarity. Output ONLY valid JSON matching the schema."

### 4. `llm_client.py`
Implement `async def call_llm(system_prompt, user_prompt, temperature, model)`:
- Initialize SDK clients (`groq.AsyncGroq`, `google.generativeai` / `gemini`).
- Use `@retry` from `tenacity` to handle HTTP 429 Rate Limit errors with exponential backoff.
- Implement conditional routing to either the Groq API or Gemini API depending on the requested model.

### 5. `main.py`
Implement the core pipeline `async def parse_and_vote(user_query: str)`:
- **Concurrency Limit:** Create an `asyncio.Semaphore(2)` and pass it to all generator and evaluation tasks to prevent RPS burst limits from immediately triggering 429s.
- **Generation:** Use `asyncio.gather(..., return_exceptions=True)` along with the semaphore to dispatch 5 parallel generation calls for each agent persona.
- **Evaluation:** For each successful generation, dispatch a judge LLM call (governed by the semaphore) to evaluate the response against the user query.
- **Robust Parsing:** Use the `re` module (`re.search(r'\{.*\}', text, re.DOTALL)`) to extract the JSON dictionary out of the judge's response, handling markdown and conversational preambles safely.
- **Scoring:** Compute the weighted score for each valid evaluation using the formula: `Weighted score = (Accuracy * 2.0) + (Completeness * 1.2) + (Clarity * 0.8)`.
- **Telemetry:** At the very end of `parse_and_vote`, assemble and return an `execution_log` dictionary capturing `query`, `winner_idx`, `eval_success_rate`, and `score_variance`.
- **Execution:** Add an `if __name__ == "__main__":` block to run a test query using `asyncio.run()`, print all scores, display the `execution_log`, and declare the winning agent and its output.

## Verification
- Ensure `python main.py` executes successfully within the local `venv`.
- Verify that rate limiting (429s) are handled gracefully via retries and the semaphore.
- Ensure the JSON extraction uses `re` and handles unexpected characters gracefully.
- Confirm the `execution_log` returns accurate analytics and the scoring formula is mathematically sound.
