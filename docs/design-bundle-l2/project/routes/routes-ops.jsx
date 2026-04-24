/* Routes: Modules, Docs, Admin */

function ModulesRoute() {
  const mods = [
    { type: "role", title: "Senior technical reviewer", body: "You are a senior engineer reviewing this change. Prioritize correctness, security, and regressions first.", uses: 12 },
    { type: "goal", title: "Stay under 180 words", body: "Produce a reply that fits under 180 words while preserving the rhythm of the source.", uses: 8 },
    { type: "constraint", title: "No direct copying", body: "Use external inspiration but never reproduce copyrighted material verbatim.", uses: 4 },
    { type: "output format", title: "JSON with four fields", body: "{ summary, risks, next_step, open_questions } — strings only.", uses: 6 },
    { type: "style", title: "Calm, empathetic, specific", body: "Open with a concrete observation. Avoid vague encouragement. End with one concrete next step.", uses: 9 },
    { type: "self check", title: "Risk re-read", body: "Re-read the reply. Flag any risk signals, missing caveats, or PII before sending.", uses: 11 },
  ];
  const suggestions = [
    { type: "role", title: "Bilingual copy reviewer", from: "Bilingual product announcement · v4" },
    { type: "style", title: "Tight present-tense voice", from: "Release note author · v1" },
    { type: "constraint", title: "Keep product names unchanged", from: "Bilingual product announcement · v4" },
  ];

  return (
    <div style={{ padding: "24px 30px 60px", maxWidth: 1280, margin: "0 auto" }}>
      <PageHeader
        eyebrow="reusable operators"
        title="Modules"
        description="Maintain the reusable roles, goals, constraints, and formats that power stronger prompt systems."
      >
        <Button variant="ghost" icon={I.Filter}>Filter</Button>
        <Button variant="primary" icon={I.Plus}>New module</Button>
      </PageHeader>

      {/* Type filter */}
      <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
        <Chip active>all</Chip>
        {["role","goal","constraint","output format","style","self check"].map(t => <Chip key={t}>{t}</Chip>)}
        <div style={{ flex: 1 }}/>
        <Folio>6 modules · {mods.reduce((a,m) => a + m.uses, 0)} insertions</Folio>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 12 }}>
          {mods.map((m, i) => (
            <Card key={i} padding={18}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Tag>{m.type}</Tag>
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-soft)" }}>¶ {String(i+1).padStart(2,"0")}</span>
              </div>
              <h3 style={{ margin: "2px 0 6px", fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--ink)", fontWeight: 600, lineHeight: 1.3 }}>{m.title}</h3>
              <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 12.5, color: "var(--ink-muted)", lineHeight: 1.55 }}>{m.body}</p>
              <hr className="rule"/>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Folio>{m.uses} uses · Apr 18</Folio>
                <button style={{ ...btnBase, ...btnVariants.ghost, height: 24, padding: "0 9px", fontSize: 11 }}>Insert <I.ArrowUpRight size={10}/></button>
              </div>
            </Card>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card padding={18}>
            <Eyebrow>module suggestions</Eyebrow>
            <p style={{ margin: "4px 0 10px", fontFamily: "var(--font-serif)", fontSize: 12.5, color: "var(--ink-muted)", lineHeight: 1.55 }}>MiniMax detected reusable fragments across recent prompt edits.</p>
            {suggestions.map((s, i) => (
              <div key={i} style={{ padding: "9px 0", borderTop: i === 0 ? "none" : "1px solid var(--rule-fine)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Tag style={{ fontSize: 9.5 }}>{s.type}</Tag>
                </div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--ink)", fontWeight: 500, marginTop: 4 }}>{s.title}</div>
                <Folio style={{ display: "block", marginTop: 2 }}>from {s.from}</Folio>
                <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
                  <button style={{ ...btnBase, ...btnVariants.primary, height: 24, padding: "0 8px", fontSize: 11 }}>Create</button>
                  <button style={{ ...btnBase, ...btnVariants.ghost, height: 24, padding: "0 8px", fontSize: 11 }}>Dismiss</button>
                </div>
              </div>
            ))}
          </Card>

          <Card padding={18}>
            <Eyebrow>insertion map</Eyebrow>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { m: "Risk re-read", c: 11 },
                { m: "Senior technical reviewer", c: 12 },
                { m: "Calm, empathetic, specific", c: 9 },
                { m: "Stay under 180 words", c: 8 },
              ].map(x => (
                <div key={x.m}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-muted)", marginBottom: 3 }}>
                    <span>{x.m}</span><Folio>{x.c}</Folio>
                  </div>
                  <div style={{ height: 4, background: "var(--paper-deep)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: (x.c / 12 * 100) + "%", background: "var(--verdigris)" }}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DocsRoute() {
  return (
    <div style={{ padding: "28px 40px 80px", maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 6 }}>
        <Folio>§ docs / workflow guide</Folio>
        <span style={{ color: "var(--ink-soft)" }}>·</span>
        <Folio>updated apr 18, 2026</Folio>
      </div>
      <div className="eyebrow" style={{ marginTop: 10 }}>prompt ide handbook</div>
      <h1 style={{ margin: "4px 0 8px", fontFamily: "var(--font-serif)", fontSize: 40, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>Working the Prompt IDE.</h1>
      <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 17, color: "var(--ink-muted)", lineHeight: 1.5, maxWidth: "60ch" }}>
        A handbook for the one operator who uses it — how to move from capture to analysis to benchmark without losing the working surface.
      </p>

      <hr className="rule rule-amber" style={{ margin: "26px 0 30px" }}/>

      {[
        {
          n: "§1", t: "Capture first, refine later",
          p: "Drop every raw instruction into the Inbox as soon as you see it. Polishing is cheap once the shape is stable; a lost draft is not. Treat the Inbox as a working margin — the prompt does not need a title, a tag, or a category on its way in.",
          note: "Draft hard. Keep the good copy.",
        },
        {
          n: "§2", t: "Author, test, release",
          p: "The three verbs describe one rhythm. Author in the Editor until a draft runs end-to-end. Test it in the Playground — stateless, no writes, no version trail. Only then promote to Production, where every save creates an immutable snapshot you can restore from later.",
        },
        {
          n: "§3", t: "Version the wins",
          p: "The snapshot system is quiet on purpose. You will not feel it working until the day you need to roll back. Mark the version that represented your clearest thinking as baseline; the benchmark compares later cuts against that anchor instead of the latest working draft.",
          aside: "Baselines anchor evolution. Not every version deserves one.",
        },
        {
          n: "§4", t: "Keep reusable fragments as modules",
          p: "When the same role, constraint, or self-check appears in three prompts, extract it. Modules live outside any one prompt record and can be inserted during authoring. The agent will suggest candidates after refactor runs — accept the ones that already feel like muscle memory.",
        },
        {
          n: "§5", t: "Run benchmarks sparingly",
          p: "Benchmarks are expensive, and cheap benchmarks produce cheap confidence. Run one when a refactor lands, or when a prompt crosses from Inbox to Production. Compare against baseline, not previous version — you care about the arc, not the swing.",
        },
      ].map((s, i) => (
        <section key={i} style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 28, marginBottom: 32 }}>
          <div>
            <Folio style={{ fontSize: 14, color: "var(--amber-rule)", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>{s.n}</Folio>
            {s.aside && (
              <div style={{ marginTop: 14, borderTop: "1px solid var(--amber-rule)", paddingTop: 10, fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.5 }}>{s.aside}</div>
            )}
            {s.note && (
              <div style={{ marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-soft)", letterSpacing: "0.04em" }}>† {s.note}</div>
            )}
          </div>
          <div>
            <h2 style={{ margin: "0 0 10px", fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>{s.t}</h2>
            <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 16, lineHeight: 1.7, color: "var(--ink)", maxWidth: "60ch" }}>{s.p}</p>
          </div>
        </section>
      ))}

      <hr className="rule" style={{ margin: "24px 0" }}/>

      <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 28 }}>
        <Folio style={{ fontSize: 14, color: "var(--amber-rule)", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>¶ keyboard</Folio>
        <div>
          <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 600, color: "var(--ink)" }}>Keyboard reference</h2>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 20px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink)" }}>
            {[
              [<><Kbd>⌘</Kbd><Kbd>K</Kbd></>, "Open command palette"],
              [<><Kbd>⌘</Kbd><Kbd>↵</Kbd></>, "Run analysis in Playground"],
              [<><Kbd>⌘</Kbd><Kbd>S</Kbd></>, "Save prompt as new version"],
              [<><Kbd>⌘</Kbd><Kbd>N</Kbd></>, "New prompt"],
              [<><Kbd>⌘</Kbd><Kbd>/</Kbd></>, "Toggle sidebar collapse"],
              [<><Kbd>⌘</Kbd><Kbd>D</Kbd></>, "Toggle theme"],
            ].map(([k, v], i) => (
              <React.Fragment key={i}>
                <div style={{ display: "flex", gap: 3 }}>{k}</div>
                <div style={{ color: "var(--ink-muted)" }}>{v}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 48, textAlign: "center" }}>
        <Folio>— end of handbook · page 1 of 1 —</Folio>
      </div>
    </div>
  );
}

function AdminRoute() {
  const [granted, setGranted] = React.useState(false);
  if (!granted) {
    return (
      <div style={{ padding: "24px 30px 60px", maxWidth: 760, margin: "0 auto" }}>
        <PageHeader
          compact
          eyebrow="workbench controls"
          title="Settings"
          description="Tune workspace defaults, MiniMax agent behavior, and recovery actions from one control surface."
        />
        <Card padding={0}>
          <div style={{ padding: "32px 40px 36px", textAlign: "center", borderBottom: "1px solid var(--rule-fine)" }}>
            <div style={{ width: 48, height: 48, margin: "0 auto 12px", background: "var(--vermillion-wash)", color: "var(--vermillion)", border: "1px solid var(--rule-fine)", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <I.Lock size={18}/>
            </div>
            <Eyebrow>access denied</Eyebrow>
            <h2 style={{ margin: "6px 0 8px", fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--ink)" }}>Administrator access required</h2>
            <p style={{ margin: "0 auto", fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.55, maxWidth: "52ch" }}>
              This page manages global workspace behavior and is only available to administrators. Sign in with the administrator password to change defaults, recovery actions, or agent-wide settings.
            </p>
          </div>
          <div style={{ padding: "20px 40px 26px", maxWidth: 420, margin: "0 auto" }}>
            <Folio style={{ display: "block", marginBottom: 5 }}>admin password</Folio>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "var(--paper)", border: "1px solid var(--rule-fine)", borderRadius: 4 }}>
              <I.Lock size={13} style={{ color: "var(--ink-soft)" }}/>
              <input type="password" defaultValue="••••••••" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink)" }}/>
            </div>
            <Button variant="primary" style={{ width: "100%", marginTop: 12 }} onClick={() => setGranted(true)}>Unlock settings</Button>
          </div>
        </Card>
      </div>
    );
  }
  return (
    <div style={{ padding: "24px 30px 60px", maxWidth: 1100, margin: "0 auto" }}>
      <PageHeader
        compact
        eyebrow="workbench controls"
        title="Settings"
        description="Tune workspace defaults, MiniMax agent behavior, and recovery actions from one control surface."
      >
        <Button variant="ghost" onClick={() => setGranted(false)}>Lock</Button>
      </PageHeader>

      {/* Summary row */}
      <Card padding={0} style={{ marginBottom: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)" }}>
          {[
            ["theme", "Light"], ["view", "Card"], ["model", "Claude"],
            ["status", "Inbox"], ["provider", "MiniMax"], ["depth", "Standard"],
          ].map(([k, v], i) => (
            <div key={k} style={{ padding: "12px 16px", borderLeft: i > 0 ? "1px solid var(--rule-fine)" : "none" }}>
              <Folio>{k}</Folio>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)", marginTop: 3 }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      {[
        {
          eyebrow: "§ 1", title: "Workspace defaults",
          desc: "Set the baseline view, model, status, and theme that should greet you across the workbench.",
          rows: [
            { k: "Theme", d: "Choose how the interface renders when you open on this machine.", c: <SegChoice options={["Light","Dark","System"]} active="Light"/> },
            { k: "Default view", d: "Pick the starting layout for prompt browsing pages.", c: <SegChoice options={["Card","List"]} active="Card"/> },
            { k: "Default model", d: "Set the model label new prompts should inherit by default.", c: <SelectBox value="Claude"/> },
            { k: "Default status", d: "Choose the lifecycle status assigned to new prompts.", c: <SelectBox value="Inbox"/> },
          ],
          note: "Defaults shape new work. These values seed newly created prompts across the workbench.",
        },
        {
          eyebrow: "§ 2", title: "Agent controls",
          desc: "Control which MiniMax capabilities run automatically and how strict the analysis pipeline should be.",
          rows: [
            { k: "Enable agent", d: "Run analysis on prompts.", c: <Toggle on/> },
            { k: "Auto-analyze", d: "Analyze new prompts automatically.", c: <Toggle on/> },
            { k: "Analyze on paste", d: "Trigger analysis immediately after text is pasted in.", c: <Toggle/> },
            { k: "Normalization", d: "Suggest content cleanup.", c: <Toggle on/> },
            { k: "Module extraction", d: "Detect reusable module candidates.", c: <Toggle on/> },
            { k: "Agent provider", d: "Choose which backend should drive analysis.", c: <SelectBox value="MiniMax"/> },
            { k: "Analysis depth", d: "Adjust how deeply the agent inspects structure and reuse.", c: <SegChoice options={["Quick","Standard","Deep"]} active="Standard"/> },
          ],
          note: "Agent rules stay centralized. MiniMax analysis, normalization, and module extraction all read from here.",
        },
        {
          eyebrow: "§ 3", title: "Thresholds",
          desc: "Define the minimum confidence, similarity, and risk severity the agent should surface.",
          rows: [
            { k: "Risk threshold", d: "Minimum risk severity surfaced as an actionable concern.", c: <SegChoice options={["Low","Medium","High"]} active="Medium"/> },
            { k: "Confidence threshold", d: "Minimum confidence score for agent recommendations (0–1).", c: <NumberBox value="0.72"/> },
            { k: "Similarity threshold", d: "Minimum similarity before two prompts are linked.", c: <NumberBox value="0.55"/> },
          ],
          note: "Thresholds guide signal strength. Confidence, similarity, and risk stay consistent across analysis.",
        },
        {
          eyebrow: "§ 4", title: "Data & recovery",
          desc: "Export a clean workspace snapshot, restore prompts and modules from backup JSON, or reset settings to defaults.",
          rows: [
            { k: "Export data", d: "Download prompts, modules, and current settings as a workspace snapshot JSON.", c: <Button variant="ghost" icon={I.Download}>Export</Button> },
            { k: "Import data", d: "Restore prompts, modules, and settings from a previously exported snapshot.", c: <Button variant="ghost" icon={I.Upload}>Import</Button> },
            { k: "Reset settings", d: "Restore default workspace behavior without deleting prompts or modules.", c: <Button variant="danger" icon={I.RotateCcw}>Reset</Button> },
          ],
          note: "Recovery actions stay explicit. Export keeps a portable snapshot; reset only affects settings defaults.",
        },
      ].map((sec, i) => (
        <section key={i} style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--amber-rule)" }}>{sec.eyebrow}</span>
            <h2 style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 600, color: "var(--ink)" }}>{sec.title}</h2>
          </div>
          <p style={{ margin: "0 0 10px", fontFamily: "var(--font-serif)", fontSize: 13.5, color: "var(--ink-muted)", lineHeight: 1.55, maxWidth: "60ch" }}>{sec.desc}</p>
          <Card padding={0}>
            {sec.rows.map((r, j) => (
              <div key={j} style={{
                display: "grid", gridTemplateColumns: "220px 1fr auto", gap: 18, alignItems: "center",
                padding: "14px 18px", borderTop: j === 0 ? "none" : "1px solid var(--rule-fine)",
              }}>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{r.k}</div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 12.5, color: "var(--ink-muted)", lineHeight: 1.5 }}>{r.d}</div>
                <div style={{ justifySelf: "end" }}>{r.c}</div>
              </div>
            ))}
          </Card>
          <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-soft)", letterSpacing: "0.03em" }}>† {sec.note}</div>
        </section>
      ))}
    </div>
  );
}

