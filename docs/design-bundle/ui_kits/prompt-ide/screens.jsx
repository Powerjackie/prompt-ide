/* Prompts library + prompt editor + playground + modules + login */

const samplePrompts = [
  { id: "1", title: "Senior writing assistant", desc: "Rewrite rough notes into a polished article intro for a specific audience, tone, and length.", model: "Claude", status: "production", tags: ["writing","audience","tone"], fav: true,  updated: "Apr 22" },
  { id: "2", title: "Bilingual product announcement", desc: "Translate product announcements while preserving bullet structure and product names.", model: "GPT", status: "production", tags: ["translation","bilingual"], fav: false, updated: "Apr 21" },
  { id: "3", title: "Support reply triage", desc: "Reply to the user issue using a calm, empathetic tone; clarify root cause and next step.", model: "Claude", status: "inbox",       tags: ["support","empathy","policy"], fav: true, updated: "Apr 20" },
  { id: "4", title: "Code review — regressions first", desc: "Review the code change like a senior engineer; bugs, regressions, missing tests first.", model: "GPT", status: "production", tags: ["code","review"], fav: false, updated: "Apr 18" },
  { id: "5", title: "Benchmark scorecard writer", desc: "Produce a clarity / reusability / controllability / deployment readout for any saved version.", model: "Claude", status: "archived", tags: ["benchmark","scorecard"], fav: false, updated: "Apr 14" },
  { id: "6", title: "Module self-check outline", desc: "Self-check block that asks the model to re-read its reply and flag risk signals before sending.", model: "Claude", status: "production", tags: ["self-check","format"], fav: true,  updated: "Apr 12" },
];

function PromptCard({ p, onOpen }) {
  return (
    <Card padding={0} style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "18px 20px 14px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{
          width: 36, height: 36, background: "var(--paper-deep)",
          border: "1px solid var(--rule-fine)", borderRadius: 4,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--verdigris-deep)", flexShrink: 0, marginTop: 2,
        }}><I.Sparkles size={16}/></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3, marginBottom: 6 }}>{p.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusDot status={p.status}/>
            <span style={{ color: "var(--ink-soft)", fontSize: 11 }}>·</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-muted)", letterSpacing: "0.04em" }}>{p.model}</span>
          </div>
        </div>
        <button title="Favorite" style={{
          width: 28, height: 28, border: "1px solid var(--rule-fine)", background: "var(--ivory)",
          borderRadius: 3, cursor: "pointer", color: p.fav ? "var(--amber-rule)" : "var(--ink-soft)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <I.Star size={13} fill={p.fav ? "var(--amber-rule)" : "none"}/>
        </button>
      </div>
      <div style={{ padding: "0 20px" }}>
        <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.6, minHeight: 66 }}>{p.desc}</p>
      </div>
      <div style={{ padding: "14px 20px 0", display: "flex", flexWrap: "wrap", gap: 6 }}>
        {p.tags.map(t => <Tag key={t}>{t}</Tag>)}
      </div>
      <hr className="rule" style={{ margin: "14px 0 0" }}/>
      <div style={{ padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-soft)", letterSpacing: "0.04em" }}>
          <I.Clock size={12}/>{p.updated}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button title="Copy" style={iconBtn}><I.Copy size={12}/></button>
          <button title="Open" onClick={onOpen} style={{ ...iconBtn, background: "var(--verdigris)", color: "var(--ivory)", borderColor: "var(--verdigris-deep)" }}><I.ArrowUpRight size={12}/></button>
        </div>
      </div>
    </Card>
  );
}
const iconBtn = {
  width: 26, height: 26, border: "1px solid var(--rule-fine)", background: "var(--ivory)",
  color: "var(--ink-muted)", borderRadius: 3, cursor: "pointer",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
};

