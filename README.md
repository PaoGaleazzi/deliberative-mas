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
| **Researcher** | Generates initial evidence and hypothesis | `gemini-3.1-flash-lite-preview` (no thinking) | Breadth and speed are sufficient for evidence gathering |
| **Critic** | Identifies weaknesses and counterarguments | `gemini-3-flash-preview` (thinking enabled) | Adversarial analysis benefits from extended internal reasoning |
| **Synthesizer** | Integrates evidence and critique into a refined position | `gemini-3-flash-preview` (thinking enabled) | Resolving contradictions requires careful step-by-step reasoning |
| **Judge** | Evaluates argument quality and controls the loop | `gemini-3.1-pro-preview` | Most critical role — its decision determines whether the system iterates or terminates |

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
Researcher  →  searches arXiv, updates evidence    [gemini-3.1-flash-lite]
      │
      ▼
Critic      →  updates counterarguments            [gemini-3-flash + thinking]
      │
      ▼
Synthesizer →  updates refined_position            [gemini-3-flash + thinking]
      │
      ▼
Judge       →  evaluates quality                   [gemini-3.1-pro]
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

## Paper Search

The Researcher agent queries **arXiv** to retrieve real academic papers as evidence. Keywords are extracted from the user's question and used to search for relevant papers. DOIs are injected directly from the API — the model only extracts findings from the provided abstracts, never generates citations from training data.

This grounds the deliberation in verifiable academic sources rather than model knowledge alone.

---

## Reasoning Trace

Every agent interaction is stored in a structured log that records which model produced each output — enabling both interpretability and post-hoc analysis of model contribution.

```json
[
  {
    "iteration": 1,
    "researcher": {
      "evidence": [{"finding": "...", "source": "...", "doi": "..."}]
    },
    "critic": {
      "counterarguments": ["..."]
    },
    "synthesizer": {
      "refined_position": "..."
    },
    "judge": {
      "decision": "revise",
      "feedback": "The argument needs more empirical evidence.",
      "score": {
        "evidence": 0.65,
        "logic": 0.70,
        "clarity": 0.80
      }
    }
  }
]
```

---

## Experimental Modes

### Deliberation Modes

| Mode | Description |
|---|---|
| **A — Single Agent** | One model responds directly to the question using the same arXiv papers |
| **B — Multi-Agent (1 iteration)** | Full agent pipeline runs once |
| **C — Multi-Agent + Reflection** | Iterative loop runs up to 3 times based on Judge evaluation |

### Comparator Agent

After running any two or more modes on the same question, a **Comparator agent** produces a structured analysis comparing the responses across:

- Strength of core argument
- Quality and specificity of evidence
- Depth of counterargument handling
- Logical consistency
- Nuance and intellectual honesty

The comparator scores each response 1–5 per criterion and declares a winner based strictly on argumentative quality, not formatting or length.

---

## Planned Experiments

The following experiments are designed to isolate the contribution of each architectural component to final argument quality. Results will be recorded during the research stay.

### Experiment 1 — Deliberation Mode Comparison

**Question:** Does iterative deliberation improve argument quality over single-pass responses?

**Method:** Run the same question in modes A, B, and C. Record Judge scores (evidence, logic, clarity) and total iterations per mode.

**Hypothesis:** Mode C will produce higher Judge scores than Mode B, and Mode B higher than Mode A.

| Mode | Evidence | Logic | Clarity | Iterations |
|---|---|---|---|---|
| A — Single Agent | — | — | — | 1 |
| B — Multi-Agent (1 iter) | | | | 1 |
| C — Multi-Agent + Loops | | | | 1–3 |

---

### Experiment 2 — Impact of the Judge Model

**Question:** Does the Judge's model quality affect the overall quality of deliberation?

**Method:** Run the same question with two configurations — Pro Judge vs Flash-lite Judge — holding all other agents constant.

**Hypothesis:** A weaker Judge will terminate iterations prematurely, producing lower-quality final arguments.

| Configuration | Judge Model | Avg Score | Iterations |
|---|---|---|---|
| Base | gemini-3.1-pro | | |
| Degraded Judge | gemini-3.1-flash-lite | | |

---

### Experiment 3 — Impact of Agent Reasoning

**Question:** Does enabling extended thinking in the Critic and Synthesizer improve argument quality?