function SegChoice({ options, active }) {
  return (
    <div style={{ display: "flex", gap: 2, padding: 2, background: "var(--paper-deep)", border: "1px solid var(--rule-fine)", borderRadius: 4 }}>
      {options.map(o => (
        <span key={o} style={{
          fontFamily: "var(--font-sans)", fontSize: 11.5, padding: "4px 10px",
          background: o === active ? "var(--ivory)" : "transparent",
          color: o === active ? "var(--ink)" : "var(--ink-muted)",
          borderRadius: 3, boxShadow: o === active ? "var(--shadow-page)" : "none",
        }}>{o}</span>
      ))}
    </div>
  );
}
function SelectBox({ value }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6, padding: "0 10px", height: 28, minWidth: 140,
      background: "var(--ivory)", border: "1px solid var(--rule-fine)", borderRadius: 4,
      fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink)",
    }}>
      <span>{value}</span><I.ChevronDown size={11} style={{ marginLeft: "auto", color: "var(--ink-soft)" }}/>
    </div>
  );
}
function NumberBox({ value }) {
  return (
    <input defaultValue={value} style={{
      width: 86, height: 28, padding: "0 10px",
      fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--ink)",
      background: "var(--ivory)", border: "1px solid var(--rule-fine)", borderRadius: 4, outline: "none", textAlign: "right",
    }}/>
  );
}
function Toggle({ on }) {
  return (
    <div style={{
      width: 34, height: 18, borderRadius: 999, padding: 2, cursor: "pointer",
      background: on ? "var(--verdigris)" : "var(--paper-deep)",
      border: "1px solid " + (on ? "var(--verdigris-deep)" : "var(--rule-fine)"),
      display: "flex", alignItems: "center", justifyContent: on ? "flex-end" : "flex-start",
    }}>
      <span style={{ width: 12, height: 12, background: "var(--ivory)", borderRadius: "50%", boxShadow: "0 1px 1px rgba(0,0,0,0.1)" }}/>
    </div>
  );
}

Object.assign(window, { ModulesRoute, DocsRoute, AdminRoute });
