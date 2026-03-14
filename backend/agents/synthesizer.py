import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

PROMPT_TEMPLATE = """
You are the Synthesizer agent in a deliberative multi-agent system.
Your task is to UPDATE the REFINED_POSITION field.

Current argument state:
{argument_state}

Integrate the evidence and counterarguments into a comprehensive, well-structured response.
You may use markdown formatting: headers, bullet points, bold text, tables.
Address all counterarguments directly with specific evidence from the papers.
Write with as much depth and structure as needed to fully answer the claim.
Return ONLY the refined_position as a string. No preamble.
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

    argument_state["refined_position"] = response.text.strip()
    return argument_state