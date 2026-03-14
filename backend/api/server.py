from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.engine.deliberation_loop import run

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class DeliberateRequest(BaseModel):
    question: str
    max_iterations: int = 3

@app.post("/deliberate")
def deliberate(request: DeliberateRequest):
    result = run(request.question, request.max_iterations)
    return result