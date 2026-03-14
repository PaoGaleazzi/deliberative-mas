# Deliberative Multi-Agent Reasoning System

> An experimental platform for studying deliberative reasoning in LLM-based multi-agent systems.

---

## Overview

This project implements a **deliberative multi-agent system** where a small society of specialized LLM agents collaborates iteratively to answer questions. Rather than producing a single response, the system makes the collective reasoning process visible and analyzable.

The system is designed as an experimental environment to study:

- Coordination dynamics between specialized agents
- The impact of structured deliberation on argument quality
- Iterative reasoning improvement through reflection loops
- The effect of model choice per agent role on collective output quality
- Interpretability of emergent collective reasoning

### Central Hypothesis
> Intelligence does not always emerge from a single model, but from structured interaction between specialized agents.

---

## System Architecture

### Agents and Model Assignments

Each agent is assigned a specific model based on its cognitive role in the deliberation process:

| Agent | Role | Model | Reasoning |
|---|---|---|---|
| **Researcher** | Generates initial evidence and hypothesis | `gemini-2.5-flash` (no thinking) | Breadth and speed are sufficient for evidence gathering |
| **Critic** | Identifies weaknesses and counterarguments | `gemini-2.5-flash` (thinking enabled) | Adversarial analysis benefits from extended internal reasoning |
| **Synthesizer** | Integrates evidence and critique into a refined position | `gemini-2.5-flash` (thinking enabled) | Resolving contradictions requires careful step-by-step reasoning |
| **Judge** | Evaluates argument quality and controls the loop | `gemini-2.5-pro` | Most critical role — its decision determines whether the system iterates or terminates |

This assignment creates an interesting implicit research question: **does the Judge's model quality matter more than the other agents?** Swapping only the Judge from Pro to Flash while holding others constant isolates the contribution of the loop controller.

### Shared Argument State

Rather than free-form text exchange, agents operate on a **shared structured argument state**. Each agent modifies only its designated section, preventing the argument drift and repetition common in unconstrained agent loops.

```json
{
  "claim": "",
  "evidence": [],
  "counterarguments": [],
  "refined_position": ""
}
```

### Deliberation Loop

```
User Question
      │
      ▼
Researcher  →  updates evidence         [gemini-2.5-flash]
      │
      ▼
Critic      →  updates counterarguments [gemini-2.5-flash + thinking]
      │
      ▼
Synthesizer →  updates refined_position [gemini-2.5-flash + thinking]
      │
      ▼
Judge       →  evaluates quality        [gemini-2.5-pro]
     / \
    /   \
sufficient  revise
    │         │
  final     feedback → next iteration
 answer           ▲
                  └── max 3 iterations
```

The loop implements a **reflection mechanism**: each iteration refines the same argument structure rather than restarting, producing measurable convergence across rounds.

---

## Reasoning Trace

Every agent interaction is stored in a structured log that records which model produced each output — enabling both interpretability and post-hoc analysis of model contribution.

```json
[
  {
    "iteration": 1,
    "researcher": {
      "evidence": ["..."],
      "model": "gemini-2.5-flash"
    },
    "critic": {
      "counterarguments": ["..."],
      "model": "gemini-2.5-flash-thinking"
    },
    "synthesizer": {
      "refined_position": "...",
      "model": "gemini-2.5-flash-thinking"
    },
    "judge": {
      "decision": "revise",
      "feedback": "The argument needs more empirical evidence.",
      "score": {
        "evidence": 0.65,
        "logic": 0.70,
        "clarity": 0.80
      },
      "model": "gemini-2.5-pro"
    }
  }
]
```

---

## Experimental Modes

### Deliberation Modes

| Mode | Description |
|---|---|
| **A — Single Agent** | One model responds directly to the question |
| **B — Multi-Agent (1 iteration)** | Full agent pipeline runs once |
| **C — Multi-Agent + Reflection** | Iterative loop runs up to 3 times based on Judge evaluation |

### Model Configuration Experiments

| Configuration | Researcher | Critic | Synthesizer | Judge |
|---|---|---|---|---|
| **Base** | Flash | Flash + thinking | Flash + thinking | Pro |
| **No reasoning** | Flash | Flash | Flash | Pro |
| **Degraded Judge** | Flash | Flash + thinking | Flash + thinking | Flash |
| **All Pro** | Pro | Pro | Pro | Pro |

