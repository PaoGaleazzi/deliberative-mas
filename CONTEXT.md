# CONTEXT.md — Deliberative Multi-Agent Reasoning System

> Documento de trabajo interno. Registra decisiones de diseño, flujo de desarrollo y estado del proyecto.
> Actualizar cada vez que se completa una capa.

---

## 1. ¿Qué estamos construyendo?

Una plataforma experimental para estudiar **razonamiento deliberativo en sistemas multi-agente basados en LLMs**.

El sistema simula una pequeña sociedad de 4 agentes especializados que colaboran iterativamente para responder preguntas. El objetivo no es solo producir respuestas, sino **hacer visible el proceso de razonamiento colectivo**.

### Hipótesis central
> La inteligencia no siempre emerge de un solo modelo, sino de la interacción estructurada entre múltiples agentes especializados.

---

## 2. Agentes del sistema

| Agente | Rol | Modelo asignado | Razón |
|---|---|---|---|
| **Researcher** | Genera evidencia inicial e hipótesis | `gemini-2.5-flash` sin razonamiento | Solo necesita amplitud y velocidad |
| **Critic** | Detecta debilidades y genera contraargumentos | `gemini-2.5-flash` con razonamiento | El pensamiento adversarial se beneficia del razonamiento interno |
| **Synthesizer** | Integra evidencia y crítica, mejora el argumento | `gemini-2.5-flash` con razonamiento | Integrar información contradictoria requiere más cuidado |
| **Judge** | Evalúa calidad y decide si continuar iterando | `gemini-2.5-pro` | Punto más crítico — controla el loop completo |

### Por qué esta asignación es interesante experimentalmente
Crea una pregunta de investigación implícita: **¿el modelo del Judge importa más que el de los demás agentes?** Si cambias solo el Judge de Pro a Flash y la calidad del debate cae, tienes evidencia de que el controlador del loop es el cuello de botella cognitivo del sistema.

### Cómo activar/desactivar razonamiento en Flash
```python
# Sin razonamiento (Researcher)
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt,
    config={"thinking_config": {"thinking_budget": 0}}
)

# Con razonamiento (Critic, Synthesizer)
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt,
    config={"thinking_config": {"thinking_budget": 8192}}
)
```

### Estado central del argumento (Argument State)
Cada agente modifica **una sección** del estado, no reescribe todo desde cero.

```json
{
  "claim": "",
  "evidence": [],
  "counterarguments": [],
  "refined_position": ""
}
```

---

## 3. Flujo del sistema

```
User Question
      │
      ▼
Researcher  →  actualiza evidence         [Flash, sin razonamiento]
      │
      ▼
Critic      →  actualiza counterarguments [Flash, con razonamiento]
      │
      ▼
Synthesizer →  actualiza refined_position [Flash, con razonamiento]
      │
      ▼
Judge       →  evalúa calidad             [Pro]
     / \
    /   \
sufficient  revise
    │         │
respuesta   feedback → nueva iteración (máx. 3)
final             ▲
                  └── Researcher recibe feedback
```

---

## 4. Estructura del proyecto

```
deliberative-mas/
├── backend/
│   ├── agents/
│   │   ├── researcher.py     ← gemini-2.5-flash, sin razonamiento
│   │   ├── critic.py         ← gemini-2.5-flash, con razonamiento
│   │   ├── synthesizer.py    ← gemini-2.5-flash, con razonamiento
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
├── README.md
└── CONTEXT.md
```

---

## 5. Plan de desarrollo por capas

### 🟦 Capa 0 — Setup del repositorio
**Estado:** `[ ]`

- [ ] Crear repo en GitHub
- [ ] `uv init` + `uv sync`
- [ ] `uv add google-generativeai fastapi uvicorn python-dotenv`
- [ ] Crear `.env` con `GOOGLE_API_KEY`
- [ ] Agregar `.env` y `CONTEXT.md` al `.gitignore`
- [ ] Primer commit: estructura de carpetas vacía

**Criterio de éxito:** repo limpio con estructura, sin código aún.

---

### 🟦 Capa 1 — Prompts de agentes
**Estado:** `[ ]`

Cada agente tiene un prompt especializado que opera sobre el **Argument State**.

**Researcher** — Flash sin razonamiento:
```
You are the Researcher agent in a deliberative multi-agent system.
Your task is to UPDATE the EVIDENCE section of the shared argument.

Current argument state:
{argument_state}

Judge's feedback (if any):
{feedback}

Add 2-3 relevant facts, studies, or examples that support or contextualize the claim.
Return ONLY the updated evidence as a JSON list. No preamble.
```

**Critic** — Flash con razonamiento:
```
You are the Critic agent in a deliberative multi-agent system.
Your task is to UPDATE the COUNTERARGUMENTS section.

Current argument state:
{argument_state}

Identify 1-3 specific weaknesses, inconsistencies, or gaps in the evidence.
Return ONLY the updated counterarguments as a JSON list. No preamble.
```

**Synthesizer** — Flash con razonamiento:
```
You are the Synthesizer agent in a deliberative multi-agent system.
Your task is to UPDATE the REFINED_POSITION field.

Current argument state:
{argument_state}

Integrate the evidence and counterarguments into a coherent, improved position.
Return ONLY the refined_position as a string. No preamble.
```

**Judge** — Pro:
```
You are the Judge agent in a deliberative multi-agent system.
Evaluate the current argument quality.

Current argument state:
{argument_state}

Return ONLY a JSON object with this exact structure:
{
  "decision": "sufficient" | "revise",
  "feedback": "...",
  "score": {
    "evidence": 0.0-1.0,
    "logic": 0.0-1.0,
    "clarity": 0.0-1.0
  }
}
```

