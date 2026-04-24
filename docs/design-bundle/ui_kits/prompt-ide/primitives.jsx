/* Shared primitives used across screens */

function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 28 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>
        <h1 style={{ margin: 0, fontSize: 38, fontFamily: "var(--font-serif)", fontWeight: 600, letterSpacing: "-0.015em", color: "var(--ink)" }}>{title}</h1>
        {description && (
          <p style={{ margin: "10px 0 0", fontFamily: "var(--font-serif)", fontSize: 16, lineHeight: 1.6, color: "var(--ink-muted)", maxWidth: "62ch" }}>{description}</p>
        )}
      </div>
      {children && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{children}</div>}
    </div>
  );
}

const btn = {
  base: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
    padding: "0 14px", height: 34, borderRadius: 5, cursor: "pointer",
    border: "1px solid transparent", transition: "all 120ms ease",
  },
  primary: { background: "var(--verdigris)", color: "var(--ivory)", borderColor: "var(--verdigris-deep)" },
  ghost:   { background: "transparent", color: "var(--ink)", borderColor: "var(--rule-fine)" },
  solid:   { background: "var(--ink)", color: "var(--ivory)", borderColor: "var(--ink)" },
};

function Button({ variant = "primary", children, icon: I, iconRight: IR, ...p }) {
  const style = { ...btn.base, ...(btn[variant] || btn.primary), ...(p.style || {}) };
  return <button {...p} style={style}>{I && <I size={14}/>}{children}{IR && <IR size={14}/>}</button>;
}

function Card({ children, style = {}, padding = 24 }) {
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

function Eyebrow({ children }) {
  return <div className="eyebrow" style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", color: "var(--ink-muted)", fontVariantCaps: "all-small-caps", textTransform: "lowercase" }}>{children}</div>;
}

function StatusDot({ status }) {
  const map = {
    inbox:      { color: "var(--amber-rule)",   label: "Inbox" },
    production: { color: "var(--verdigris)",    label: "Production" },
    archived:   { color: "var(--ink-soft)",     label: "Archived" },
  };
  const s = map[status] || map.inbox;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-muted)" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

function Tag({ children }) {
  return <span style={{
    display: "inline-block", padding: "2px 8px",
    fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-muted)",
    background: "var(--paper-deep)", border: "1px solid var(--rule-fine)",
    borderRadius: 3, letterSpacing: "0.02em",
  }}>{children}</span>;
}

function Folio({ children }) {
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-soft)", letterSpacing: "0.06em" }}>{children}</span>;
}

Object.assign(window, { PageHeader, Button, Card, Eyebrow, StatusDot, Tag, Folio });
