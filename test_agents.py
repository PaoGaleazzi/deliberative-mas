import json
from backend.engine.deliberation_loop import run

result = run("Should nuclear energy be expanded as a climate solution?")

print("\n=== FINAL ANSWER ===")
print(result["final_answer"])

print(f"\n=== TOTAL ITERATIONS: {result['total_iterations']} ===")

print("\n=== REASONING TRACE ===")
print(json.dumps(result["reasoning_trace"], indent=2))