Holding agent roles constant while varying model assignments allows isolation of each agent's contribution to final argument quality.

### Evaluation Metrics

Each response is scored by the Judge agent across three dimensions:

| Metric | Description |
|---|---|
| `evidence` | Quality and relevance of supporting evidence |
| `logic` | Internal coherence of the argument |
| `clarity` | Accessibility and precision of the formulation |

Scores are recorded per iteration and per model configuration, enabling quantitative comparison across experimental conditions.

---

## Interface

The system includes a web interface that visualizes the deliberation process in real time.

**Key components:**
- **Agent graph** — Interactive node-link diagram showing which agents are active, which model each uses, and how they communicate
- **Animated edges** — Lines appear when an agent sends a message to another
- **Dialogue bubbles** — Each agent's output appears as a labeled message
- **Reasoning panel** — Lateral panel with the full iteration-by-iteration transcript and Judge scores

---

## Project Structure

```
deliberative-mas/
├── backend/
│   ├── agents/
│   │   ├── researcher.py     ← gemini-2.5-flash, no thinking
│   │   ├── critic.py         ← gemini-2.5-flash, thinking enabled
│   │   ├── synthesizer.py    ← gemini-2.5-flash, thinking enabled
│   │   └── judge.py          ← gemini-2.5-pro
│   ├── engine/
│   │   └── deliberation_loop.py
│   └── api/
│       └── server.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AgentGraph.jsx
│   │   │   ├── DialogBubble.jsx
│   │   │   └── ReasoningPanel.jsx
│   │   └── App.jsx
│   └── package.json
├── tests/
│   ├── test_agents.py
│   ├── test_loop.py
│   └── test_api.py
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | Google Gemini API (`google-generativeai`) |
| Models | `gemini-2.5-flash`, `gemini-2.5-flash` (thinking), `gemini-2.5-pro` |
| Backend | Python + FastAPI |
| Frontend | React + React Flow + Framer Motion |
| Environment | uv |

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google AI API key

### Backend

```bash
git clone https://github.com/<your-username>/deliberative-mas.git
cd deliberative-mas

uv sync

echo "GOOGLE_API_KEY=your_key_here" > .env

cd backend
uvicorn api.server:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## API Reference

### `POST /deliberate`

```json
{
  "question": "Should nuclear energy be expanded as a climate solution?",
  "mode": "multi_agent",
  "max_iterations": 3
}
```

**Response:**
```json
{
  "final_answer": "...",
  "reasoning_trace": [...],
  "total_iterations": 2
}
```

---

## Tests

```bash
pytest tests/
pytest tests/test_loop.py -v
```

Test coverage includes individual agent output validation, full loop execution, and API response format.

---

## Design Decisions

**Structured argument state over free-form exchange**  
Unconstrained agent loops tend to produce repetition and argument drift after 2+ iterations. Having each agent update only its section of a shared structure enforces focus and produces measurable convergence.

**Asymmetric model assignment**  
Using different models per agent reflects the cognitive asymmetry of the roles. The Researcher needs breadth; the Critic and Synthesizer need depth of reasoning; the Judge needs the highest reliability since its decision controls the entire loop.

**Judge as loop controller**  
Rather than running a fixed number of iterations, the Judge decides whether quality warrants another cycle. This creates adaptive deliberation that terminates when sufficient quality is reached.

**Model recorded in reasoning trace**  
Every entry in the reasoning trace includes which model produced it. This makes post-hoc analysis of model contribution possible without re-running experiments.

---

## Limitations and Future Work

- Agent prompts are optimized for analytical questions; highly ambiguous questions may reduce output structure reliability.
- The evaluation rubric reflects a specific normative view of argument quality. Future versions could allow configurable criteria.
- Possible extensions: persistent memory across sessions, configurable agent topologies, multi-provider model mixing, agent communication protocols.

---

## Research Context

This project was developed as part of a research stay exploring deliberation mechanisms in multi-agent AI systems. It serves as an experimental testbed for studying how structured agent interaction and model selection affect the quality and interpretability of collective LLM reasoning.

---

## License

MIT
