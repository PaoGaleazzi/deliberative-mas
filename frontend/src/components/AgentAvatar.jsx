import { motion, AnimatePresence } from "framer-motion"

const AGENTS = {
  researcher: {
    color: "var(--agent-researcher)",
    label: "Researcher",
    shape: "circle"
  },
  critic: {
    color: "var(--agent-critic)",
    label: "Critic",
    shape: "triangle"
  },
  synthesizer: {
    color: "var(--agent-synthesizer)",
    label: "Synthesizer",
    shape: "hexagon"
  },
  judge: {
    color: "var(--agent-judge)",
    label: "Judge",
    shape: "square"
  }
}

function Shape({ shape, color, active }) {
  const pulse = {
    scale: active ? [1, 1.15, 1] : 1,
    transition: { duration: 0.8, repeat: active ? Infinity : 0 }
  }

  if (shape === "circle") return (
    <motion.div animate={pulse} style={{
      width: 52, height: 52, borderRadius: "50%",
      background: active ? color : "transparent",
      border: `2px solid ${color}`,
      boxShadow: active ? `0 0 20px ${color}` : "none",
      transition: "all 0.3s"
    }} />
  )

  if (shape === "triangle") return (
    <motion.div animate={pulse} style={{ width: 52, height: 52, position: "relative" }}>
      <svg width="52" height="52" viewBox="0 0 52 52">
        <polygon
          points="26,4 50,48 2,48"
          fill={active ? color : "transparent"}
          stroke={color}
          strokeWidth="2"
          style={{ filter: active ? `drop-shadow(0 0 8px ${color})` : "none", transition: "all 0.3s" }}
        />
      </svg>
    </motion.div>
  )

  if (shape === "hexagon") return (
    <motion.div animate={pulse} style={{ width: 52, height: 52 }}>
      <svg width="52" height="52" viewBox="0 0 52 52">
        <polygon
          points="26,2 48,14 48,38 26,50 4,38 4,14"
          fill={active ? color : "transparent"}
          stroke={color}
          strokeWidth="2"
          style={{ filter: active ? `drop-shadow(0 0 8px ${color})` : "none", transition: "all 0.3s" }}
        />
      </svg>
    </motion.div>
  )

  if (shape === "square") return (
    <motion.div animate={pulse} style={{
      width: 52, height: 52,
      background: active ? color : "transparent",
      border: `2px solid ${color}`,
      borderRadius: 6,
      boxShadow: active ? `0 0 20px ${color}` : "none",
      transition: "all 0.3s"
    }} />
  )
}

function Avatar({ agentKey, active, message }) {
  const agent = AGENTS[agentKey]

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      flex: 1,
      position: "relative"
    }}>
      {/* Burbuja de diálogo */}
      <AnimatePresence>
        {active && message && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: "absolute",
              bottom: "100%",
              marginBottom: 8,
              background: "var(--bg-panel)",
              border: `1px solid ${agent.color}`,
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 11,
              color: "var(--text-primary)",
              fontFamily: "'JetBrains Mono'",
              maxWidth: 160,
              textAlign: "center",
              lineHeight: 1.5,
              zIndex: 10,
              whiteSpace: "normal"
            }}
          >
            {message}
            {/* Triángulo de la burbuja */}
            <div style={{
              position: "absolute",
              bottom: -6,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0, height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: `6px solid ${agent.color}`
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      <Shape shape={agent.shape} color={agent.color} active={active} />

      <span style={{
        fontFamily: "'JetBrains Mono'",
        fontSize: 10,
        color: active ? agent.color : "var(--text-secondary)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        transition: "color 0.3s"
      }}>
        {agent.label}
      </span>
    </div>
  )
}

export default function AgentAvatars({ activeAgent, lastMessages }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-around",
      alignItems: "flex-end",
      padding: "40px 24px 24px",
      background: "var(--bg-surface)",
      borderRadius: 12,
      border: "1px solid var(--border)",
      marginTop: 24,
      position: "relative",
      minHeight: 140
    }}>
      {Object.keys(AGENTS).map(key => (
        <Avatar
          key={key}
          agentKey={key}
          active={activeAgent === key}
          message={activeAgent === key ? "thinking..." : lastMessages?.[key] || null}
        />
      ))}
    </div>
  )
}