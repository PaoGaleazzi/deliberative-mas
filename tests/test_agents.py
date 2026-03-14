import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.agents import researcher, critic, synthesizer, judge

SAMPLE_STATE = {
    "claim": "Do multi-agent systems outperform single models on complex reasoning tasks?",
    "evidence": [],
    "counterarguments": [],
    "refined_position": ""
}

def test_researcher_returns_evidence():
    state = researcher.run(SAMPLE_STATE.copy())
    assert "evidence" in state
    assert isinstance(state["evidence"], list)
    assert len(state["evidence"]) > 0

def test_researcher_evidence_has_finding():
    state = researcher.run(SAMPLE_STATE.copy())
    for item in state["evidence"]:
        assert "finding" in item
        assert "source" in item

def test_critic_returns_counterarguments():
    state = SAMPLE_STATE.copy()
    state["evidence"] = [{"finding": "MAS improves reasoning", "source": "Test paper", "doi": "N/A"}]
    state = critic.run(state)
    assert "counterarguments" in state
    assert isinstance(state["counterarguments"], list)
    assert len(state["counterarguments"]) > 0

def test_synthesizer_returns_refined_position():
    state = SAMPLE_STATE.copy()
    state["evidence"] = [{"finding": "MAS improves reasoning", "source": "Test paper", "doi": "N/A"}]
    state["counterarguments"] = ["MAS is expensive"]
    state = synthesizer.run(state)
    assert "refined_position" in state
    assert isinstance(state["refined_position"], str)
    assert len(state["refined_position"]) > 0

def test_judge_returns_valid_structure():
    state = SAMPLE_STATE.copy()
    state["evidence"] = [{"finding": "MAS improves reasoning", "source": "Test paper", "doi": "N/A"}]
    state["counterarguments"] = ["MAS is expensive"]
    state["refined_position"] = "MAS outperforms single models in complex tasks."
    result = judge.run(state)
    assert "decision" in result
    assert result["decision"] in ["sufficient", "revise"]
    assert "feedback" in result
    assert "score" in result
    assert "evidence" in result["score"]
    assert "logic" in result["score"]
    assert "clarity" in result["score"]