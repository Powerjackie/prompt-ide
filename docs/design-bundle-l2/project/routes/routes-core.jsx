/* Routes: Home, Login, Playground */

function HomeRoute({ onNav }) {
  return (
    <div style={{ padding: "28px 36px 60px", maxWidth: 1180, margin: "0 auto" }}>
      <PageHeader
        eyebrow="prompt r&d"
        title="Prompt Operations"
        description="Build prompts. Stress them. Version the wins. Keep the working surface clean."
      >
        <Button variant="ghost" icon={I.File} iconRight={I.ArrowUpRight} onClick={() => onNav("prompts")}>Browse library</Button>
        <Button variant="primary" icon={I.Flask} iconRight={I.ArrowRight} onClick={() => onNav("playground")}>Open playground</Button>
      </PageHeader>

      {/* Meta strip */}
      <Card padding={0} style={{ marginBottom: 30 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            { k: "mode", v: "Author / Test / Release" },
            { k: "surface", v: "Playground + Library + Modules" },
            { k: "rule", v: "Draft hard. Keep the good copy." },
          ].map((m, i) => (
            <div key={m.k} style={{ padding: "16px 22px", borderLeft: i > 0 ? "1px solid var(--rule-fine)" : "none" }}>
              <Eyebrow>{m.k}</Eyebrow>
              <div style={{ marginTop: 6, fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--ink)", lineHeight: 1.4 }}>{m.v}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Three surfaces */}
      <div style={{ marginBottom: 14 }}>
        <Eyebrow>system flow</Eyebrow>
        <h2 style={{ margin: "4px 0 4px", fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 24, color: "var(--ink)", letterSpacing: "-0.01em" }}>Three surfaces. One operating rhythm.</h2>
        <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.55, maxWidth: "58ch" }}>Use the landing flow to explain what the workbench does before the workbench asks for effort.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 32 }}>
        {[
          { id: "playground", Icon: I.Flask, strap: "Stateless analysis", title: "Playground", body: "Drop in raw prompt text. Read variables, structure, and risk before it turns into product surface.", hint: "Run a stress pass" },
          { id: "prompts", Icon: I.File, strap: "Working copies + history", title: "Prompt library", body: "Keep the editable draft close to the snapshot trail so good instructions survive revision pressure.", hint: "Browse prompt records" },
          { id: "modules", Icon: I.Puzzle, strap: "Reusable operators", title: "Modules", body: "Pull recurring instructions, tone blocks, and system fragments into one place instead of cloning them blind.", hint: "Inspect reusable parts" },
        ].map(f => (
          <Card key={f.id} padding={20} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Eyebrow>{f.strap}</Eyebrow>
                <h3 style={{ margin: "2px 0 0", fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>{f.title}</h3>
              </div>
              <div style={{ width: 32, height: 32, background: "var(--verdigris-wash)", color: "var(--verdigris-deep)", border: "1px solid var(--rule-fine)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <f.Icon size={16}/>
              </div>
            </div>
            <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-muted)", flex: 1 }}>{f.body}</p>
            <hr className="rule" style={{ margin: "4px 0" }}/>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-soft)" }}>{f.hint}</span>
              <button onClick={() => onNav(f.id)} style={{ ...btnBase, ...btnVariants.ghost, height: 24, padding: "0 9px", fontSize: 11 }}>
                Open <I.ArrowUpRight size={11}/>
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Workbench section */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <Card padding={22}>
          <Eyebrow>continue work</Eyebrow>
          <h3 style={{ margin: "2px 0 4px", fontFamily: "var(--font-serif)", fontSize: 19, color: "var(--ink)" }}>Latest production drafts</h3>
          <p style={{ margin: "0 0 12px", fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--ink-muted)" }}>Jump back into prompts that are already carrying real instructions.</p>
          {[
            { title: "Senior writing assistant", meta: "Apr 22, 2026 · 11:04", status: "production" },
            { title: "Bilingual product announcement", meta: "Apr 21, 2026 · 17:32", status: "production" },
            { title: "Support reply triage", meta: "Apr 20, 2026 · 09:15", status: "inbox" },
            { title: "Code review — regressions first", meta: "Apr 18, 2026 · 14:48", status: "production" },
          ].map((p, i) => (
            <div key={i} style={{ padding: "11px 2px", display: "flex", alignItems: "center", gap: 14, borderTop: i === 0 ? "none" : "1px solid var(--rule-fine)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 14.5, color: "var(--ink)", fontWeight: 600 }}>{p.title}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-soft)", marginTop: 2, letterSpacing: "0.04em" }}>{p.meta}</div>
              </div>
              <StatusDot status={p.status} small/>
              <I.ArrowUpRight size={13} style={{ color: "var(--ink-soft)" }}/>
            </div>
          ))}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card padding={18}>
            <Eyebrow>version trail</Eyebrow>
            <h4 style={{ margin: "2px 0 10px", fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--ink)" }}>Recent immutable cuts</h4>
            {[
              { t: "Senior writing assistant", s: "Tightened audience variable", v: 7 },
              { t: "Support reply triage", s: "Added empathy opener", v: 3 },
            ].map((v, i) => (
              <div key={i} style={{ padding: "9px 0", borderTop: i === 0 ? "none" : "1px solid var(--rule-fine)" }}>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink)", fontWeight: 500 }}>{v.t}</div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 12.5, color: "var(--ink-muted)", marginTop: 2 }}>{v.s}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                  <Folio>v{v.v}</Folio><Folio>Apr 22</Folio>
                </div>
              </div>
            ))}
          </Card>

          <Card padding={18}>
            <Eyebrow>fast access</Eyebrow>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column" }}>
              {[
                { t: "Open playground", i: I.Flask, go: "playground" },
                { t: "Browse prompt library", i: I.File, go: "prompts" },
                { t: "Review module blocks", i: I.Puzzle, go: "modules" },
              ].map((x, i) => (
                <button key={i} onClick={() => onNav(x.go)} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 0", border: "none", background: "transparent",
                  borderTop: i === 0 ? "none" : "1px solid var(--rule-fine)",
                  fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink)",
                  textAlign: "left", cursor: "pointer", justifyContent: "space-between",
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <x.i size={13} style={{ color: "var(--ink-muted)" }}/>{x.t}
                  </span>
                  <I.ArrowUpRight size={11} style={{ color: "var(--ink-soft)" }}/>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Footer folio */}
      <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid var(--rule-fine)" }}>
        <Folio>Visual Refactor / Accepted</Folio>
        <Folio>Home + Playground + Library / Live</Folio>
      </div>
    </div>
  );
}

function LoginRoute({ onNav }) {
  return (
    <div style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, justifyContent: "center" }}>
          <div style={{
            width: 44, height: 44, background: "var(--ivory)",
            border: "2px solid var(--ink)", borderRadius: 5,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-serif)", fontWeight: 600, fontStyle: "italic",
            fontSize: 24, color: "var(--verdigris-deep)",
          }}>p</div>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 19, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>Prompt IDE</div>
            <div className="eyebrow">prompt r&amp;d workbench</div>
          </div>
        </div>

        <Card padding={28}>
          <Eyebrow>vault access</Eyebrow>
          <h1 style={{ margin: "6px 0 6px", fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.015em" }}>Sign in</h1>
          <p style={{ margin: "0 0 18px", fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.55 }}>Enter your workspace password to unlock Prompt IDE.</p>

          <label style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-muted)", letterSpacing: "0.04em" }}>password</label>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginTop: 4, padding: "8px 12px",
            background: "var(--paper)", border: "1px solid var(--rule-fine)", borderRadius: 4,
          }}>
            <I.Lock size={14} style={{ color: "var(--ink-soft)" }}/>
            <input type="password" defaultValue="••••••••••••" style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink)",
            }}/>
            <I.Eye size={14} style={{ color: "var(--ink-soft)", cursor: "pointer" }}/>
          </div>
          <Button variant="primary" style={{ width: "100%", marginTop: 16, height: 38 }} onClick={() => onNav("home")}>Unlock</Button>

          <hr className="rule" style={{ margin: "20px 0 14px" }}/>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { k: "local-first", v: "SQLite on your machine" },
              { k: "agent", v: "MiniMax analysis" },
              { k: "scope", v: "Single operator workbench" },
            ].map(x => (
              <div key={x.k} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <Folio style={{ minWidth: 72 }}>{x.k}</Folio>
                <span style={{ fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--ink-muted)" }}>{x.v}</span>
              </div>
            ))}
          </div>
        </Card>

        <p style={{ marginTop: 14, textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-soft)" }}>Log in to access the Playground.</p>
      </div>
    </div>
  );
}

