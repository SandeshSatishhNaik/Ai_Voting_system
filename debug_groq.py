import os
import asyncio
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

async def debug_groq():
    client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
    try:
        response = await client.chat.completions.create(
            messages=[{"role": "user", "content": "test"}],
            model="llama3-8b-8192"
        )
        print("Success:", response.choices[0].message.content)
    except Exception as e:
        print("Error Type:", type(e))
        print("Error Message:", e)

if __name__ == "__main__":
    asyncio.run(debug_groq())
