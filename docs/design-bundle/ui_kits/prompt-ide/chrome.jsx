/* Chrome — sidebar icon rail + top bar. Matches the codebase structure. */
const nav = [
  { id: "home", label: "Home", icon: I.Home },
  { id: "playground", label: "Playground", icon: I.Flask },
  { id: "prompts", label: "Prompts", icon: I.File },
  { id: "editor", label: "Editor", icon: I.Pen },
  { id: "modules", label: "Modules", icon: I.Puzzle },
  { id: "docs", label: "Docs", icon: I.Book },
];

function Sidebar({ active, onNav }) {
  return (
    <aside style={{
      width: 72, minWidth: 72, height: "100%",
      background: "var(--ivory)",
      borderRight: "1px solid var(--rule-fine)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        height: 72, display: "flex", alignItems: "center", justifyContent: "center",
        borderBottom: "1px solid var(--rule-fine)",
      }}>
        <button
          onClick={() => onNav("home")}
          title="Prompt IDE"
          style={{
            width: 44, height: 44, background: "var(--ivory)",
            border: "2px solid var(--ink)", borderRadius: 5,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            fontFamily: "var(--font-serif)", fontWeight: 600, fontStyle: "italic",
            fontSize: 24, color: "var(--verdigris-deep)", lineHeight: 1,
            padding: 0,
          }}
        >p</button>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "14px 10px" }}>
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              title={item.label}
              aria-label={item.label}
              style={{
                position: "relative",
                height: 44, width: "100%", border: "none",
                background: isActive ? "var(--verdigris-wash)" : "transparent",
                color: isActive ? "var(--verdigris-deep)" : "var(--ink-muted)",
                borderRadius: 4, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 120ms ease, color 120ms ease",
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--paper-deep)"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              {isActive && (
                <span style={{
                  position: "absolute", left: 0, top: 8, bottom: 8,
                  width: 2, background: "var(--verdigris)", borderRadius: 1,
                }}/>
              )}
              <Icon size={18} />
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "10px 10px 14px", borderTop: "1px solid var(--rule-fine)" }}>
        <button
          onClick={() => onNav("editor")}
          title="New prompt"
          style={{
            width: "100%", height: 44, padding: 0,
            border: "1px solid var(--ink)", background: "var(--ink)", color: "var(--ivory)",
            borderRadius: 4, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500,
            letterSpacing: "0.06em",
            flexDirection: "column",
          }}
        >
          <I.Plus size={16} />
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 9, letterSpacing: "0.08em" }}>new</span>
        </button>
        <button
          title="Log out"
          style={{
            marginTop: 8, width: "100%", height: 36, padding: 0,
            background: "transparent", color: "var(--ink-soft)",
            border: "1px solid transparent", borderRadius: 4, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        ><I.LogOut size={16} /></button>
      </div>
    </aside>
  );
}

function TopBar({ title, eyebrow, onNav, active }) {
  return (
    <header style={{
      height: 56, background: "var(--paper)",
      borderBottom: "1px solid var(--rule-fine)",
      display: "flex", alignItems: "center", gap: 16,
      padding: "0 24px",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, minWidth: 0, flexShrink: 0 }}>
        <span className="folio" style={{ color: "var(--ink-soft)", whiteSpace: "nowrap" }}>§ {eyebrow || "workbench"}</span>
        <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>/</span>
        <span style={{
          fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--ink)",
          fontWeight: 600, letterSpacing: "-0.005em", whiteSpace: "nowrap",
        }}>{title}</span>
      </div>

      <div style={{
        marginLeft: "auto",
        display: "flex", alignItems: "center", gap: 4,
        background: "var(--ivory)", border: "1px solid var(--rule-fine)",
        borderRadius: 5, padding: "6px 10px", width: 280,
      }}>
        <I.Search size={14} style={{ color: "var(--ink-soft)" }} />
        <input
          placeholder="Search prompts, modules, pages…"
          style={{
            border: "none", background: "transparent", outline: "none",
            flex: 1, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink)",
          }}
        />
        <kbd style={{
          fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-soft)",
          border: "1px solid var(--rule-fine)", borderBottomWidth: 2, borderRadius: 3,
          padding: "1px 5px", background: "var(--paper)",
        }}>⌘K</kbd>
      </div>

      <button title="Toggle theme" style={{
        width: 32, height: 32, border: "1px solid var(--rule-fine)",
        background: "var(--ivory)", color: "var(--ink-muted)",
        borderRadius: 5, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}><I.Moon size={14} /></button>
    </header>
  );
}

window.Sidebar = Sidebar;
window.TopBar = TopBar;
window.navItems = nav;
