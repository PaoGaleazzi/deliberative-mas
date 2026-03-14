import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

PROMPT_TEMPLATE = """
You are the Researcher agent in a deliberative multi-agent system.
Your task is to UPDATE the EVIDENCE section of the shared argument.

Current argument state:
{argument_state}

Judge's feedback (if any):
{feedback}

Add 2-3 relevant facts, studies, or examples that support or contextualize the claim.
Return ONLY the updated evidence as a JSON list. No preamble.
"""

def run(argument_state: dict, feedback: str = "") -> dict:
    prompt = PROMPT_TEMPLATE.format(
        argument_state=json.dumps(argument_state, indent=2),
        feedback=feedback
    )

    response = client.models.generate_content(
        model="gemini-3.1-flash-lite-preview",
        contents=prompt,
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=0)
        )
    )

    evidence = json.loads(response.text)
    argument_state["evidence"] = evidence
    return argument_state