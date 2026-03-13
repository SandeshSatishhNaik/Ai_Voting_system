# PROJECT CONTEXT: Multi-Agent LLM Voting Engine

## ARCHITECTURE
We are building an async Python backend for a multi-agent routing and evaluation system. 
- **Generators:** 5 parallel LLM calls to free-tier APIs (e.g., Groq Llama-3-8B, Gemini 1.5 Flash).
- **Judge:** 1 evaluator LLM executing 5 independent point-wise evaluations (not list-wise, to avoid position bias).

## CONSTRAINTS & FAILURE MODES (CRITICAL)
1. **Free-Tier Brittleness:** Expect HTTP 429s (Rate Limits) and malformed JSON. You MUST use `asyncio.gather(..., return_exceptions=True)`.
2. **Output Parsing:** Strip ` ```json ` markdown artifacts before calling `json.loads()`. Ignore failed parses gracefully.
3. **Scoring:** The Judge outputs exactly: `{"reasoning": "...", "accuracy_score": int, "completeness_score": int, "clarity_score": int, "total_score": int}`. 
4. **Aggregation:** Weighted score = (Accuracy * 2.0) + (Completeness * 1.2) + (Clarity * 0.8).

## PROMPT MATRIX
**Base Generator System Prompt:**
"You are an expert analytical engine. Do not include filler. Structure final output in <final_answer> tags. Show reasoning in <scratchpad> tags."

**Injections (Append to Base):**
- Agent A: "APPROACH: First-Principles. Deconstruct into fundamental truths."
- Agent B: "APPROACH: Devil's Advocate. Refute common misconceptions."
- Agent C: "APPROACH: Step-by-Step Explicit (CoT). Break the problem into exactly 3 to 5 discrete, numbered logical steps."
- Agent D: "APPROACH: Executive Summary. High density, bullet points."
- Agent E: "APPROACH: Lateral Thinker. Edge cases and boundary conditions."

**Judge System Prompt:**
"You are a strict grading system. Grade Candidate Response against User Query from 1-5 for Accuracy, Completeness, Clarity. Output ONLY valid JSON matching the schema."