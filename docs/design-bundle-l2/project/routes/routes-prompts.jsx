/* Routes: Prompts (library + detail), Editor (new + existing) */

const samplePrompts = [
  { id: "p1", title: "Senior writing assistant", desc: "Rewrite rough notes into a polished article intro for a specific audience, tone, and length.", model: "Claude", status: "production", tags: ["writing","audience","tone"], fav: true, updated: "Apr 22", chars: 412, v: 7 },
  { id: "p2", title: "Bilingual product announcement", desc: "Translate product announcements while preserving bullet structure and product names.", model: "GPT", status: "production", tags: ["translation","bilingual"], fav: false, updated: "Apr 21", chars: 380, v: 4 },
  { id: "p3", title: "Support reply triage", desc: "Reply to the user issue using a calm, empathetic tone; clarify root cause and next step.", model: "Claude", status: "inbox", tags: ["support","empathy","policy"], fav: true, updated: "Apr 20", chars: 298, v: 3 },
  { id: "p4", title: "Code review — regressions first", desc: "Review the code change like a senior engineer; bugs, regressions, missing tests first.", model: "GPT", status: "production", tags: ["code","review"], fav: false, updated: "Apr 18", chars: 455, v: 5 },
  { id: "p5", title: "Benchmark scorecard writer", desc: "Produce a clarity / reusability / controllability / deployment readout for any saved version.", model: "Claude", status: "archived", tags: ["benchmark","scorecard"], fav: false, updated: "Apr 14", chars: 521, v: 2 },
  { id: "p6", title: "Module self-check outline", desc: "Self-check block that asks the model to re-read its reply and flag risk signals before sending.", model: "Claude", status: "production", tags: ["self-check","format"], fav: true, updated: "Apr 12", chars: 202, v: 6 },
  { id: "p7", title: "Release note author", desc: "Draft tight, present-tense release notes from a PR summary; surface risk + rollback steps.", model: "Claude", status: "inbox", tags: ["release","writing"], fav: false, updated: "Apr 10", chars: 348, v: 1 },
  { id: "p8", title: "Meeting debrief compressor", desc: "Summarize a meeting transcript into decisions, open questions, and action items only.", model: "Gemini", status: "production", tags: ["meeting","summary"], fav: false, updated: "Apr 09", chars: 276, v: 3 },
];

function PromptCard({ p, onOpen }) {
  return (
    <Card padding={0} style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 18px 12px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{
          width: 32, height: 32, background: "var(--paper-deep)",
          border: "1px solid var(--rule-fine)", borderRadius: 4,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--verdigris-deep)", flexShrink: 0, marginTop: 2,
        }}><I.Sparkles size={14}/></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3, marginBottom: 4 }}>{p.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <StatusDot status={p.status} small/>
            <span style={{ color: "var(--ink-soft)", fontSize: 10 }}>·</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-muted)", letterSpacing: "0.04em" }}>{p.model}</span>
            <span style={{ color: "var(--ink-soft)", fontSize: 10 }}>·</span>
            <Folio>v{p.v}</Folio>
          </div>
        </div>
        <button title="Favorite" style={{
          width: 26, height: 26, border: "1px solid var(--rule-fine)", background: "var(--ivory)",
          borderRadius: 3, cursor: "pointer", color: p.fav ? "var(--amber-rule)" : "var(--ink-soft)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <I.Star size={12} fill={p.fav ? "var(--amber-rule)" : "none"}/>
        </button>
      </div>
      <div style={{ padding: "0 18px" }}>
        <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.55, minHeight: 60 }}>{p.desc}</p>
      </div>
      <div style={{ padding: "12px 18px 0", display: "flex", flexWrap: "wrap", gap: 5 }}>
        {p.tags.map(t => <Tag key={t}>{t}</Tag>)}
      </div>
      <hr className="rule" style={{ margin: "12px 0 0" }}/>
      <div style={{ padding: "9px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-soft)", letterSpacing: "0.04em" }}>
          <I.Clock size={11}/>{p.updated}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button title="Copy" style={iconBtn}><I.Copy size={11}/></button>
          <button title="Open" onClick={onOpen} style={{ ...iconBtn, background: "var(--verdigris)", color: "var(--ivory)", borderColor: "var(--verdigris-deep)" }}><I.ArrowUpRight size={11}/></button>
        </div>
      </div>
    </Card>
  );
}

