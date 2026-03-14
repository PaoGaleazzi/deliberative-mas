import { motion } from "framer-motion"

const AGENT_COLORS = {
  researcher: "var(--agent-researcher)",
  critic: "var(--agent-critic)",
  synthesizer: "var(--agent-synthesizer)",
  judge: "var(--agent-judge)"
}

const AGENT_LABELS = {
  researcher: "🔍 Researcher",
  critic: "⚔️ Critic",
  synthesizer: "🧬 Synthesizer",
  judge: "⚖️ Judge"
}

function AgentBlock({ agent, children }) {
  return (
    <div style={{
      borderLeft: `2px solid ${AGENT_COLORS[agent]}`,
      paddingLeft: 16,
      marginBottom: 20
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono'",
        fontSize: 11,
        color: AGENT_COLORS[agent],
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        marginBottom: 10
      }}>
        {AGENT_LABELS[agent]}
      </div>
      {children}
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderRadius: 6,
      padding: "10px 14px",
      marginBottom: 8,
      fontSize: 14,
      lineHeight: 1.6,
      color: "var(--text-primary)"
    }}>
      {children}
    </div>
  )
}

export default function ReasoningPanel({ trace, papers }) {
  if ((!trace || trace.length === 0) && (!papers || papers.length === 0)) return null

  return (
    <div style={{ marginTop: 8 }}>

      {/* Papers Single Agent */}
      {papers && papers.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: "'JetBrains Mono'",
            fontSize: 11,
            color: "var(--accent-blue)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 12
          }}>
            📄 Papers used
          </div>
          {papers.map((p, i) => (
            <Card key={i}>
              <span style={{ color: "var(--text-primary)" }}>{p.title}</span>
              {p.year && <span style={{ color: "var(--text-secondary)", fontSize: 12, marginLeft: 8 }}>({p.year})</span>}
              {p.doi && p.doi !== "DOI not available" && (
                <div>
                  <a href={p.doi} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--accent-blue)" }}>
                    {p.doi}
                  </a>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Reasoning trace */}
      {trace && trace.length > 0 && trace.map((iteration, idx) => (
        <motion.div
          key={iteration.iteration}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.1 }}
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 20
          }}
        >
          {/* Iteration header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
            paddingBottom: 12,
            borderBottom: "1px solid var(--border)"
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono'",
              fontSize: 11,
              color: "var(--accent-gold)",
              letterSpacing: "0.12em",
              textTransform: "uppercase"
            }}>
              iteration {iteration.iteration}
            </div>
            {iteration.judge && (
              <div style={{
                marginLeft: "auto",
                fontFamily: "'JetBrains Mono'",
                fontSize: 11,
                color: iteration.judge.decision === "sufficient" ? "var(--accent-green)" : "var(--accent-red)",
                letterSpacing: "0.08em"
              }}>
                {iteration.judge.decision === "sufficient" ? "✓ sufficient" : "↻ revise"}
              </div>
            )}
          </div>

          {/* Researcher */}
          {iteration.researcher && (
            <AgentBlock agent="researcher">
              {iteration.researcher.evidence.map((e, i) => (
                <Card key={i}>
                  <p style={{ margin: 0 }}>{e.finding}</p>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
                    {e.source}
                    {e.doi && e.doi !== "DOI not available" && (
                      <a href={e.doi} target="_blank" rel="noreferrer" style={{ marginLeft: 8, color: "var(--accent-blue)" }}>
                        [link]
                      </a>
                    )}
                  </p>
                </Card>
              ))}
            </AgentBlock>
          )}

          {/* Critic */}
          {iteration.critic && (
            <AgentBlock agent="critic">
              {iteration.critic.counterarguments.map((c, i) => (
                <Card key={i}>
                  <p style={{ margin: 0 }}>{c}</p>
                </Card>
              ))}
            </AgentBlock>
          )}

          {/* Synthesizer */}
          {iteration.synthesizer && (
            <AgentBlock agent="synthesizer">
              <Card>
                <p style={{ margin: 0 }}>{iteration.synthesizer.refined_position}</p>
              </Card>
            </AgentBlock>
          )}

          {/* Judge */}
          {iteration.judge && (
            <AgentBlock agent="judge">
              <Card>
                <p style={{ margin: "0 0 10px", fontSize: 14 }}>{iteration.judge.feedback}</p>
                <div style={{ display: "flex", gap: 16 }}>
                  {Object.entries(iteration.judge.score).map(([key, val]) => (
                    <div key={key} style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: "'JetBrains Mono'",
                        fontSize: 10,
                        color: "var(--text-secondary)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginBottom: 4
                      }}>
                        {key}
                      </div>
                      <div style={{ background: "var(--border)", borderRadius: 3, height: 4 }}>
                        <div style={{
                          background: "var(--accent-gold)",
                          width: `${val * 100}%`,
                          height: "100%",
                          borderRadius: 3,
                          transition: "width 0.6s ease"
                        }} />
                      </div>
                      <div style={{
                        fontFamily: "'JetBrains Mono'",
                        fontSize: 10,
                        color: "var(--text-secondary)",
                        textAlign: "right",
                        marginTop: 2
                      }}>
                        {val}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </AgentBlock>
          )}
        </motion.div>
      ))}
    </div>
  )
}