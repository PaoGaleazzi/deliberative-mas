import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

PROMPT_TEMPLATE = """
You are the Judge agent in a deliberative multi-agent system.
Evaluate the current argument quality.

Current argument state:
{argument_state}

Return ONLY a JSON object with this exact structure:
{{
  "decision": "sufficient" | "revise",
  "feedback": "...",
  "score": {{
    "evidence": 0.0-1.0,
    "logic": 0.0-1.0,
    "clarity": 0.0-1.0
  }}
}}
"""

def run(argument_state: dict) -> dict:
    prompt = PROMPT_TEMPLATE.format(
        argument_state=json.dumps(argument_state, indent=2)
    )

    response = client.models.generate_content(
        model="gemini-3.1-pro-preview",
        contents=prompt,
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=8192)
        )
    )

    result = json.loads(response.text)
    return result