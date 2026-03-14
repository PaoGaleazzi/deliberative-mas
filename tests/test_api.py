import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.api.server import app

client = TestClient(app)

def test_deliberate_single_agent():
    response = client.post("/deliberate", json={
        "question": "Do multi-agent systems outperform single models?",
        "mode": "single_agent",
        "max_iterations": 1
    })
    assert response.status_code == 200
    data = response.json()
    assert "final_answer" in data
    assert "reasoning_trace" in data
    assert "total_iterations" in data

def test_deliberate_multi_agent():
    response = client.post("/deliberate", json={
        "question": "Do multi-agent systems outperform single models?",
        "mode": "multi_agent",
        "max_iterations": 1
    })
    assert response.status_code == 200
    data = response.json()
    assert "final_answer" in data
    assert len(data["reasoning_trace"]) >= 1

def test_compare_endpoint():
    response = client.post("/compare", json={
        "question": "Do multi-agent systems outperform single models?",
        "responses": {
            "Single Agent": "MAS outperforms single models.",
            "Multi-Agent": "MAS is better but expensive."
        }
    })
    assert response.status_code == 200
    data = response.json()
    assert "analysis" in data
    assert len(data["analysis"]) > 0

def test_invalid_request():
    response = client.post("/deliberate", json={})
    assert response.status_code == 422