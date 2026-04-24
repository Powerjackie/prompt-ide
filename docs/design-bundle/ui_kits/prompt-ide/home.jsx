/* Home / landing screen — matches landing.* copy from messages/en.json */

function HomeScreen({ onNav }) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <PageHeader
        eyebrow="prompt r&d"
        title="Prompt Operations"
        description="Build prompts. Stress them. Version the wins. Keep the working surface clean."
      >
        <Button variant="primary" icon={I.Flask} iconRight={I.ArrowRight} onClick={() => onNav("playground")}>Open Playground</Button>
        <Button variant="ghost" icon={I.File} iconRight={I.ArrowUpRight} onClick={() => onNav("prompts")}>Browse Library</Button>
      </PageHeader>

      <Card padding={0} style={{ marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            { k: "mode",    v: "Author / Test / Release" },
            { k: "surface", v: "Playground + Library + Modules" },
            { k: "rule",    v: "Draft hard. Keep the good copy." },
          ].map((m, i) => (
            <div key={m.k} style={{
              padding: "18px 22px",
              borderLeft: i > 0 ? "1px solid var(--rule-fine)" : "none",
            }}>
              <Eyebrow>{m.k}</Eyebrow>
              <div style={{ marginTop: 6, fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--ink)", lineHeight: 1.4 }}>{m.v}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ marginBottom: 18 }}>
        <Eyebrow>system flow</Eyebrow>
        <h2 style={{ margin: "6px 0 8px", fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 26, color: "var(--ink)", letterSpacing: "-0.01em" }}>Three surfaces. One operating rhythm.</h2>
        <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--ink-muted)", lineHeight: 1.6, maxWidth: "58ch" }}>Use the landing flow to explain what the workbench does before the workbench asks for effort.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { id: "playground", Icon: I.Flask, strap: "Stateless Analysis", title: "Playground",
            body: "Drop in raw prompt text. Read variables, structure, and risk before it turns into product surface.",
            hint: "Run a stress pass" },
          { id: "prompts", Icon: I.File, strap: "Working Copies + History", title: "Prompt Library",
            body: "Keep the editable draft close to the snapshot trail so good instructions survive revision pressure.",
            hint: "Browse prompt records" },
          { id: "modules", Icon: I.Puzzle, strap: "Reusable Operators", title: "Modules",
            body: "Pull recurring instructions, tone blocks, and system fragments into one place instead of cloning them blind.",
            hint: "Inspect reusable parts" },
        ].map(f => (
          <Card key={f.id} padding={22} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0, minHeight: 62 }}>
                <Eyebrow>{f.strap}</Eyebrow>
                <h3 style={{ margin: "4px 0 0", fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>{f.title}</h3>
              </div>
              <div style={{
                width: 36, height: 36, background: "var(--verdigris-wash)",
                color: "var(--verdigris-deep)", flexShrink: 0,
                border: "1px solid var(--rule-fine)", borderRadius: 5,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><f.Icon size={18}/></div>
            </div>
            <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 14, lineHeight: 1.6, color: "var(--ink-muted)", flex: 1 }}>{f.body}</p>
            <hr className="rule" style={{ margin: "6px 0" }}/>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-soft)" }}>{f.hint}</span>
              <button onClick={() => onNav(f.id)} style={{
                ...btn.base, ...btn.ghost, height: 28, padding: "0 10px", fontSize: 12,
              }}>Open <I.ArrowUpRight size={12}/></button>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <Card padding={22}>
          <Eyebrow>continue work</Eyebrow>
          <h3 style={{ margin: "4px 0 6px", fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--ink)" }}>Latest production drafts</h3>
          <p style={{ margin: "0 0 14px", fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink-muted)" }}>Jump back into prompts that are already carrying real instructions.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { title: "Senior writing assistant", meta: "Apr 22, 2026 · 11:04", status: "production" },
              { title: "Bilingual product announcement", meta: "Apr 21, 2026 · 17:32", status: "production" },
              { title: "Support reply triage", meta: "Apr 20, 2026 · 09:15", status: "inbox" },
              { title: "Code review — regressions first", meta: "Apr 18, 2026 · 14:48", status: "production" },
            ].map((p, i) => (
              <div key={i} style={{
                padding: "12px 4px", display: "flex", alignItems: "center", gap: 16,
                borderTop: i === 0 ? "none" : "1px solid var(--rule-fine)",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--ink)", fontWeight: 600 }}>{p.title}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-soft)", marginTop: 2, letterSpacing: "0.04em" }}>{p.meta}</div>
                </div>
                <StatusDot status={p.status}/>
                <I.ArrowUpRight size={14} style={{ color: "var(--ink-soft)" }}/>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card padding={20}>
            <Eyebrow>version trail</Eyebrow>
            <h4 style={{ margin: "4px 0 10px", fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--ink)" }}>Recent immutable cuts</h4>
            {[
              { t: "Senior writing assistant", s: "Tightened audience variable", v: 7 },
              { t: "Support reply triage",     s: "Added empathy opener",       v: 3 },
            ].map((v, i) => (
              <div key={i} style={{
                padding: "10px 0", borderTop: i === 0 ? "none" : "1px solid var(--rule-fine)",
              }}>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{v.t}</div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--ink-muted)", marginTop: 3 }}>{v.s}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <Folio>v{v.v}</Folio>
                  <Folio>Apr 22</Folio>
                </div>
              </div>
            ))}
          </Card>

          <Card padding={20}>
            <Eyebrow>fast access</Eyebrow>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column" }}>
              {[
                { t: "Open Playground",       i: I.Flask,  go: "playground" },
                { t: "Browse prompt library", i: I.File,   go: "prompts" },
                { t: "Review module blocks",  i: I.Puzzle, go: "modules" },
              ].map((x, i) => (
                <button key={i} onClick={() => onNav(x.go)} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 0", border: "none", background: "transparent",
                  borderTop: i === 0 ? "none" : "1px solid var(--rule-fine)",
                  fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink)",
                  textAlign: "left", cursor: "pointer", justifyContent: "space-between",
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <x.i size={14} style={{ color: "var(--ink-muted)" }}/>{x.t}
                  </span>
                  <I.ArrowUpRight size={12} style={{ color: "var(--ink-soft)" }}/>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;
