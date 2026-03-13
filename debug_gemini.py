import os
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

async def debug_gemini():
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    try:
        # List models to see available names
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(m.name)
        
        # Test a specific one
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = await model.generate_content_async("test")
        print("Success:", response.text)
    except Exception as e:
        print("Error Type:", type(e))
        print("Error Message:", e)

if __name__ == "__main__":
    asyncio.run(debug_gemini())
