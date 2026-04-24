/* Shared shell primitives — TopBar (h-12) + Sidebar (w-24 / w-12 collapsed) */

function Shell({ active, onNav, collapsed, onToggleCollapsed, title, eyebrow, dark, onToggleDark, children, hideSearch, rightExtras }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: (collapsed ? 48 : 96) + "px 1fr",
      gridTemplateRows: "48px 1fr",
      height: "100%",
      background: "var(--paper)",
      color: "var(--ink)",
    }}>
      {/* Sidebar spans both rows */}
      <aside style={{
        gridRow: "1 / span 2",
        borderRight: "1px solid var(--rule-fine)",
        background: "var(--ivory)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Monogram */}
        <div style={{
          height: 48, display: "flex", alignItems: "center", justifyContent: "center",
          borderBottom: "1px solid var(--rule-fine)", flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, background: "var(--ivory)",
            border: "1.5px solid var(--ink)", borderRadius: 4,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-serif)", fontWeight: 600, fontStyle: "italic",
            fontSize: 18, color: "var(--verdigris-deep)", lineHeight: 1,
          }}>p</div>
        </div>

        <nav style={{ flex: 1, padding: collapsed ? "10px 6px" : "10px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { id: "home", label: "Home", icon: I.Home },
            { id: "playground", label: "Playground", icon: I.Flask },
            { id: "prompts", label: "Prompts", icon: I.File },
            { id: "editor", label: "Editor", icon: I.Pen },
            { id: "modules", label: "Modules", icon: I.Puzzle },
            { id: "docs", label: "Docs", icon: I.Book },
            { id: "admin", label: "Admin", icon: I.Settings },
          ].map((item) => {
            const Icn = item.icon;
            const isActive = active === item.id;
            return (
              <button key={item.id} onClick={() => onNav && onNav(item.id)} title={item.label}
                style={{
                  position: "relative",
                  height: collapsed ? 36 : 56,
                  width: "100%", border: "none",
                  background: isActive ? "var(--verdigris-wash)" : "transparent",
                  color: isActive ? "var(--verdigris-deep)" : "var(--ink-muted)",
                  borderRadius: 4, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 3, padding: collapsed ? 0 : "6px 0",
                  fontFamily: "var(--font-sans)", fontSize: 10,
                }}
              >
                {isActive && (
                  <span style={{
                    position: "absolute", left: 0, top: 6, bottom: 6,
                    width: 2, background: "var(--verdigris)", borderRadius: 1,
                  }}/>
                )}
                <Icn size={collapsed ? 16 : 17}/>
                {!collapsed && <span style={{ fontSize: 10.5, letterSpacing: "0.01em" }}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: collapsed ? "8px 6px 10px" : "8px 12px 12px", borderTop: "1px solid var(--rule-fine)", display: "flex", flexDirection: "column", gap: 6 }}>
          <button title="New prompt" onClick={() => onNav && onNav("editor")} style={{
            width: "100%", height: collapsed ? 32 : 38, padding: 0,
            border: "1px solid var(--ink)", background: "var(--ink)", color: "var(--ivory)",
            borderRadius: 4, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500,
          }}>
            <I.Plus size={13}/>{!collapsed && <span>new</span>}
          </button>
          <button onClick={onToggleCollapsed} title={collapsed ? "Expand" : "Collapse"} style={{
            width: "100%", height: 28, padding: 0, background: "transparent",
            color: "var(--ink-soft)", border: "none", borderRadius: 4, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><I.PanelLeft size={13}/></button>
        </div>
      </aside>

      {/* TopBar */}
      <header style={{
        height: 48, background: "var(--paper)",
        borderBottom: "1px solid var(--rule-fine)",
        display: "flex", alignItems: "center", gap: 14,
        padding: "0 20px",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0, flexShrink: 0 }}>
          <span className="folio" style={{ color: "var(--ink-soft)", whiteSpace: "nowrap" }}>§ {eyebrow || "workbench"}</span>
          <span style={{ color: "var(--ink-soft)", fontSize: 11 }}>/</span>
          <span style={{
            fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--ink)",
            fontWeight: 600, letterSpacing: "-0.005em", whiteSpace: "nowrap",
          }}>{title}</span>
        </div>

        {!hideSearch && (
          <div style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
            background: "var(--ivory)", border: "1px solid var(--rule-fine)",
            borderRadius: 4, padding: "4px 8px", width: 260, height: 28,
          }}>
            <I.Search size={12} style={{ color: "var(--ink-soft)" }}/>
            <input placeholder="Search prompts, modules, pages…" style={{
              border: "none", background: "transparent", outline: "none", flex: 1,
              fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink)",
            }}/>
            <kbd style={{
              fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink-soft)",
              border: "1px solid var(--rule-fine)", borderBottomWidth: 2, borderRadius: 2,
              padding: "0 4px", background: "var(--paper)",
            }}>⌘K</kbd>
          </div>
        )}

        <div style={{ marginLeft: hideSearch ? "auto" : 0, display: "flex", alignItems: "center", gap: 6 }}>
          {rightExtras}
          <button onClick={onToggleDark} title="Toggle theme" style={{
            width: 28, height: 28, border: "1px solid var(--rule-fine)",
            background: "var(--ivory)", color: "var(--ink-muted)",
            borderRadius: 4, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{dark ? <I.Sun size={13}/> : <I.Moon size={13}/>}</button>
        </div>
      </header>

      {/* Main content — bounded scroll */}
      <main style={{
        height: "100%", overflowY: "auto", overflowX: "hidden",
        background: "var(--paper)",
      }}>
        {children}
      </main>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, children, compact }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginBottom: compact ? 18 : 26, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 5 }}>{eyebrow}</div>}
        <h1 style={{
          margin: 0, fontSize: compact ? 28 : 34,
          fontFamily: "var(--font-serif)", fontWeight: 600,
          letterSpacing: "-0.015em", color: "var(--ink)", lineHeight: 1.15,
        }}>{title}</h1>
        {description && (
          <p style={{
            margin: "8px 0 0", fontFamily: "var(--font-serif)",
            fontSize: 15, lineHeight: 1.6, color: "var(--ink-muted)", maxWidth: "62ch",
          }}>{description}</p>
        )}
      </div>
      {children && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{children}</div>}
    </div>
  );
}

