import json
from backend.agents import researcher, critic, synthesizer, judge

def run_stream(question: str, max_iterations: int = 3):
    argument_state = {
        "claim": question,
        "evidence": [],
        "counterarguments": [],
        "refined_position": ""
    }

    reasoning_trace = []
    feedback = ""

    for i in range(max_iterations):
        yield f"data: {json.dumps({'event': 'iteration_start', 'iteration': i + 1})}\n\n"

        # Researcher
        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'researcher'})}\n\n"
        argument_state = researcher.run(argument_state, feedback)
        yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'researcher', 'data': {'evidence': argument_state['evidence']}})}\n\n"

        # Critic
        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'critic'})}\n\n"
        argument_state = critic.run(argument_state)
        yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'critic', 'data': {'counterarguments': argument_state['counterarguments']}})}\n\n"

        # Synthesizer
        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'synthesizer'})}\n\n"
        argument_state = synthesizer.run(argument_state)
        yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'synthesizer', 'data': {'refined_position': argument_state['refined_position']}})}\n\n"

        # Judge
        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'judge'})}\n\n"
        judge_result = judge.run(argument_state)
        yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'judge', 'data': judge_result})}\n\n"

        reasoning_trace.append({
            "iteration": i + 1,
            "researcher": {"evidence": argument_state["evidence"]},
            "critic": {"counterarguments": argument_state["counterarguments"]},
            "synthesizer": {"refined_position": argument_state["refined_position"]},
            "judge": judge_result
        })

        if judge_result["decision"] == "sufficient":
            break

        feedback = judge_result["feedback"]

    yield f"data: {json.dumps({'event': 'done', 'final_answer': argument_state['refined_position'], 'reasoning_trace': reasoning_trace, 'total_iterations': len(reasoning_trace)})}\n\n"


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

        if judge_result["decision"] == "sufficient":
            break

        feedback = judge_result["feedback"]

    return {
        "final_answer": argument_state["refined_position"],
        "reasoning_trace": reasoning_trace,
        "total_iterations": len(reasoning_trace)
    }