function PromptRow({ p, onOpen }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "32px 2fr 120px 1.4fr 80px 70px 36px", gap: 14, alignItems: "center", padding: "11px 6px", borderTop: "1px solid var(--rule-fine)" }}>
      <I.Star size={13} fill={p.fav ? "var(--amber-rule)" : "none"} style={{ color: p.fav ? "var(--amber-rule)" : "var(--ink-soft)" }}/>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{p.title}</div>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 12, color: "var(--ink-muted)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.desc}</div>
      </div>
      <StatusDot status={p.status} small/>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{p.tags.slice(0, 3).map(t => <Tag key={t}>{t}</Tag>)}</div>
      <Folio>{p.model}</Folio>
      <Folio>{p.updated}</Folio>
      <button onClick={onOpen} style={{ ...iconBtn }}><I.ArrowUpRight size={11}/></button>
    </div>
  );
}

function PromptsRoute({ onNav }) {
  const [filter, setFilter] = React.useState("all");
  const [view, setView] = React.useState("card");
  const [model, setModel] = React.useState("all");
  const filtered = samplePrompts.filter(p =>
    (filter === "all" || p.status === filter) && (model === "all" || p.model === model)
  );
  return (
    <div style={{ padding: "24px 30px 60px", maxWidth: 1280, margin: "0 auto" }}>
      <PageHeader
        eyebrow="prompt library"
        title="Prompts"
        description="Discover prompt assets quickly, move between status buckets, and keep the strongest entries within easy reach."
      >
        <Button variant="ghost" icon={I.Download}>Export</Button>
        <Button variant="primary" icon={I.Plus} onClick={() => onNav("editor")}>New prompt</Button>
      </PageHeader>

      {/* Filter row */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 2, padding: 2, background: "var(--paper-deep)", border: "1px solid var(--rule-fine)", borderRadius: 4 }}>
          {["all", "inbox", "production", "archived"].map(k => (
            <button key={k} onClick={() => setFilter(k)} style={{
              fontFamily: "var(--font-sans)", fontSize: 11.5, padding: "5px 11px", border: "none",
              background: filter === k ? "var(--ivory)" : "transparent",
              color: filter === k ? "var(--ink)" : "var(--ink-muted)",
              borderRadius: 3, cursor: "pointer",
              boxShadow: filter === k ? "var(--shadow-page)" : "none",
            }}>{k}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 5 }}>
          {["all","Claude","GPT","Gemini"].map(m => (
            <Chip key={m} active={model === m} onClick={() => setModel(m)}>{m}</Chip>
          ))}
        </div>

        <div style={{ display: "flex", gap: 5 }}>
          <Chip icon={I.Hash}>writing</Chip>
          <Chip icon={I.Hash}>code</Chip>
          <Chip icon={I.Hash}>support</Chip>
          <Chip icon={I.Plus}>tag</Chip>
        </div>

        <div style={{ flex: 1 }}/>

        <Folio>{filtered.length} of {samplePrompts.length} shown</Folio>

        <div style={{ display: "flex", padding: 2, background: "var(--paper-deep)", border: "1px solid var(--rule-fine)", borderRadius: 4 }}>
          {[{ k: "card", I: I.Grid }, { k: "list", I: I.List }].map(o => (
            <button key={o.k} onClick={() => setView(o.k)} title={o.k} style={{
              width: 26, height: 22, border: "none", cursor: "pointer",
              background: view === o.k ? "var(--ivory)" : "transparent",
              color: view === o.k ? "var(--ink)" : "var(--ink-muted)",
              borderRadius: 3,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: view === o.k ? "var(--shadow-page)" : "none",
            }}><o.I size={12}/></button>
          ))}
        </div>
      </div>

      {view === "card" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {filtered.map(p => <PromptCard key={p.id} p={p} onOpen={() => onNav("prompt-detail")}/>)}
        </div>
      ) : (
        <Card padding={0}>
          <div style={{ display: "grid", gridTemplateColumns: "32px 2fr 120px 1.4fr 80px 70px 36px", gap: 14, padding: "9px 6px" }}>
            <span/>
            <Eyebrow style={{ fontSize: 10 }}>prompt</Eyebrow>
            <Eyebrow style={{ fontSize: 10 }}>status</Eyebrow>
            <Eyebrow style={{ fontSize: 10 }}>tags</Eyebrow>
            <Eyebrow style={{ fontSize: 10 }}>model</Eyebrow>
            <Eyebrow style={{ fontSize: 10 }}>updated</Eyebrow>
            <span/>
          </div>
          {filtered.map(p => <PromptRow key={p.id} p={p} onOpen={() => onNav("prompt-detail")}/>)}
        </Card>
      )}
    </div>
  );
}

