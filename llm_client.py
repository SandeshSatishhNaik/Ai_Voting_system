import os
import asyncio
from tenacity import retry, wait_exponential, stop_after_attempt
from groq import AsyncGroq
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Initialize clients
groq_api_key = os.getenv("GROQ_API_KEY")
gemini_api_key = os.getenv("GEMINI_API_KEY")

groq_client = AsyncGroq(api_key=groq_api_key) if groq_api_key else None
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)

class RateLimitError(Exception):
    pass

@retry(wait=wait_exponential(multiplier=1, min=2, max=15), stop=stop_after_attempt(5))
async def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.7, model: str = "llama-3.1-8b-instant", tags=None):
    if "gemini" in model.lower():
        if not gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not set.")
        try:
            gemini_model = genai.GenerativeModel(
                model_name=model,
                system_instruction=system_prompt,
                generation_config=genai.types.GenerationConfig(temperature=temperature)
            )
            response = await gemini_model.generate_content_async(user_prompt)
            return response.text
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                raise RateLimitError(f"Rate limit hit for Gemini: {e}")
            raise e
    else:
        if not groq_client:
            raise ValueError("GROQ_API_KEY is not set.")
        try:
            chat_completion = await groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=model,
                temperature=temperature
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            if "429" in str(e) or "rate limit" in str(e).lower():
                raise RateLimitError(f"Rate limit hit for Groq: {e}")
            raise e
