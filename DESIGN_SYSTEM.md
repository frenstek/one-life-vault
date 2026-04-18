# One Life Vault — Design System & Spacing Guide

## Spacing Philosophy

Every element needs breathing room. When in doubt, add more space, not less.
White space is not wasted space — it creates hierarchy, reduces cognitive load, and makes the UI feel professional.

---

## Spacing Scale (Tailwind)

Use only these values for consistency:

| Token | Tailwind | Pixels | Usage |
|-------|----------|--------|-------|
| `xs`  | `1`      | 4px    | Never for padding. Only for hairline gaps (icon + text inline). |
| `sm`  | `2`      | 8px    | Minimum gap between related inline items (badge padding, icon gaps). |
| `md`  | `3`      | 12px   | Minimum padding for compact interactive elements (small buttons, tags). |
| `lg`  | `4`      | 16px   | Minimum padding for any container with content. Grid gaps for tight grids. |
| `xl`  | `5`      | 20px   | Standard card padding, standard grid gaps. |
| `2xl` | `6`      | 24px   | Comfortable card padding, standard section gaps, form field gaps. |
| `3xl` | `8`      | 32px   | Section padding, modal body padding, generous card padding. |
| `4xl` | `10`     | 40px   | Modal side padding, page-level horizontal padding. |
| `5xl` | `12`     | 48px   | Page section vertical spacing (`space-y-12`). |

---

## Critical CSS Rule

**NEVER add `* { padding: 0; }` or `* { margin: 0; }` to `index.css`.**

In Tailwind CSS 4, unlayered CSS has higher specificity than `@layer utilities`. A global `* { padding: 0 }` will silently override every Tailwind padding class (`p-6`, `px-10`, etc.) — the classes appear in the HTML but produce zero visual effect. Tailwind's own preflight handles all resets. Do not duplicate them.

---

## Hard Rules

### Minimum Padding Rules
- **Cards / Containers**: Minimum `p-6` (24px). Prefer `p-8` (32px) for primary content cards.
- **Buttons**: Minimum `px-4 py-2.5` (16px/10px). Small buttons: `px-3 py-2` (12px/8px).
- **Form inputs**: `py-3 px-4` (12px/16px) — enforced globally in `index.css`.
- **Table cells**: Minimum `px-5 py-4` (20px/16px).
- **Modal header/footer**: `px-10 py-6` (40px/24px).
- **Modal body**: `px-10 py-8` (40px/32px).
- **List items (clickable rows)**: Minimum `px-6 py-5` (24px/20px).

### Minimum Gap Rules
- **Grid gaps**: Minimum `gap-5` (20px) between cards. Use `gap-6` (24px) for form fields.
- **Section spacing**: Minimum `space-y-8` (32px) between page sections. Dashboard uses `space-y-12`.
- **Label to input**: `mb-2.5` (10px) between label and its input field.
- **Section header to content**: `mb-6` (24px) between a heading and its content block.
- **Sidebar nav items**: `space-y-1` (4px) minimum between items, `py-2.5` (10px) for each item.

### Never Do
- Never use `p-2` or smaller on a content container.
- Never use `gap-2` or smaller between cards.
- Never use `py-1` on clickable items (too small a hit target).
- Never use `mb-1` between a section header and its content.
- Never let content touch the border of its container — always have at least `p-4`.
- Never use `space-y-0.5` — minimum is `space-y-1`.

---

## Component Spacing Reference

### Layout Shell
```
Main content area: p-6 lg:p-10
Header height: h-16, px-6 lg:px-8
Sidebar width: w-[260px], nav px-3 py-3
```

### Page Structure
```
Page wrapper:          space-y-8 (standard) or space-y-12 (dashboard)
Page title to content: mb-6
Section title to grid: mb-6
Two-column layout gap: gap-10
```

### Cards
```
Stat cards:     px-7 py-7, icon size h-14 w-14, gap-5 between icon and text
Content cards:  p-6 minimum, p-8 preferred for primary cards
Quick action:   p-6, icon h-12 w-12, gap-4
Staff/Property: p-6 minimum
Document cards: p-6 (grid), px-5 py-4 (list)
```

### Modals
```
Header:   px-10 py-6, border-b
Body:     px-10 py-8
Footer:   px-10 py-6, border-t
Form gap: gap-6 (grid) or space-y-6 (stack)
Label:    mb-2.5 before input
```

### Tables
```
Header cells:   px-5 py-4, text-xs uppercase tracking-wider
Body cells:     px-5 py-4
Row borders:    border-b border-slate-100 dark:border-slate-700
```

### Sidebar Navigation
```
Nav items:      px-3 py-2.5, space-y-1
Subcategories:  py-2 pl-11 pr-3, space-y-1
Section labels: px-3 pb-2 pt-5, text-[10px] uppercase
```

### Buttons
```
Primary:  px-5 py-2.5, text-sm font-semibold
Small:    px-3 py-2, text-sm
Compact:  px-3 py-1.5, text-xs (filter pills only)
Icon-only: p-2.5
```

---

## Color Tokens (for reference)

| Purpose       | Light                | Dark                  |
|---------------|---------------------|-----------------------|
| Background    | `#f8f9fb`           | `#0c1425`            |
| Card bg       | `bg-white`          | `bg-[#162036]`       |
| Card border   | `border-slate-200`  | `border-[#263554]`   |
| Hover bg      | `bg-slate-50`       | `bg-[#1e2d4a]`      |
| Primary       | `brand-500 #309edd` | Same                 |
| Accent        | `accent-500 #0ea03e`| Same                 |
| Highlight     | `highlight-400 #ffd900` | Same             |
| Sidebar       | `#0a2614`           | Same                 |

---

## Checklist for New Components

Before shipping any new component or page, verify:

- [ ] No container has padding less than `p-4` (16px)
- [ ] No clickable element has vertical padding less than `py-2` (8px)
- [ ] Cards use at least `p-6`, preferably `p-8` for primary content
- [ ] Grid gaps are at least `gap-5` between cards
- [ ] Form field gaps are at least `gap-6` or `space-y-6`
- [ ] Labels have `mb-2.5` spacing from their inputs
- [ ] Section headers have `mb-6` spacing from their content
- [ ] Page sections use `space-y-8` minimum
- [ ] Tables use `px-5 py-4` cell padding
- [ ] Modal follows `px-10 py-8` body, `px-10 py-6` header/footer
- [ ] Dark mode border/bg tokens are applied consistently