function PlaygroundRoute() {
  return (
    <div style={{ padding: "22px 28px 60px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <PageHeader
        compact
        eyebrow="agent lab"
        title="Agent Playground"
        description="Paste any prompt text to see how the agent analyzes it. A sandbox for testing classification, risk detection, variable extraction, and similarity matching."
      >
        <Button variant="ghost" icon={I.RotateCcw}>Clear</Button>
        <Button variant="primary" icon={I.Flask}>Analyze</Button>
      </PageHeader>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 360px", gap: 14, flex: 1, minHeight: 0 }}>
        {/* Brief Panel */}
        <Card padding={0} style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--rule-fine)" }}>
            <Eyebrow>experiment brief</Eyebrow>
            <h3 style={{ margin: "4px 0 4px", fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--ink)", fontWeight: 600 }}>Stateless pass</h3>
            <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 12.5, color: "var(--ink-muted)", lineHeight: 1.5 }}>Use this space to probe how a draft prompt behaves before you save, benchmark, or refactor it elsewhere.</p>
          </div>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--rule-fine)" }}>
            <blockquote style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 12, fontStyle: "italic", color: "var(--ink-muted)", borderLeft: "2px solid var(--amber-rule)", paddingLeft: 12, lineHeight: 1.5 }}>
              This run is stateless: it does not write Prompt, AgentHistory, or benchmark data back into the workspace.
            </blockquote>
          </div>
          <div style={{ padding: "14px 18px", flex: 1 }}>
            <Eyebrow>quick experiments</Eyebrow>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { t: "Writing assistant", d: "Rewrite rough notes", active: true },
                { t: "Translation prompt", d: "Bilingual announcement" },
                { t: "Customer support", d: "Empathetic reply" },
                { t: "Code review", d: "Senior engineer lens" },
              ].map((x, i) => (
                <button key={i} style={{
                  textAlign: "left", padding: "9px 10px",
                  background: x.active ? "var(--verdigris-wash)" : "transparent",
                  border: "none", borderRadius: 3, cursor: "pointer",
                  display: "block", width: "100%",
                }}>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 13, color: x.active ? "var(--verdigris-deep)" : "var(--ink)", fontWeight: 500 }}>{x.t}</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-soft)", marginTop: 1 }}>{x.d}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: "10px 18px", borderTop: "1px solid var(--rule-fine)", display: "flex", justifyContent: "space-between" }}>
            <Folio>¶ 01 / 04</Folio>
            <Folio>loaded</Folio>
          </div>
        </Card>

        {/* Workspace Stage */}
        <Card padding={0} style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--rule-fine)", display: "flex", alignItems: "center", gap: 12 }}>
            <Eyebrow>prompt input</Eyebrow>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--verdigris-deep)", background: "var(--verdigris-wash)", padding: "2px 6px", borderRadius: 3, letterSpacing: "0.04em" }}>stateless</span>
            <div style={{ flex: 1 }}/>
            <Folio>412 chars · 7 lines · 1 variable</Folio>
          </div>
          <div style={{
            flex: 1, padding: "22px 28px", overflowY: "auto",
            fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.8, color: "var(--ink)",
            whiteSpace: "pre-wrap",
          }}>
{`You are a senior writing assistant.

Rewrite the following rough notes into a polished article intro for `}<span style={{ background: "var(--verdigris-wash)", color: "var(--verdigris-deep)", padding: "1px 4px", borderRadius: 2 }}>{"{{audience}}"}</span>{`.
Keep the tone `}<span style={{ background: "var(--verdigris-wash)", color: "var(--verdigris-deep)", padding: "1px 4px", borderRadius: 2 }}>{"{{tone}}"}</span>{`, stay under `}<span style={{ background: "var(--verdigris-wash)", color: "var(--verdigris-deep)", padding: "1px 4px", borderRadius: 2 }}>{"{{word_limit}}"}</span>{` words, and end with one concrete next step.

The intro should open with a specific image, not an abstract claim.`}
          </div>
          <div style={{ padding: "10px 18px", borderTop: "1px solid var(--rule-fine)", display: "flex", alignItems: "center", gap: 8 }}>
            <Eyebrow>ready to analyze</Eyebrow>
            <div style={{ flex: 1 }}/>
            <Kbd>⌘</Kbd><Kbd>↵</Kbd>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-soft)" }}>run</span>
          </div>
        </Card>

        {/* Analysis Console */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0, overflowY: "auto" }}>
          <Card padding={18}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <Eyebrow>analysis results</Eyebrow>
              <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--verdigris-deep)", background: "var(--verdigris-wash)", padding: "2px 6px", borderRadius: 3, letterSpacing: "0.04em" }}>live</span>
            </div>
            <h3 style={{ margin: "4px 0 12px", fontFamily: "var(--font-serif)", fontSize: 17, color: "var(--ink)" }}>Writing, stateless pass</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { k: "category", v: "Writing" },
                { k: "risk", v: "Low risk" },
                { k: "variables", v: "3 detected" },
                { k: "confidence", v: "94%" },
              ].map(x => (
                <div key={x.k} style={{ border: "1px solid var(--rule-fine)", borderRadius: 4, padding: "8px 10px" }}>
                  <Eyebrow style={{ fontSize: 10 }}>{x.k}</Eyebrow>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)", marginTop: 2, fontWeight: 500 }}>{x.v}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding={18}>
            <Eyebrow>extracted variables</Eyebrow>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { n: "audience", d: "Target reader context" },
                { n: "tone", d: "Tonal posture" },
                { n: "word_limit", d: "Length constraint" },
              ].map((v, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderTop: i === 0 ? "none" : "1px solid var(--rule-fine)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--verdigris-deep)", background: "var(--verdigris-wash)", padding: "1px 6px", borderRadius: 2, height: 18, lineHeight: "16px" }}>{`{{${v.n}}}`}</span>
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: 12.5, color: "var(--ink-muted)" }}>{v.d}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card padding={18}>
            <Eyebrow>reasoning timeline</Eyebrow>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { k: "Thought", v: "This prompt targets a specialized writing task with explicit audience control." },
                { k: "Action", v: "Classify category, detect tone, extract placeholder variables." },
                { k: "Observation", v: "Three placeholders; no injection patterns; clarity signals high." },
              ].map((x, i) => (
                <div key={i} style={{ borderLeft: "2px solid var(--amber-rule)", paddingLeft: 11 }}>
                  <Eyebrow style={{ fontSize: 10 }}>{x.k}</Eyebrow>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 12.5, color: "var(--ink)", marginTop: 2, lineHeight: 1.5 }}>{x.v}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeRoute, LoginRoute, PlaygroundRoute });