**Method:** Compare base configuration (Flash + thinking) against no-reasoning configuration (Flash, thinking disabled) for Critic and Synthesizer.

**Hypothesis:** Extended thinking in adversarial and synthesis roles produces more nuanced counterarguments and better-integrated positions.

| Configuration | Critic | Synthesizer | Avg Score |
|---|---|---|---|
| Base | Flash + thinking | Flash + thinking | |
| No reasoning | Flash | Flash | |

---

## Interface

The system includes a web interface that visualizes the deliberation process in real time.

**Key components:**
- **Agent graph** — Interactive node-link diagram showing which agents are active, which model each uses, and how they communicate
- **Animated avatars** — Geometric figures per agent that pulse when active, with dialogue bubbles showing current status
- **Animated edges** — Lines animate when an agent sends a message to another
- **Reasoning panel** — Full iteration-by-iteration transcript with Judge scores and paper links
- **Comparator panel** — Structured comparison table across modes with winner declaration

---

## Project Structure

```
deliberative-mas/
├── backend/
│   ├── agents/
│   │   ├── researcher.py     ← gemini-3.1-flash-lite, no thinking, arXiv search
│   │   ├── critic.py         ← gemini-3-flash, thinking enabled
│   │   ├── synthesizer.py    ← gemini-3-flash, thinking enabled
│   │   └── judge.py          ← gemini-3.1-pro, defensive JSON parsing
│   ├── engine/
│   │   └── deliberation_loop.py
│   └── api/
│       └── server.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AgentGraph.jsx
│   │   │   ├── AgentAvatar.jsx
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
| LLM | Google Gemini API (`google-genai`) |
| Models | `gemini-3.1-flash-lite-preview`, `gemini-3-flash-preview`, `gemini-3.1-pro-preview` |
| Paper search | arXiv API |
| Backend | Python + FastAPI |
| Frontend | React + Vite + React Flow + Framer Motion |
| Environment | uv |

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google AI API key

### Backend

```bash
git clone https://github.com/PaoGaleazzi/deliberative-mas.git
cd deliberative-mas

uv sync

echo "GOOGLE_API_KEY=your_key_here" > .env

uv run uvicorn backend.api.server:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## API Reference

### `POST /deliberate`

```json
{
  "question": "Do multi-agent systems outperform single models on complex reasoning tasks?",
  "mode": "multi_agent",
  "max_iterations": 3
}
```

### `POST /compare`

```json
{
  "question": "...",
  "responses": {
    "A — Single Agent": "...",
    "C — Multi-Agent + Loops": "..."
  }
}
```

---

## Tests

```bash
uv run pytest tests/ -v
```

13 tests covering individual agent output validation, full loop execution, and API response format.

---

## Design Decisions

**Structured argument state over free-form exchange**
Unconstrained agent loops tend to produce repetition and argument drift after 2+ iterations. Having each agent update only its section of a shared structure enforces focus and produces measurable convergence.

**Asymmetric model assignment**
Using different models per agent reflects the cognitive asymmetry of the roles. The Researcher needs breadth; the Critic and Synthesizer need depth of reasoning; the Judge needs the highest reliability since its decision controls the entire loop.

**Judge as loop controller**
Rather than running a fixed number of iterations, the Judge decides whether quality warrants another cycle. This creates adaptive deliberation that terminates when sufficient quality is reached.

**DOIs injected from API, not generated by model**
The Researcher extracts keywords, searches arXiv, and receives real paper metadata. DOIs are matched by title similarity and injected into the evidence — the model never generates citations from training data.

**Streaming over batch responses**
The deliberation loop emits Server-Sent Events as each agent completes, allowing the frontend to visualize reasoning in real time rather than waiting for the full result.

---

## Limitations and Future Work

- Paper search currently uses arXiv, optimized for AI/ML/CS questions. Integration with Semantic Scholar (API key pending) will expand coverage to other domains.
- Agent prompts are optimized for analytical questions; highly ambiguous questions may reduce output structure reliability.
- Possible extensions: persistent memory across sessions, configurable agent topologies, multi-provider model mixing, export of reasoning traces for offline analysis.

---

## Research Context

This project was developed as part of a research stay exploring deliberation mechanisms in multi-agent AI systems. It serves as an experimental testbed for studying how structured agent interaction and model selection affect the quality and interpretability of collective LLM reasoning.

