export default function ReasoningPanel({ trace, papers }) {
  if ((!trace || trace.length === 0) && (!papers || papers.length === 0)) return null

  return (
    <div style={{ marginTop: 30 }}>

      {/* Papers usados en Single Agent */}
      {papers && papers.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ color: "#4a9eff" }}>📄 Papers used</h3>
          {papers.map((p, i) => (
            <div key={i} style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <p style={{ margin: 0 }}>{p.title} ({p.year})</p>
              {p.doi && p.doi !== "DOI not available" && (
                <a href={p.doi} target="_blank" rel="noreferrer" style={{ color: "#4a9eff", fontSize: 12 }}>
                  {p.doi}
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reasoning trace Multi-Agent */}
      {trace && trace.length > 0 && (
        <>
          <h2>Reasoning Trace</h2>
          {trace.map((iteration) => (
            <div key={iteration.iteration} style={{
              background: "#0d0d1a",
              border: "1px solid #333",
              borderRadius: 12,
              padding: 20,
              marginBottom: 20
            }}>
              <h3 style={{ color: "#ffd700", marginTop: 0 }}>
                Iteration {iteration.iteration}
              </h3>

              {/* Researcher */}
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ color: "#4a9eff", margin: "0 0 8px" }}>🔍 Researcher</h4>
                {iteration.researcher.evidence.map((e, i) => (
                  <div key={i} style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                    <p style={{ margin: 0 }}>{e.finding}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
                      {e.source} {e.doi && e.doi !== "DOI not available" && (
                        <a href={e.doi} target="_blank" rel="noreferrer" style={{ color: "#4a9eff" }}>
                          [link]
                        </a>
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {/* Critic */}
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ color: "#ff4a4a", margin: "0 0 8px" }}>⚔️ Critic</h4>
                {iteration.critic.counterarguments.map((c, i) => (
                  <div key={i} style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                    <p style={{ margin: 0 }}>{c}</p>
                  </div>
                ))}
              </div>

              {/* Synthesizer */}
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ color: "#4aff9e", margin: "0 0 8px" }}>🧬 Synthesizer</h4>
                <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10 }}>
                  <p style={{ margin: 0 }}>{iteration.synthesizer.refined_position}</p>
                </div>
              </div>

              {/* Judge */}
              <div>
                <h4 style={{ color: "#ffd700", margin: "0 0 8px" }}>⚖️ Judge</h4>
                <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10 }}>
                  <p style={{ margin: "0 0 8px" }}>
                    <strong>Decision:</strong>{" "}
                    <span style={{ color: iteration.judge.decision === "sufficient" ? "#4aff9e" : "#ff4a4a" }}>
                      {iteration.judge.decision}
                    </span>
                  </p>
                  <p style={{ margin: "0 0 8px" }}>{iteration.judge.feedback}</p>
                  <div style={{ display: "flex", gap: 16 }}>
                    {Object.entries(iteration.judge.score).map(([key, val]) => (
                      <div key={key} style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 4px", fontSize: 12, color: "#888" }}>{key}</p>
                        <div style={{ background: "#333", borderRadius: 4, height: 8 }}>
                          <div style={{
                            background: "#ffd700",
                            width: `${val * 100}%`,
                            height: "100%",
                            borderRadius: 4
                          }} />
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: 12, textAlign: "right" }}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}