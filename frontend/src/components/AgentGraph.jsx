import { useEffect, useState } from "react"
import ReactFlow, { 
  Background, 
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState
} from "reactflow"
import "reactflow/dist/style.css"

const initialNodes = [
  {
    id: "researcher",
    position: { x: 150, y: 0 },
    targetPosition: "left",
    data: { label: "🔍 Researcher\ngemini-3.1-flash-lite" },
    style: { background: "#1a1a2e", color: "#e0e0e0", border: "1px solid #4a9eff", borderRadius: 12, padding: 12, width: 180, whiteSpace: "pre-line", textAlign: "center" }
  },
  {
    id: "critic",
    position: { x: 0, y: 180 },
    data: { label: "⚔️ Critic\ngemini-3-flash" },
    style: { background: "#1a1a2e", color: "#e0e0e0", border: "1px solid #ff4a4a", borderRadius: 12, padding: 12, width: 180, whiteSpace: "pre-line", textAlign: "center" }
  },
  {
    id: "synthesizer",
    position: { x: 300, y: 180 },
    data: { label: "🧬 Synthesizer\ngemini-3-flash" },
    style: { background: "#1a1a2e", color: "#e0e0e0", border: "1px solid #4aff9e", borderRadius: 12, padding: 12, width: 180, whiteSpace: "pre-line", textAlign: "center" }
  },
  {
    id: "judge",
    position: { x: 150, y: 360 },
    sourcePosition: "left",
    data: { label: "⚖️ Judge\ngemini-3.1-pro" },
    style: { background: "#1a1a2e", color: "#e0e0e0", border: "1px solid #ffd700", borderRadius: 12, padding: 12, width: 180, whiteSpace: "pre-line", textAlign: "center" }
  }
]

const allEdges = [
  { id: "r-c", source: "researcher", target: "critic", markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: "#4a9eff" }, animated: false },
  { id: "c-s", source: "critic", target: "synthesizer", markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: "#ff4a4a" }, animated: false },
  { id: "s-j", source: "synthesizer", target: "judge", markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: "#4aff9e" }, animated: false },
    { 
    id: "j-r", 
    source: "judge", 
    target: "researcher",
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed }, 
    style: { stroke: "#ffd700", strokeDasharray: "5,5" }, 
    animated: false 
    }
]

export default function AgentGraph({ activeAgent, currentIteration }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(allEdges)

  useEffect(() => {
    setEdges(edges => edges.map(e => ({
      ...e,
      animated: (
        (activeAgent === "critic" && e.id === "r-c") ||
        (activeAgent === "synthesizer" && e.id === "c-s") ||
        (activeAgent === "judge" && e.id === "s-j") ||
        (activeAgent === "researcher" && currentIteration > 1 && e.id === "j-r")
      )
    })))
}, [activeAgent, currentIteration])
  return (
    <div style={{ height: 450, background: "#0d0d1a", borderRadius: 12 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background color="#333" />
        <Controls />
      </ReactFlow>
    </div>
  )
}