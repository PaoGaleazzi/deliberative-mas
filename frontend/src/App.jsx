import { useState } from "react"
import axios from "axios"
import AgentGraph from "./components/AgentGraph"
import ReasoningPanel from "./components/ReasoningPanel"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

function App() {
  const [question, setQuestion] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeAgent, setActiveAgent] = useState(null)
  const [mode, setMode] = useState("multi_agent")
  const [maxIterations, setMaxIterations] = useState(3)
  const [savedResults, setSavedResults] = useState({})
  const [comparison, setComparison] = useState(null)
  const [comparing, setComparing] = useState(false)
  const [streamingTrace, setStreamingTrace] = useState([])
  const [currentIteration, setCurrentIteration] = useState(null)

  const handleSubmit = async () => {
    if (!question.trim()) return
    setLoading(true)
    setResult(null)
    setActiveAgent(null)
    setStreamingTrace([])
    setCurrentIteration(null)

    const response = await fetch("http://127.0.0.1:8000/deliberate-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        mode,
        max_iterations: mode === "multi_agent_1" ? 1 : maxIterations
      })
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    let currentIter = {}

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value)
      const lines = text.split("\n").filter(l => l.startsWith("data: "))

      for (const line of lines) {
        const data = JSON.parse(line.slice(6))

        if (data.event === "iteration_start") {
          setCurrentIteration(data.iteration)
          currentIter = { iteration: data.iteration }
        }

        if (data.event === "agent_start") {
          setActiveAgent(data.agent)
        }

        if (data.event === "agent_done") {
          setActiveAgent(null)
          if (data.agent === "researcher") currentIter.researcher = data.data
          if (data.agent === "critic") currentIter.critic = data.data
          if (data.agent === "synthesizer") currentIter.synthesizer = data.data
          if (data.agent === "judge") {
            currentIter.judge = data.data
            setStreamingTrace(prev => [...prev, { ...currentIter }])
          }
        }

        if (data.event === "done") {
          const finalResult = {
            final_answer: data.final_answer,
            reasoning_trace: data.reasoning_trace,
            total_iterations: data.total_iterations,
            papers: data.papers
          }
          setResult(finalResult)
          setSavedResults(prev => ({ ...prev, [mode]: finalResult }))
          setActiveAgent(null)
          setCurrentIteration(null)
        }
      }
    }

    setLoading(false)
  }

  const handleCompare = async () => {
    setComparing(true)
    setComparison(null)
    try {
      const responses = {}
      if (savedResults["single_agent"]) responses["A — Single Agent"] = savedResults["single_agent"].final_answer
      if (savedResults["multi_agent_1"]) responses["B — Multi-Agent (1 iter)"] = savedResults["multi_agent_1"].final_answer
      if (savedResults["multi_agent"]) responses["C — Multi-Agent + Loops"] = savedResults["multi_agent"].final_answer

      const response = await axios.post("http://127.0.0.1:8000/compare", {
        question,
        responses
      })
      setComparison(response.data.analysis)
    } catch (error) {
      console.error(error)
    } finally {
      setComparing(false)
    }
  }

  const canCompare = Object.keys(savedResults).length >= 2

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 20px" }}>
      <h1>Deliberative Multi-Agent System</h1>

      <AgentGraph activeAgent={activeAgent} currentIteration={currentIteration} />

      {currentIteration && (
        <p style={{ color: "#ffd700", textAlign: "center" }}>
          Iteration {currentIteration} — {activeAgent ? `${activeAgent} thinking...` : "processing..."}
        </p>
      )}

      <div style={{ marginTop: 24 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          {[
            { value: "single_agent", label: "A — Single Agent" },
            { value: "multi_agent_1", label: "B — Multi-Agent (1 iter)" },
            { value: "multi_agent", label: "C — Multi-Agent + Loops" }
          ].map(m => (
            <button
              key={m.value}
              onClick={() => { setMode(m.value); setResult(savedResults[m.value] || null) }}
              style={{
                padding: "8px 16px",
                fontSize: 14,
                background: mode === m.value ? "#ffd700" : "#1a1a2e",
                color: mode === m.value ? "#000" : "#e0e0e0",
                border: `1px solid ${savedResults[m.value] ? "#4aff9e" : "#ffd700"}`,
                borderRadius: 8,
                cursor: "pointer"
              }}
            >
              {m.label} {savedResults[m.value] ? "✓" : ""}
            </button>
          ))}
        </div>

        {mode !== "single_agent" && mode !== "multi_agent_1" && (
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ color: "#e0e0e0", fontSize: 14 }}>Max iterations:</label>
            {[1, 2, 3].map(n => (
              <button
                key={n}
                onClick={() => setMaxIterations(n)}
                style={{
                  width: 36, height: 36, fontSize: 14,
                  background: maxIterations === n ? "#ffd700" : "#1a1a2e",
                  color: maxIterations === n ? "#000" : "#e0e0e0",
                  border: "1px solid #ffd700",
                  borderRadius: 8, cursor: "pointer"
                }}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        <textarea
          rows={3}
          style={{ width: "100%", fontSize: 16, padding: 10, boxSizing: "border-box" }}
          placeholder="Enter your question..."
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value)
            setSavedResults({})
            setComparison(null)
          }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ padding: "10px 24px", fontSize: 16 }}
          >
            {loading ? "Deliberating..." : "Deliberate"}
          </button>

          {canCompare && (
            <button
              onClick={handleCompare}
              disabled={comparing}
              style={{
                padding: "10px 24px", fontSize: 16,
                background: "#4aff9e", color: "#000",
                border: "none", borderRadius: 8, cursor: "pointer"
              }}
            >
              {comparing ? "Comparing..." : "⚖️ Compare these results"}
            </button>
          )}
        </div>
      </div>

      {/* Streaming trace en vivo */}
      {streamingTrace.length > 0 && !result && (
        <div style={{ marginTop: 30 }}>
          <h2>Reasoning in progress...</h2>
          <ReasoningPanel trace={streamingTrace} />
        </div>
      )}

      {comparison && (
        <div style={{
          marginTop: 30, background: "#0d0d1a",
          border: "1px solid #4aff9e", borderRadius: 12, padding: 20
        }}>
          <h2 style={{ color: "#4aff9e", marginTop: 0 }}>⚖️ Comparison Analysis</h2>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{comparison}</ReactMarkdown>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 30 }}>
          <h2>Final Answer</h2>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.final_answer}</ReactMarkdown>
          <p>Total iterations: {result.total_iterations}</p>
          <ReasoningPanel trace={result.reasoning_trace} papers={result.papers} />
        </div>
      )}
    </div>
  )
}

export default App