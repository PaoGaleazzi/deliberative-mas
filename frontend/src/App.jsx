import { useState } from "react"
import axios from "axios"
import AgentGraph from "./components/AgentGraph"
import ReasoningPanel from "./components/ReasoningPanel"

function App() {
  const [question, setQuestion] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeAgent, setActiveAgent] = useState(null)

  const handleSubmit = async () => {
    if (!question.trim()) return
    setLoading(true)
    setResult(null)
    setActiveAgent(null)
    try {
      const response = await axios.post("http://127.0.0.1:8000/deliberate", {
        question,
        max_iterations: 3
      })
      setResult(response.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
      setActiveAgent(null)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 20px" }}>
      <h1>Deliberative Multi-Agent System</h1>
      
      <AgentGraph activeAgent={activeAgent} />

      <div style={{ marginTop: 24 }}>
        <textarea
          rows={3}
          style={{ width: "100%", fontSize: 16, padding: 10, boxSizing: "border-box" }}
          placeholder="Enter your question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ marginTop: 10, padding: "10px 24px", fontSize: 16 }}
        >
          {loading ? "Deliberating..." : "Deliberate"}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: 30 }}>
          <h2>Final Answer</h2>
          <p>{result.final_answer}</p>
          <p>Total iterations: {result.total_iterations}</p>
          <ReasoningPanel trace={result.reasoning_trace} />
        </div>
      )}
    </div>
  )
}

export default App