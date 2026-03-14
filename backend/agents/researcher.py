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
    url = "http://export.arxiv.org/api/query"
    params = {
        "search_query": f"all:{query}",
        "max_results": limit,
        "sortBy": "relevance"
    }
    response = requests.get(url, params=params)
    
    import xml.etree.ElementTree as ET
    root = ET.fromstring(response.content)
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    
    results = []
    for entry in root.findall("atom:entry", ns):
        title = entry.find("atom:title", ns).text.strip()
        abstract = entry.find("atom:summary", ns).text.strip()
        arxiv_id = entry.find("atom:id", ns).text.strip()
        
        results.append({
            "title": title,
            "year": None,
            "doi": arxiv_id,
            "abstract": abstract[:300]
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