function PromptsScreen({ onNav }) {
  const [filter, setFilter] = React.useState("all");
  const filtered = filter === "all" ? samplePrompts : samplePrompts.filter(p => p.status === filter);
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        eyebrow="prompt library"
        title="Prompts"
        description="Discover prompt assets quickly, move between status buckets, and keep the strongest entries within easy reach."
      >
        <Button variant="ghost" icon={I.Copy}>Export</Button>
        <Button variant="primary" icon={I.Plus} onClick={() => onNav("editor")}>New prompt</Button>
      </PageHeader>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--paper-deep)", border: "1px solid var(--rule-fine)", borderRadius: 5 }}>
          {["all","inbox","production","archived"].map(k => (
            <button key={k} onClick={() => setFilter(k)} style={{
              fontFamily: "var(--font-sans)", fontSize: 12, padding: "6px 12px", border: "none",
              background: filter === k ? "var(--ivory)" : "transparent",
              color: filter === k ? "var(--ink)" : "var(--ink-muted)",
              borderRadius: 3, cursor: "pointer",
              boxShadow: filter === k ? "var(--shadow-page)" : "none",
            }}>{k}</button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <Folio>{filtered.length} of {samplePrompts.length} shown</Folio>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {filtered.map(p => <PromptCard key={p.id} p={p} onOpen={() => onNav("editor")}/>)}
      </div>
    </div>
  );
}

function EditorScreen({ onNav }) {
  return (
    <div style={{ maxWidth: 1300, margin: "0 auto" }}>
      <PageHeader
        eyebrow="workspace"
        title="Senior writing assistant"
        description="Shape prompt content, review live structure, and run the MiniMax agent without leaving the workspace."
      >
        <Button variant="ghost" icon={I.Copy}>Clone</Button>
        <Button variant="primary" icon={I.Check}>Save version</Button>
      </PageHeader>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 340px", gap: 16 }}>
        {/* Metadata rail */}
        <Card padding={20}>
          <Eyebrow>metadata</Eyebrow>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { k: "Title",   v: "Senior writing assistant" },
              { k: "Model",   v: "Claude" },
              { k: "Status",  v: "Production", dot: "production" },
              { k: "Source",  v: "Self-authored" },
              { k: "Tags",    v: "writing, audience, tone" },
            ].map(f => (
              <div key={f.k}>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-soft)", letterSpacing: "0.04em", marginBottom: 4 }}>{f.k.toLowerCase()}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {f.dot && <StatusDot status={f.dot}/>}
                  {!f.dot && <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)" }}>{f.v}</div>}
                </div>
              </div>
            ))}
          </div>

          <hr className="rule"/>
          <Eyebrow>version trail</Eyebrow>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column" }}>
            {["v7 — Tightened audience","v6 — Reworked tone variable","v5 — Initial baseline"].map((v, i) => (
              <div key={i} style={{
                padding: "8px 0", fontFamily: "var(--font-mono)", fontSize: 11,
                color: i === 0 ? "var(--ink)" : "var(--ink-muted)",
                borderTop: i === 0 ? "none" : "1px solid var(--rule-fine)",
                display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.02em",
              }}>
                {i === 0 && <I.CircleDot size={11} style={{ color: "var(--verdigris)" }}/>}
                {i !== 0 && <span style={{ width: 11, display: "inline-block" }}/>}
                {v}
              </div>
            ))}
          </div>
        </Card>

        {/* Canvas */}
        <Card padding={0}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--rule-fine)", display: "flex", alignItems: "center", gap: 16 }}>
            <Eyebrow>prompt canvas</Eyebrow>
            <div style={{ flex: 1 }}/>
            <Folio>412 chars · 7 lines · 3 variables</Folio>
          </div>
          <pre style={{
            margin: 0, padding: "22px 26px", background: "transparent",
            fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.75,
            color: "var(--ink)", border: "none", minHeight: 380, whiteSpace: "pre-wrap",
          }}>{`You are a senior writing assistant.

Rewrite the following rough notes into a polished article intro for `}
<span style={{ background: "var(--verdigris-wash)", color: "var(--verdigris-deep)", padding: "1px 4px", borderRadius: 2 }}>{"{{audience}}"}</span>
{`. Keep the tone `}
<span style={{ background: "var(--verdigris-wash)", color: "var(--verdigris-deep)", padding: "1px 4px", borderRadius: 2 }}>{"{{tone}}"}</span>
{`, stay under `}
<span style={{ background: "var(--verdigris-wash)", color: "var(--verdigris-deep)", padding: "1px 4px", borderRadius: 2 }}>{"{{word_limit}}"}</span>
{` words, and end with one concrete next step.

The intro should open with a specific image, not an abstract claim.`}
          </pre>
        </Card>

        {/* Preview + agent */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card padding={20}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "nowrap" }}>
              <Eyebrow>live preview</Eyebrow>
              <span style={{ marginLeft: "auto", flexShrink: 0, whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--verdigris-deep)", background: "var(--verdigris-wash)", padding: "2px 6px", borderRadius: 3, letterSpacing: "0.04em" }}>preview mode</span>
            </div>
            <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 13, lineHeight: 1.65, color: "var(--ink)" }}>
              You are a senior writing assistant. Rewrite the following rough notes into a polished article intro for <em>product designers</em>. Keep the tone <em>reflective</em>, stay under <em>180</em> words…
            </p>
          </Card>

          <Card padding={20}>
            <Eyebrow>agent analysis</Eyebrow>
            <h4 style={{ margin: "4px 0 8px", fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--ink)" }}>No blockers detected</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              {[
                { i: I.Check, c: "var(--verdigris-deep)", t: "Clear user intent" },
                { i: I.Check, c: "var(--verdigris-deep)", t: "Well-structured request" },
                { i: I.AlertCircle, c: "var(--amber-rule)", t: "Complexity: medium" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink)" }}>
                  <s.i size={13} style={{ color: s.c }}/>{s.t}
                </div>
              ))}
            </div>
            <hr className="rule"/>
            <Button variant="ghost" icon={I.Flask} style={{ width: "100%" }}>Run analysis</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PlaygroundScreen() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        eyebrow="agent lab"
        title="Agent Playground"
        description="Paste any prompt text to see how the agent analyzes it. A sandbox for testing classification, risk detection, and variable extraction."
      >
        <Button variant="ghost">Clear</Button>
        <Button variant="primary" icon={I.Flask}>Analyze</Button>
      </PageHeader>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card padding={0}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--rule-fine)", display: "flex", alignItems: "center" }}>
            <Eyebrow>prompt input</Eyebrow>
            <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-muted)", letterSpacing: "0.04em" }}>stateless · 412 chars · 7 lines</span>
          </div>
          <textarea defaultValue={`You are a customer support specialist. Reply to the user issue below using a calm and empathetic tone. Clarify the root cause, suggest the safest next step, and mention any policy limitation that applies.

{{user_issue}}`} style={{
            width: "100%", minHeight: 340, border: "none", outline: "none",
            padding: "20px 24px", background: "transparent",
            fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.7, color: "var(--ink)",
            resize: "vertical", boxSizing: "border-box",
          }}/>
          <hr className="rule" style={{ margin: 0 }}/>
          <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: 8 }}>
            <Eyebrow>quick experiments</Eyebrow>
            <div style={{ flex: 1 }}/>
            {["writing","translation","support","code"].map(t =>
              <button key={t} style={{ ...iconBtn, width: "auto", padding: "4px 10px", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-muted)" }}>{t}</button>
            )}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card padding={20}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "nowrap" }}>
              <Eyebrow>analysis results</Eyebrow>
              <span style={{ marginLeft: "auto", flexShrink: 0, whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--verdigris-deep)", background: "var(--verdigris-wash)", padding: "2px 6px", borderRadius: 3, letterSpacing: "0.04em" }}>live result</span>
            </div>
            <h3 style={{ margin: "4px 0 14px", fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--ink)" }}>Support specialist, stateless pass</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { k: "category",   v: "Communication" },
                { k: "risk",       v: "Low risk" },
                { k: "variables",  v: "1 · user_issue" },
                { k: "confidence", v: "92%" },
              ].map(x => (
                <div key={x.k} style={{ border: "1px solid var(--rule-fine)", borderRadius: 4, padding: "10px 12px" }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--ink-soft)", letterSpacing: "0.08em", fontVariantCaps: "all-small-caps" }}>{x.k}</div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--ink)", marginTop: 2 }}>{x.v}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding={20}>
            <Eyebrow>reasoning timeline</Eyebrow>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { k: "Thought",     v: "This prompt targets a specialized support task." },
                { k: "Action",      v: "Classify tone + extract variables." },
                { k: "Observation", v: "One placeholder detected; no injection patterns." },
              ].map((x, i) => (
                <div key={i} style={{ borderLeft: "2px solid var(--amber-rule)", paddingLeft: 12 }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--ink-soft)", letterSpacing: "0.08em", fontVariantCaps: "all-small-caps" }}>{x.k}</div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 13.5, color: "var(--ink)", marginTop: 2 }}>{x.v}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ModulesScreen() {
  const mods = [
    { type: "Role",          title: "Senior technical reviewer",          body: "You are a senior engineer reviewing this change. Prioritize correctness, security, and regressions." },
    { type: "Goal",          title: "Stay under 180 words",                body: "Produce a reply that fits under 180 words while preserving the rhythm of the source." },
    { type: "Constraint",    title: "No direct copying",                  body: "Use external inspiration but never reproduce copyrighted material verbatim." },
    { type: "Output Format", title: "JSON with four fields",              body: "{ summary, risks, next_step, open_questions } — strings only." },
    { type: "Style",         title: "Calm, empathetic, specific",         body: "Open with a concrete observation. Avoid vague encouragement. End with one concrete next step." },
    { type: "Self Check",    title: "Risk re-read",                        body: "Re-read the reply. Flag any risk signals, missing caveats, or PII before sending." },
  ];
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        eyebrow="reusable operators"
        title="Modules"
        description="Maintain the reusable roles, goals, constraints, and formats that power stronger prompt systems."
      >
        <Button variant="primary" icon={I.Plus}>New module</Button>
      </PageHeader>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
        {mods.map((m, i) => (
          <Card key={i} padding={20}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Tag>{m.type.toLowerCase()}</Tag>
              <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-soft)" }}>¶ {String(i+1).padStart(2,"0")}</span>
            </div>
            <h3 style={{ margin: "4px 0 8px", fontFamily: "var(--font-serif)", fontSize: 17, color: "var(--ink)", fontWeight: 600 }}>{m.title}</h3>
            <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.6 }}>{m.body}</p>
            <hr className="rule"/>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-soft)" }}><I.Clock size={11}/>Apr 18</span>
              <Button variant="ghost" style={{ height: 26, fontSize: 11, padding: "0 10px" }} iconRight={I.ArrowUpRight}>Insert</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LoginScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)", padding: 40 }}>
      <div style={{ width: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, background: "var(--ivory)",
            border: "2px solid var(--ink)", borderRadius: 5,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-serif)", fontWeight: 600, fontStyle: "italic",
            fontSize: 24, color: "var(--verdigris-deep)",
          }}>p</div>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>Prompt IDE</div>
            <div className="eyebrow">prompt r&amp;d workbench</div>
          </div>
        </div>

        <Card padding={26}>
          <Eyebrow>vault access</Eyebrow>
          <h1 style={{ margin: "6px 0 8px", fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.015em" }}>Sign in</h1>
          <p style={{ margin: "0 0 18px", fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.6 }}>Enter your workspace password to unlock Prompt IDE.</p>

          <label style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-muted)", letterSpacing: "0.04em" }}>password</label>
          <input type="password" defaultValue="••••••••" style={{
            display: "block", width: "100%", marginTop: 4, padding: "10px 12px",
            fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink)",
            background: "var(--paper)", border: "1px solid var(--rule-fine)",
            borderRadius: 4, outline: "none", boxSizing: "border-box",
          }}/>
          <Button variant="primary" style={{ width: "100%", marginTop: 18, height: 40 }}>Unlock</Button>
        </Card>

        <p style={{ marginTop: 16, textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-soft)" }}>Log in to access the Playground.</p>
      </div>
    </div>
  );
}

Object.assign(window, { PromptsScreen, EditorScreen, PlaygroundScreen, ModulesScreen, LoginScreen });