function PromptDetailRoute({ onNav }) {
  return (
    <div style={{ padding: "22px 30px 60px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <button onClick={() => onNav("prompts")} style={{ ...btnBase, ...btnVariants.ghost, height: 26, padding: "0 10px", fontSize: 11 }}>
          <I.ArrowLeft size={11}/> Back
        </button>
        <Folio>library / prompts / p1</Folio>
      </div>

      <PageHeader
        compact
        eyebrow="prompt record"
        title="Senior writing assistant"
        description="Evolve this prompt through analysis, refactor, versioning, and benchmark comparison."
      >
        <Button variant="ghost" icon={I.Copy}>Clone</Button>
        <Button variant="ghost" icon={I.Flask}>Run analysis</Button>
        <Button variant="primary" icon={I.Pen} onClick={() => onNav("editor-id")}>Edit</Button>
      </PageHeader>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 320px", gap: 14 }}>
        {/* Meta rail — left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card padding={18}>
            <Eyebrow>metadata</Eyebrow>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 11 }}>
              {[
                { k: "status", v: "Production", dot: "production" },
                { k: "model", v: "Claude" },
                { k: "category", v: "Writing" },
                { k: "source", v: "Self-authored" },
                { k: "created", v: "Feb 04, 2026" },
                { k: "updated", v: "Apr 22, 2026" },
                { k: "last used", v: "Apr 22, 2026" },
              ].map(f => (
                <div key={f.k} style={{ display: "flex", gap: 10 }}>
                  <Folio style={{ minWidth: 72, paddingTop: 2 }}>{f.k}</Folio>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {f.dot
                      ? <StatusDot status={f.dot} small/>
                      : <span style={{ fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--ink)" }}>{f.v}</span>}
                  </div>
                </div>
              ))}
            </div>
            <hr className="rule"/>
            <Eyebrow>tags</Eyebrow>
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
              <Tag>writing</Tag><Tag>audience</Tag><Tag>tone</Tag><Tag>intro</Tag>
            </div>
          </Card>

          <Card padding={18}>
            <Eyebrow>variables</Eyebrow>
            <div style={{ marginTop: 8 }}>
              {[
                { n: "audience", d: "Target reader, e.g. product designers", def: "product designers" },
                { n: "tone", d: "Tonal posture", def: "reflective" },
                { n: "word_limit", d: "Length cap", def: "180" },
              ].map((v, i) => (
                <div key={i} style={{ padding: "8px 0", borderTop: i === 0 ? "none" : "1px solid var(--rule-fine)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--verdigris-deep)", background: "var(--verdigris-wash)", padding: "1px 5px", borderRadius: 2 }}>{`{{${v.n}}}`}</span>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 12, color: "var(--ink-muted)", marginTop: 4, lineHeight: 1.45 }}>{v.d}</div>
                  <Folio style={{ display: "block", marginTop: 3 }}>default: {v.def}</Folio>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Markdown content — center */}
        <Card padding={0}>
          <div style={{ padding: "12px 22px", borderBottom: "1px solid var(--rule-fine)", display: "flex", alignItems: "center", gap: 12 }}>
            <Eyebrow>prompt content</Eyebrow>
            <div style={{ flex: 1 }}/>
            <Folio>v7 · current</Folio>
            <span style={{ color: "var(--ink-soft)" }}>·</span>
            <Folio>412 chars · ~62 words</Folio>
          </div>

          <div style={{ padding: "26px 32px" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, lineHeight: 1.75, color: "var(--ink)", maxWidth: "64ch" }}>
              <p style={{ margin: "0 0 16px" }}>You are a senior writing assistant.</p>
              <p style={{ margin: "0 0 16px" }}>Rewrite the following rough notes into a polished article intro for <code>{'{{audience}}'}</code>. Keep the tone <code>{'{{tone}}'}</code>, stay under <code>{'{{word_limit}}'}</code> words, and end with one concrete next step.</p>
              <p style={{ margin: 0 }}>The intro should open with a specific image, not an abstract claim.</p>
            </div>

            <hr className="rule" style={{ margin: "26px 0" }}/>

            <Eyebrow>notes</Eyebrow>
            <blockquote style={{ marginTop: 10 }}>
              Tightened the audience variable after v6 kept producing generic tech copy. Reflective tone works best when the rough notes carry a concrete observation in the first line.
            </blockquote>

            <hr className="rule" style={{ margin: "26px 0" }}/>

            <Eyebrow>benchmark evolution</Eyebrow>
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[
                { k: "clarity", v: "92", d: "+4" },
                { k: "reusability", v: "88", d: "+7" },
                { k: "controllability", v: "85", d: "±0" },
                { k: "deployment", v: "90", d: "+2" },
              ].map(x => (
                <div key={x.k} style={{ border: "1px solid var(--rule-fine)", borderRadius: 4, padding: "10px 12px" }}>
                  <Eyebrow style={{ fontSize: 10 }}>{x.k}</Eyebrow>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--ink)", marginTop: 2, fontWeight: 600 }}>{x.v}</div>
                  <Folio style={{ color: "var(--verdigris-deep)" }}>{x.d}</Folio>
                </div>
              ))}
            </div>
          </div>

          {/* Version strip */}
          <div style={{ borderTop: "1px solid var(--rule-fine)", padding: "14px 22px", background: "var(--paper-deep)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Eyebrow>version trail</Eyebrow>
              <span style={{ marginLeft: "auto", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-muted)" }}>7 immutable cuts</span>
            </div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
              {[
                { v: 7, n: "Tightened audience", d: "Apr 22", cur: true },
                { v: 6, n: "Reworked tone variable", d: "Apr 14" },
                { v: 5, n: "Added word_limit", d: "Apr 08", bl: true },
                { v: 4, n: "Specific image opener", d: "Apr 01" },
                { v: 3, n: "Second draft", d: "Mar 22" },
                { v: 2, n: "Initial refinement", d: "Feb 18" },
                { v: 1, n: "First capture", d: "Feb 04" },
              ].map((v, i) => (
                <div key={i} style={{
                  flexShrink: 0, width: 150,
                  border: "1px solid " + (v.cur ? "var(--verdigris)" : "var(--rule-fine)"),
                  background: v.cur ? "var(--verdigris-wash)" : "var(--ivory)",
                  borderRadius: 4, padding: "8px 10px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {v.cur && <I.CircleDot size={10} style={{ color: "var(--verdigris)" }}/>}
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: v.cur ? "var(--verdigris-deep)" : "var(--ink)" }}>v{v.v}</span>
                    {v.bl && <Folio style={{ marginLeft: "auto", fontSize: 9, color: "var(--amber-rule)" }}>baseline</Folio>}
                  </div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 11.5, color: "var(--ink)", marginTop: 3, lineHeight: 1.3 }}>{v.n}</div>
                  <Folio style={{ marginTop: 3, fontSize: 9 }}>{v.d}</Folio>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Agent pane — right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card padding={18}>
            <Eyebrow>agent analysis</Eyebrow>
            <h4 style={{ margin: "2px 0 8px", fontFamily: "var(--font-serif)", fontSize: 14.5, color: "var(--ink)" }}>No blockers detected</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 6 }}>
              {[
                { i: I.Check, c: "var(--verdigris-deep)", t: "User intent is clear" },
                { i: I.Check, c: "var(--verdigris-deep)", t: "Request is well-structured" },
                { i: I.Check, c: "var(--verdigris-deep)", t: "No sensitive content" },
                { i: I.AlertCircle, c: "var(--amber-rule)", t: "Complexity: medium" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink)" }}>
                  <s.i size={12} style={{ color: s.c, flexShrink: 0 }}/>{s.t}
                </div>
              ))}
            </div>
          </Card>

          <Card padding={18}>
            <Eyebrow>refactor proposal</Eyebrow>
            <p style={{ margin: "4px 0 10px", fontFamily: "var(--font-serif)", fontSize: 12.5, color: "var(--ink-muted)", lineHeight: 1.55 }}>
              MiniMax prepared a cleaner draft with a tighter opening and an explicit output format.
            </p>
            <div style={{ padding: "10px 12px", background: "var(--paper-deep)", border: "1px solid var(--rule-fine)", borderRadius: 4 }}>
              <Folio>proposal v8</Folio>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 12.5, color: "var(--ink)", marginTop: 3, lineHeight: 1.5 }}>Drop passive voice in the first sentence. Add an explicit "end with a specific next step" format clause.</div>
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
              <Button variant="primary" style={{ flex: 1, height: 28, fontSize: 11.5 }}>Apply</Button>
              <Button variant="ghost" style={{ flex: 1, height: 28, fontSize: 11.5 }}>Compare</Button>
            </div>
          </Card>

          <Card padding={18}>
            <Eyebrow>similar prompts</Eyebrow>
            <div style={{ marginTop: 8 }}>
              {[
                { t: "Bilingual product announcement", s: "0.62" },
                { t: "Release note author", s: "0.54" },
              ].map((x, i) => (
                <div key={i} style={{ padding: "8px 0", borderTop: i === 0 ? "none" : "1px solid var(--rule-fine)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: 12.5, color: "var(--ink)" }}>{x.t}</span>
                  <Folio>{x.s}</Folio>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EditorRoute({ onNav, isNew }) {
  const title = isNew ? "New prompt" : "Senior writing assistant";
  const eyebrow = isNew ? "workspace · new" : "workspace";
  return (
    <div style={{ padding: "22px 30px 60px", maxWidth: 1320, margin: "0 auto" }}>
      {!isNew && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <button onClick={() => onNav("prompt-detail")} style={{ ...btnBase, ...btnVariants.ghost, height: 26, padding: "0 10px", fontSize: 11 }}>
            <I.ArrowLeft size={11}/> Back to record
          </button>
          <Folio>library / prompts / p1 / edit</Folio>
        </div>
      )}

      <PageHeader
        compact
        eyebrow={eyebrow}
        title={title}
        description="Shape prompt content, review live structure, and run the MiniMax agent without leaving the workspace."
      >
        {!isNew && <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--vermillion)", fontStyle: "italic" }}>(unsaved changes)</span>}
        <Button variant="ghost" icon={I.Copy}>Clone</Button>
        <Button variant="primary" icon={I.Check}>Save version</Button>
      </PageHeader>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 320px", gap: 14 }}>
        {/* Metadata form */}
        <Card padding={18}>
          <Eyebrow>prompt metadata</Eyebrow>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
            <FormField label="title *" value={isNew ? "" : "Senior writing assistant"} placeholder="Prompt title"/>
            <FormField label="description" value={isNew ? "" : "Rewrite rough notes into a polished article intro."} placeholder="Brief description" multiline/>
            <FormField label="model" value="Claude" select options={["Claude","GPT","Gemini","Universal"]}/>
            <FormField label="status" value={isNew ? "Inbox" : "Production"} select options={["Inbox","Production","Archived"]}/>
            <FormField label="category" value="Writing" select options={["Writing","Code","Data","Marketing"]}/>
            <FormField label="source" value={isNew ? "" : "Self-authored"} placeholder="Where did this come from?"/>
            <div>
              <Folio style={{ display: "block", marginBottom: 5 }}>tags</Folio>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, padding: "6px 8px", background: "var(--paper)", border: "1px solid var(--rule-fine)", borderRadius: 4, minHeight: 28, alignItems: "center" }}>
                {(isNew ? [] : ["writing","audience","tone"]).map(t => (
                  <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 6px", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-muted)", background: "var(--paper-deep)", border: "1px solid var(--rule-fine)", borderRadius: 3 }}>
                    #{t}<I.X size={9} style={{ cursor: "pointer" }}/>
                  </span>
                ))}
                <input placeholder="add tag…" style={{ border: "none", outline: "none", background: "transparent", flex: 1, minWidth: 60, fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink)" }}/>
              </div>
            </div>
          </div>
        </Card>

        {/* Prose editor */}
        <Card padding={0} style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--rule-fine)", display: "flex", alignItems: "center", gap: 12 }}>
            <Eyebrow>prompt canvas</Eyebrow>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-muted)" }}>dynamic placeholders enabled — use {'{{variable}}'}</span>
            <div style={{ flex: 1 }}/>
            <Folio>{isNew ? "0 chars · 0 lines · 0 variables" : "412 chars · 7 lines · 3 variables"}</Folio>
          </div>

          {isNew ? (
            <div style={{ flex: 1, padding: "32px 28px", minHeight: 380, display: "flex", alignItems: "flex-start" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.7 }}>
                Write your prompt here…<br/>
                Use <span style={{ color: "var(--verdigris-deep)" }}>{'{{variable}}'}</span> for dynamic values.
              </div>
            </div>
          ) : (
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
          )}

          <div style={{ padding: "10px 20px", borderTop: "1px solid var(--rule-fine)", display: "flex", alignItems: "center", gap: 8, background: "var(--paper-deep)" }}>
            <Eyebrow style={{ fontSize: 10 }}>notes</Eyebrow>
            <input placeholder="Personal notes about this prompt…" style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              fontFamily: "var(--font-serif)", fontSize: 12.5, fontStyle: "italic", color: "var(--ink-muted)",
            }}/>
          </div>
        </Card>

        {/* Tools rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 2, padding: 2, background: "var(--paper-deep)", border: "1px solid var(--rule-fine)", borderRadius: 4 }}>
            {[{ k: "Preview", a: true }, { k: "Agent" }, { k: "Versions" }, { k: "Modules" }].map(t => (
              <button key={t.k} style={{
                flex: 1, fontFamily: "var(--font-sans)", fontSize: 11.5, padding: "5px 0", border: "none",
                background: t.a ? "var(--ivory)" : "transparent",
                color: t.a ? "var(--ink)" : "var(--ink-muted)",
                borderRadius: 3, cursor: "pointer",
                boxShadow: t.a ? "var(--shadow-page)" : "none",
              }}>{t.k}</button>
            ))}
          </div>

          <Card padding={18}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Eyebrow>live preview</Eyebrow>
              <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--verdigris-deep)", background: "var(--verdigris-wash)", padding: "2px 5px", borderRadius: 2, letterSpacing: "0.04em" }}>preview mode</span>
            </div>
            {isNew ? (
              <p style={{ margin: "6px 0 0", fontFamily: "var(--font-serif)", fontSize: 12.5, color: "var(--ink-soft)", fontStyle: "italic", lineHeight: 1.55 }}>Start writing to see a preview.</p>
            ) : (
              <p style={{ margin: "6px 0 0", fontFamily: "var(--font-serif)", fontSize: 12.5, lineHeight: 1.6, color: "var(--ink)" }}>
                You are a senior writing assistant. Rewrite the following rough notes into a polished article intro for <em>product designers</em>. Keep the tone <em>reflective</em>, stay under <em>180</em> words, and end with one concrete next step.
              </p>
            )}

            <hr className="rule" style={{ margin: "14px 0 10px" }}/>
            <Eyebrow>variables in play</Eyebrow>
            {isNew ? (
              <p style={{ margin: "4px 0 0", fontFamily: "var(--font-serif)", fontSize: 11.5, color: "var(--ink-soft)", fontStyle: "italic" }}>No variables yet.</p>
            ) : (
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                {[["audience","product designers"],["tone","reflective"],["word_limit","180"]].map(([n,v]) => (
                  <div key={n} style={{ display: "flex", gap: 8, fontSize: 11 }}>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--verdigris-deep)" }}>{`{{${n}}}`}</span>
                    <span style={{ fontFamily: "var(--font-serif)", color: "var(--ink-muted)" }}>→ {v}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card padding={18}>
            <Eyebrow>preview stats</Eyebrow>
            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {[
                { k: "chars", v: isNew ? "0" : "412" },
                { k: "words", v: isNew ? "0" : "62" },
                { k: "vars", v: isNew ? "0" : "3" },
              ].map(x => (
                <div key={x.k} style={{ border: "1px solid var(--rule-fine)", borderRadius: 3, padding: "7px 8px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>{x.v}</div>
                  <Folio style={{ fontSize: 9 }}>{x.k}</Folio>
                </div>
              ))}
            </div>
            <hr className="rule" style={{ margin: "12px 0 8px" }}/>
            <Button variant="ghost" icon={I.Flask} style={{ width: "100%", height: 30, fontSize: 12 }}>Run analysis</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, placeholder, multiline, select, options }) {
  return (
    <div>
      <Folio style={{ display: "block", marginBottom: 5 }}>{label}</Folio>
      {multiline ? (
        <textarea defaultValue={value} placeholder={placeholder} style={{
          width: "100%", minHeight: 54, padding: "7px 9px", boxSizing: "border-box",
          fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--ink)",
          background: "var(--paper)", border: "1px solid var(--rule-fine)",
          borderRadius: 4, outline: "none", resize: "vertical",
        }}/>
      ) : select ? (
        <div style={{
          display: "flex", alignItems: "center", padding: "0 10px", height: 30,
          background: "var(--paper)", border: "1px solid var(--rule-fine)", borderRadius: 4,
          fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink)",
        }}>
          <span>{value}</span><I.ChevronDown size={11} style={{ marginLeft: "auto", color: "var(--ink-soft)" }}/>
        </div>
      ) : (
        <input defaultValue={value} placeholder={placeholder} style={{
          width: "100%", padding: "7px 9px", boxSizing: "border-box", height: 30,
          fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink)",
          background: "var(--paper)", border: "1px solid var(--rule-fine)",
          borderRadius: 4, outline: "none",
        }}/>
      )}
    </div>
  );
}

Object.assign(window, { PromptsRoute, PromptDetailRoute, EditorRoute });
