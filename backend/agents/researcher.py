import os
import json
import requests
import time
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

def search_papers(query: str, limit: int = 3) -> list:
    time.sleep(2)
    url = "https://api.semanticscholar.org/graph/v1/paper/search"
    params = {
        "query": query,
        "limit": limit,
        "fields": "title,abstract,year,authors,externalIds"
    }
    response = requests.get(url, params=params)
    print(f"Semantic Scholar status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    papers = response.json().get("data", [])
    results = []
    for p in papers:
        if p.get("abstract"):
            doi = p.get("externalIds", {}).get("DOI", "DOI not available")
            results.append({
                "title": p["title"],
                "year": p.get("year"),
                "doi": doi,
                "abstract": p["abstract"][:300]
            })
    return results

PROMPT_TEMPLATE = """
You are the Researcher agent in a deliberative multi-agent system.
Your task is to UPDATE the EVIDENCE section of the shared argument.

Current argument state:
{argument_state}

Judge's feedback (if any):
{feedback}

Here are real academic papers related to the claim:
{papers}

Use these papers as your primary source. Extract 2-3 specific findings.
Return ONLY a JSON list with this structure:
[{{"finding": "...", "source": "title of the paper"}}]
No preamble. Do NOT include DOI.
"""
def extract_keywords(claim: str) -> str:
    response = client.models.generate_content(
        model="gemini-3.1-flash-lite-preview",
        contents=f"Extract 3-5 academic search keywords from this question. Return ONLY the keywords separated by spaces, no preamble:\n{claim}",
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=0)
        )
    )
    return response.text.strip()

def run(argument_state: dict, feedback: str = "") -> dict:
    keywords = extract_keywords(argument_state["claim"])
    papers = search_papers(keywords)
    print(f"Keywords: {keywords}")
    print(f"Papers found: {len(papers)}")
    for p in papers:
        print(f"  - {p['title']} | DOI: {p['doi']}")    
    prompt = PROMPT_TEMPLATE.format(
        argument_state=json.dumps(argument_state, indent=2),
        feedback=feedback,
        papers=json.dumps(papers, indent=2)
    )

    response = client.models.generate_content(
        model="gemini-3.1-flash-lite-preview",
        contents=prompt,
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=0)
        )
    )

    evidence = json.loads(response.text)

    # Inyectar DOI y year buscando por título en lugar de por índice
    for item in evidence:
        match = next(
            (p for p in papers if p["title"].lower() in item["source"].lower()
             or item["source"].lower() in p["title"].lower()),
            None
        )
        if match:
            item["doi"] = match["doi"]
            item["year"] = match["year"]
        else:
            item["doi"] = "DOI not available"
            item["year"] = None

    argument_state["evidence"] = evidence
    return argument_state