const btnBase = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
  fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 500,
  padding: "0 12px", height: 30, borderRadius: 4, cursor: "pointer",
  border: "1px solid transparent", transition: "all 120ms ease",
};
const btnVariants = {
  primary: { background: "var(--verdigris)", color: "var(--ivory)", borderColor: "var(--verdigris-deep)" },
  ghost:   { background: "transparent", color: "var(--ink)", borderColor: "var(--rule-fine)" },
  solid:   { background: "var(--ink)", color: "var(--ivory)", borderColor: "var(--ink)" },
  danger:  { background: "transparent", color: "var(--vermillion)", borderColor: "var(--rule-fine)" },
};
function Button({ variant = "primary", children, icon, iconRight, style, onClick, title }) {
  const s = { ...btnBase, ...(btnVariants[variant] || btnVariants.primary), ...(style || {}) };
  const Ic = icon, IR = iconRight;
  return (
    <button onClick={onClick} title={title} style={s}>
      {Ic && <Ic size={13}/>}
      {children}
      {IR && <IR size={13}/>}
    </button>
  );
}

function Card({ children, style = {}, padding = 22 }) {
  return (
    <div style={{
      background: "var(--ivory)",
      border: "1px solid var(--rule-fine)",
      borderRadius: 5,
      boxShadow: "var(--shadow-page)",
      padding,
      ...style,
    }}>{children}</div>
  );
}

function Eyebrow({ children, style }) {
  return <div className="eyebrow" style={{
    fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500,
    letterSpacing: "0.08em", color: "var(--ink-muted)",
    fontVariantCaps: "all-small-caps", textTransform: "lowercase",
    ...style,
  }}>{children}</div>;
}

function StatusDot({ status, small }) {
  const map = {
    inbox:      { color: "var(--amber-rule)",   label: "Inbox" },
    production: { color: "var(--verdigris)",    label: "Production" },
    archived:   { color: "var(--ink-soft)",     label: "Archived" },
    draft:      { color: "var(--ink-muted)",    label: "Draft" },
    active:     { color: "var(--verdigris)",    label: "Active" },
  };
  const st = map[status] || map.inbox;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontFamily: "var(--font-sans)", fontSize: small ? 11 : 12, color: "var(--ink-muted)",
    }}>
      <span style={{ width: small ? 6 : 7, height: small ? 6 : 7, borderRadius: "50%", background: st.color, display: "inline-block" }}/>
      {st.label}
    </span>
  );
}

function Tag({ children, style }) {
  return <span style={{
    display: "inline-block", padding: "2px 7px",
    fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-muted)",
    background: "var(--paper-deep)", border: "1px solid var(--rule-fine)",
    borderRadius: 3, letterSpacing: "0.02em", ...style,
  }}>{children}</span>;
}

function Chip({ active, onClick, children, icon }) {
  const Ic = icon;
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", height: 24, borderRadius: 3,
      fontFamily: "var(--font-sans)", fontSize: 11.5,
      cursor: "pointer",
      background: active ? "var(--verdigris-wash)" : "transparent",
      color: active ? "var(--verdigris-deep)" : "var(--ink-muted)",
      border: "1px solid " + (active ? "var(--verdigris)" : "var(--rule-fine)"),
    }}>
      {Ic && <Ic size={11}/>}
      {children}
    </button>
  );
}

function Folio({ children, style }) {
  return <span style={{
    fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-soft)",
    letterSpacing: "0.06em", ...style,
  }}>{children}</span>;
}

function Kbd({ children }) {
  return <kbd style={{
    display: "inline-block", padding: "1px 5px",
    fontFamily: "var(--font-mono)", fontSize: 10,
    background: "var(--ivory)", color: "var(--ink-muted)",
    border: "1px solid var(--rule-fine)", borderBottomWidth: 2, borderRadius: 3,
  }}>{children}</kbd>;
}

const iconBtn = {
  width: 26, height: 26, border: "1px solid var(--rule-fine)", background: "var(--ivory)",
  color: "var(--ink-muted)", borderRadius: 3, cursor: "pointer",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
};

Object.assign(window, {
  Shell, PageHeader, Button, Card, Eyebrow, StatusDot, Tag, Chip, Folio, Kbd, iconBtn,
});
