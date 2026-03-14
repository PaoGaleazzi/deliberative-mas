from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.engine.deliberation_loop import run
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv
import json

load_dotenv()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class DeliberateRequest(BaseModel):
    question: str
    mode: str = "multi_agent"
    max_iterations: int = 3

def single_agent(question: str) -> dict:
    from backend.agents.researcher import search_papers, extract_keywords
    
    keywords = extract_keywords(question)
    papers = search_papers(keywords)
    
    prompt = f"""You are an expert researcher answering a complex question.
    
Question: {question}

Here are real academic papers related to this question:
{json.dumps(papers, indent=2)}

Use these papers as your primary source. Write a comprehensive, well-structured answer.
Address the question directly, present evidence, consider counterarguments, and reach a clear conclusion.
"""
    
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=8192)
        )
    )
    return {
        "final_answer": response.text,
        "reasoning_trace": [],
        "total_iterations": 1,
        "papers": papers
    }

@app.post("/deliberate")
def deliberate(request: DeliberateRequest):
    if request.mode == "single_agent":
        return single_agent(request.question)
    return run(request.question, request.max_iterations)

class CompareRequest(BaseModel):
    question: str
    responses: dict  # {"Single Agent": "...", "Multi-Agent": "..."}

@app.post("/compare")
def compare(request: CompareRequest):
    responses_text = "\n\n".join([
        f"### {label}:\n{text}" 
        for label, text in request.responses.items()
    ])
    
    labels = list(request.responses.keys())
    
    prompt = f"""You are an expert evaluator comparing AI-generated responses to the same question.

Question: {request.question}

{responses_text}

Produce a structured comparison with exactly this format:

## Comparison Table
A markdown table with rows for these criteria and one column per response:
- Key arguments covered
- Use of specific evidence
- Handling of counterarguments
- Nuance and balance
- Clarity

## What each response covers uniquely
For each response, list 2-3 arguments or concepts that ONLY appear in that response and not in the others.

## Which is most complete and why
2-3 sentences explaining which response covers the question most thoroughly and why.

## 🏆 Winner
One line: declare the winner and the single most important reason why.
"""
    
    response = client.models.generate_content(
        model="gemini-3.1-pro-preview",
        contents=prompt,
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=8192)
        )
    )
    return {"analysis": response.text}