import json
from backend.agents import researcher, critic, synthesizer, judge

def run(question: str, max_iterations: int = 3) -> dict:
    argument_state = {
        "claim": question,
        "evidence": [],
        "counterarguments": [],
        "refined_position": ""
    }

    reasoning_trace = []
    feedback = ""

    for i in range(max_iterations):
        print(f"\n--- Iteration {i + 1} ---")

        argument_state = researcher.run(argument_state, feedback)
        argument_state = critic.run(argument_state)
        argument_state = synthesizer.run(argument_state)
        judge_result = judge.run(argument_state)

        reasoning_trace.append({
            "iteration": i + 1,
            "researcher": {"evidence": argument_state["evidence"]},
            "critic": {"counterarguments": argument_state["counterarguments"]},
            "synthesizer": {"refined_position": argument_state["refined_position"]},
            "judge": judge_result
        })

        print(f"Judge decision: {judge_result['decision']} | Score: {judge_result['score']}")

        if judge_result["decision"] == "sufficient":
            break

        feedback = judge_result["feedback"]

    return {
        "final_answer": argument_state["refined_position"],
        "reasoning_trace": reasoning_trace,
        "total_iterations": len(reasoning_trace)
    }