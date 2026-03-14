import json
from backend.agents import researcher, critic, synthesizer, judge

# Estado inicial del argumento
argument_state = {
    "claim": "Nuclear energy should be expanded as a climate solution.",
    "evidence": [],
    "counterarguments": [],
    "refined_position": ""
}

print("=== RESEARCHER ===")
argument_state = researcher.run(argument_state)
print(json.dumps(argument_state["evidence"], indent=2))

print("\n=== CRITIC ===")
argument_state = critic.run(argument_state)
print(json.dumps(argument_state["counterarguments"], indent=2))

print("\n=== SYNTHESIZER ===")
argument_state = synthesizer.run(argument_state)
print(argument_state["refined_position"])

print("\n=== JUDGE ===")
result = judge.run(argument_state)
print(json.dumps(result, indent=2))