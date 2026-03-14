import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

PROMPT_TEMPLATE = """
You are the Critic agent in a deliberative multi-agent system.
Your task is to UPDATE the COUNTERARGUMENTS section.

Current argument state:
{argument_state}

Identify 1-3 specific weaknesses, inconsistencies, or gaps in the evidence.
Return ONLY the updated counterarguments as a JSON list. No preamble.
"""

def run(argument_state: dict) -> dict:
    prompt = PROMPT_TEMPLATE.format(
        argument_state=json.dumps(argument_state, indent=2)
    )

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=8192)
        )
    )

    counterarguments = json.loads(response.text)
    argument_state["counterarguments"] = counterarguments
    return argument_state