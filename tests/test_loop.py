import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.engine.deliberation_loop import run

def test_loop_returns_valid_structure():
    result = run("Do multi-agent systems outperform single models?", max_iterations=1)
    assert "final_answer" in result
    assert "reasoning_trace" in result
    assert "total_iterations" in result
    assert isinstance(result["final_answer"], str)
    assert len(result["final_answer"]) > 0

def test_loop_trace_has_all_agents():
    result = run("Do multi-agent systems outperform single models?", max_iterations=1)
    assert len(result["reasoning_trace"]) >= 1
    iteration = result["reasoning_trace"][0]
    assert "researcher" in iteration
    assert "critic" in iteration
    assert "synthesizer" in iteration
    assert "judge" in iteration

def test_loop_respects_max_iterations():
    result = run("Do multi-agent systems outperform single models?", max_iterations=2)
    assert result["total_iterations"] <= 2

def test_loop_judge_decision_is_valid():
    result = run("Do multi-agent systems outperform single models?", max_iterations=1)
    judge_result = result["reasoning_trace"][0]["judge"]
    assert judge_result["decision"] in ["sufficient", "revise"]