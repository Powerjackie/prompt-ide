# Lab Notebook — 3 Motion Additions (post-bundle)

The shipped Lab Notebook bundle is intentionally near-static (only `transition: all 120ms ease` on primitives + link color shift). For the prompt-ide migration, three motion additions should be implemented during P1/P2 to retain "page-turn" feel without breaking the calm aesthetic.

## 1. Page transition — paper fade + 1px y shift

When switching routes, simulate a manuscript page being placed down.

```css
/* globals.css — add to :root */
:root {
  --motion-page-dur: 200ms;
  --motion-page-ease: cubic-bezier(0.2, 0.6, 0.2, 1);
}

/* In layout.tsx or app shell — use next-themes pattern or CSS view transitions */
@keyframes lab-page-in {
  from { opacity: 0; transform: translateY(1px); }
  to   { opacity: 1; transform: translateY(0); }
}

main[data-route] {
  animation: lab-page-in var(--motion-page-dur) var(--motion-page-ease);
}
```

Or use Next.js View Transitions API for cleaner cross-fade.

## 2. Card promote — hover elevation

When hovering a Card primitive, raise paper 1-2px and deepen shadow from `--shadow-sm` to `--shadow-hover` (already defined in tokens.css).

```jsx
// shell/primitives.jsx Card — adjust transition
<div style={{
  transition: "transform 160ms ease, box-shadow 160ms ease",
}} 
className="lab-card"
>
```

```css
/* globals.css */
.lab-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-hover);
}
```

Apply only to `<Card>` instances that are interactive (linked / clickable). Static info cards keep no hover.

## 3. Verdigris ripple — primary button press

When a primary button is pressed (mousedown), emit one verdigris-tinted ring outward 300ms then fade. Single shot per click, NOT looping.

```css
/* globals.css */
@keyframes lab-ripple {
  0%   { box-shadow: 0 0 0 0 color-mix(in oklch, var(--verdigris) 35%, transparent); }
  100% { box-shadow: 0 0 0 14px color-mix(in oklch, var(--verdigris) 0%, transparent); }
}

button[data-variant="primary"]:active {
  animation: lab-ripple 300ms ease-out;
}
```

Only apply to `data-variant="primary"` (verdigris button), not ghost/secondary.

## Why these three (not more)

- **Page transition** restores the "page metaphor" the brief asked for without route-local choreography
- **Card promote** confirms interactivity (Lab Notebook's flat aesthetic risks losing affordance signals)
- **Verdigris ripple** is the only "decorative" motion — replaces brutalist's `translate(2px,2px)` press feedback with something quieter but distinctive

All three respect:
- `prefers-reduced-motion: reduce` — wrap in media query, fallback to no animation
- No GSAP dependency
- No JS-driven animation
- No reduced-motion `gs-*` double-query system needed
- 200-300ms range — visible but not lingering

## What we're NOT adding back

- ❌ GSAP timeline / SplitText / ScrollTrigger
- ❌ Hero choreography (replaced by static + serif gravity)
- ❌ Playground theater stage→console sequencing
- ❌ Cursor magnet
- ❌ Global marquee
- ❌ Reduced-motion `gs-*` visibility-toggle scaffolding (unnecessary — base state shows everything)

## Implementation phase

Add these in **P1** alongside `colors_and_type.css` token drop-in. They're trivial CSS adds, no JS.