**Criterio de éxito:** cada prompt genera salida parseable de forma consistente.

---

### 🟦 Capa 2 — Backend: Agentes individuales
**Estado:** `[ ]`

Cada agente como función que recibe `argument_state`, llama a Gemini con su modelo y configuración asignados, parsea la respuesta y devuelve el estado actualizado.

**Criterio de éxito:** cada agente corre de forma independiente y actualiza correctamente su sección.

---

### 🟦 Capa 3 — Backend: Deliberation Loop
**Estado:** `[ ]`

`deliberation_loop.py` debe:
- Recibir pregunta del usuario
- Ejecutar agentes en orden
- Almacenar el **reasoning trace** completo por iteración, incluyendo modelo usado
- Repetir si el Judge dice `"revise"` (máximo 3 iteraciones)
- Retornar respuesta final + trace completo

**Estructura del reasoning trace:**
```json
[
  {
    "iteration": 1,
    "researcher": { "evidence": [...], "model": "gemini-2.5-flash" },
    "critic": { "counterarguments": [...], "model": "gemini-2.5-flash-thinking" },
    "synthesizer": { "refined_position": "...", "model": "gemini-2.5-flash-thinking" },
    "judge": {
      "decision": "revise",
      "feedback": "...",
      "score": { "evidence": 0.7, "logic": 0.6, "clarity": 0.8 },
      "model": "gemini-2.5-pro"
    }
  }
]
```

**Criterio de éxito:** el loop corre 1-3 iteraciones y devuelve un trace JSON limpio.

---

### 🟦 Capa 4 — Backend: API REST
**Estado:** `[ ]`

```
POST /deliberate
{
  "question": "¿Debería expandirse la energía nuclear?",
  "mode": "multi_agent" | "single_agent",
  "max_iterations": 3
}
```

**Criterio de éxito:** Postman recibe respuesta JSON válida.

---

### 🟦 Capa 5 — Frontend: Estructura base
**Estado:** `[ ]`

Input de pregunta + botón + respuesta en texto plano.

**Criterio de éxito:** la UI se conecta al backend y muestra la respuesta.

---

### 🟦 Capa 6 — Frontend: Visualización del grafo
**Estado:** `[ ]`

- React Flow con 4 nodos, cada uno mostrando su modelo asignado
- Aristas animadas al enviar mensajes
- Burbujas de diálogo con contenido

**Criterio de éxito:** el grafo muestra el flujo de deliberación en tiempo real.

---

### 🟦 Capa 7 — Frontend: Panel de historial
**Estado:** `[ ]`

- Transcript completo por iteración
- Scores del Judge con barra visual
- Toggle de modo

**Criterio de éxito:** el usuario puede leer el debate completo.

---

### 🟦 Capa 8 — Experimentos
**Estado:** `[ ]`

**Modos comparativos:**

| Modo | Descripción |
|---|---|
| **A** — Single Agent | Un solo modelo responde directamente |
| **B** — Multi-Agent, 1 iteración | Pipeline completo, una sola vuelta |
| **C** — Multi-Agent + loops | Reflection loop, hasta 3 iteraciones |

**Experimento de variación de modelos:**

| Config | Researcher | Critic | Synthesizer | Judge |
|---|---|---|---|---|
| Base | Flash | Flash-thinking | Flash-thinking | Pro |
| Sin razonamiento | Flash | Flash | Flash | Pro |
| Judge degradado | Flash | Flash-thinking | Flash-thinking | Flash |
| Todo Pro | Pro | Pro | Pro | Pro |

Permite aislar qué agente contribuye más a la calidad del debate.

**Métricas a registrar:** score del Judge, número de iteraciones, modelo por agente.

**Criterio de éxito:** los modos producen datos comparables y exportables.

---

## 6. Stack tecnológico

| Capa | Tecnología |
|---|---|
| LLM | Google Gemini API (`google-generativeai`) |
| Backend | Python + FastAPI |
| Frontend | React + React Flow + Framer Motion |
| Gestión de entorno | uv |
| Control de versiones | Git + GitHub |

---

## 7. Variables de entorno

```
GOOGLE_API_KEY=...
```

Nunca subir al repositorio. Usar `.env` en `.gitignore`.

---

## 8. Convención de commits

```
feat: descripción de nueva funcionalidad
fix: descripción del bug corregido
refactor: mejora de código sin cambio funcional
docs: actualización de documentación
test: agrega o modifica pruebas
```

---

## 9. Estado actual del proyecto

| Capa | Estado |
|---|---|
| Capa 0 — Setup | `[ ] Pendiente` |
| Capa 1 — Prompts | `[ ] Pendiente` |
| Capa 2 — Agentes | `[ ] Pendiente` |
| Capa 3 — Loop | `[ ] Pendiente` |
| Capa 4 — API | `[ ] Pendiente` |
| Capa 5 — Frontend base | `[ ] Pendiente` |
| Capa 6 — Grafo visual | `[ ] Pendiente` |
| Capa 7 — Panel historial | `[ ] Pendiente` |
| Capa 8 — Experimentos | `[ ] Pendiente` |

---

## 10. Notas de diseño importantes

- Los agentes modifican **una sección** del `argument_state`, no reescriben desde cero. Evita repetición y divergencia.
- El Judge usa Pro porque controla el loop completo. Un Judge débil puede terminar iteraciones prematuramente o nunca converger.
- Registrar el modelo en cada entrada del trace permite analizar qué modelo contribuye más a la calidad del debate.
- Prioridad del prototipo: **claridad arquitectónica > performance**. No optimizar para producción hasta tener los experimentos funcionando.
