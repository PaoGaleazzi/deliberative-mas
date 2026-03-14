import { useState } from "react"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import AgentGraph from "./components/AgentGraph"
import ReasoningPanel from "./components/ReasoningPanel"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const MODES = [
  { value: "single_agent", label: "A — Single Agent" },
  { value: "multi_agent_1", label: "B — Multi-Agent (1 iter)" },
  { value: "multi_agent", label: "C — Multi-Agent + Loops" }
]

const AGENT_LABELS = {
  researcher: "Researcher",
  critic: "Critic",
  synthesizer: "Synthesizer",
  judge: "Judge"
}

export default function App() {
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
        if (data.event === "agent_start") setActiveAgent(data.agent)
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
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ marginBottom: 48, borderBottom: "1px solid var(--border)", paddingBottom: 24 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: loading ? "var(--accent-green)" : "var(--border-bright)",
            boxShadow: loading ? "0 0 8px var(--accent-green)" : "none",
            transition: "all 0.3s"
          }} />
          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "var(--text-secondary)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {loading ? `iteration ${currentIteration} — ${activeAgent ? AGENT_LABELS[activeAgent] + " thinking" : "processing"}` : "system ready"}
          </span>
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", lineHeight: 1.2 }}>
          Deliberative<br />
          <span style={{ color: "var(--accent-blue)" }}>Multi-Agent System</span>
        </h1>
      </motion.div>

      {/* Graph */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <AgentGraph activeAgent={activeAgent} currentIteration={currentIteration} />
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        style={{ marginTop: 32 }}
      >
        {/* Mode selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => { setMode(m.value); setResult(savedResults[m.value] || null) }}
              style={{
                padding: "8px 16px",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: mode === m.value ? "var(--accent-blue)" : "transparent",
                color: mode === m.value ? "#000" : "var(--text-secondary)",
                border: `1px solid ${savedResults[m.value] ? "var(--accent-green)" : mode === m.value ? "var(--accent-blue)" : "var(--border)"}`,
                borderRadius: 6,
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "'JetBrains Mono'"
              }}
            >
              {m.label} {savedResults[m.value] ? "✓" : ""}
            </button>
          ))}
        </div>

        {/* Iterations */}
        {mode === "multi_agent" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: "var(--text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'JetBrains Mono'" }}>
              Max iterations
            </span>
            {[1, 2, 3].map(n => (
              <button
                key={n}
                onClick={() => setMaxIterations(n)}
                style={{
                  width: 32, height: 32, fontSize: 13,
                  background: maxIterations === n ? "var(--accent-gold)" : "transparent",
                  color: maxIterations === n ? "#000" : "var(--text-secondary)",
                  border: `1px solid ${maxIterations === n ? "var(--accent-gold)" : "var(--border)"}`,
                  borderRadius: 6, cursor: "pointer",
                  fontFamily: "'JetBrains Mono'"
                }}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <textarea
          rows={3}
          style={{
            width: "100%",
            fontSize: 15,
            padding: "14px 16px",
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            resize: "vertical",
            fontFamily: "'Source Serif 4', serif",
            lineHeight: 1.6,
            outline: "none",
            transition: "border-color 0.2s"
          }}
          onFocus={e => e.target.style.borderColor = "var(--accent-blue)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
          placeholder="Enter your research question..."
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value)
            setSavedResults({})
            setComparison(null)
          }}
        />

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "10px 24px",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: loading ? "transparent" : "var(--accent-blue)",
              color: loading ? "var(--text-secondary)" : "#000",
              border: `1px solid ${loading ? "var(--border)" : "var(--accent-blue)"}`,
              borderRadius: 6,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'JetBrains Mono'",
              transition: "all 0.2s"
            }}
          >
            {loading ? "deliberating..." : "deliberate →"}
          </button>

          <AnimatePresence>
            {canCompare && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                onClick={handleCompare}
                disabled={comparing}
                style={{
                  padding: "10px 24px",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  background: "transparent",
                  color: "var(--accent-green)",
                  border: "1px solid var(--accent-green)",
                  borderRadius: 6,
                  cursor: comparing ? "not-allowed" : "pointer",
                  fontFamily: "'JetBrains Mono'"
                }}
              >
                {comparing ? "comparing..." : "⚖ compare results"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Streaming trace */}
      <AnimatePresence>
        {streamingTrace.length > 0 && !result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 40 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-green)", boxShadow: "0 0 8px var(--accent-green)" }} />
              <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "var(--accent-green)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                reasoning in progress
              </span>
            </div>
            <ReasoningPanel trace={streamingTrace} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison */}
      <AnimatePresence>
        {comparison && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 40,
              background: "var(--bg-panel)",
              border: "1px solid var(--accent-green)",
              borderRadius: 12,
              padding: 28
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "var(--accent-green)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                ⚖ comparison analysis
              </span>
            </div>
            <div className="answer-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{comparison}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 40 }}
          >
            <div style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 28,
              marginBottom: 24
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "var(--accent-blue)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  final answer
                </span>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "var(--text-secondary)" }}>
                  {result.total_iterations} iteration{result.total_iterations > 1 ? "s" : ""}
                </span>
              </div>
              <div className="answer-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.final_answer}</ReactMarkdown>
              </div>
            </div>
            <ReasoningPanel trace={result.reasoning_trace} papers={result.papers} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}