import os
import time
from google import genai
from dotenv import load_dotenv

# 1. .env file se API Key load karna
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# 2. Client Initialize karna
# Naya SDK automatically latest stable version use karta hai

client = genai.Client(api_key=GEMINI_API_KEY)

# Aapki list ke hisaab se sabse best model
MODEL_ID = "gemini-2.5-flash-lite" 

def test_gemini_connection():
    print(f"--- Testing Connection with {MODEL_ID} ---")
    try:
        # Simple text prompt testing
        print("Waiting for API quota...")
        time.sleep(10)
        response = client.models.generate_content(
            model=MODEL_ID,
            contents="Say 'AI is working perfectly for Faheem!'"
        )
        
        if response.text:
            print("\n✅ SUCCESS!")
            print(f"AI Response: {response.text}")
            print("\nAb aap is model ID ko main.py mein use kar sakte hain.")
        else:
            print("\n⚠️ Warning: Connection established but response is empty.")
            
    except Exception as e:
        print(f"\n❌ STILL ERROR: {e}")
        print("\n--- Troubleshooting ---")
        print("1. Check if GEMINI_API_KEY in .env is correct.")
        print(f"2. Try adding 'models/' prefix: models/{MODEL_ID}")

if __name__ == "__main__":
    if not GEMINI_API_KEY:
        print("❌ Error: .env file mein GEMINI_API_KEY nahi mili!")
    else:
        test_gemini_connection()