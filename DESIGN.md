# KREEDA UI Design

The UI as built, including the statistics dashboard. Use this to rebuild the same look in another project. Where this differs from the Google Stitch mockups, this file is correct. The mockups have invented data and some features the app doesn't have.

**Look:** light, calm and data-heavy. A deep green brand on white cards, thin borders, small shadows, one font. Built for desktop dashboards and booking or admin tools.

**Stack:** Next.js 16, React 19, Tailwind CSS v4, Recharts 3, Plus Jakarta Sans, Material Symbols Outlined. Recharts 2 drew only the axes under React 19, so use version 3.

| Source file | Holds |
|---|---|
| `app/globals.css` | Colour tokens, icon and pattern classes |
| `components/ui.js` | Card, Stat, Badge, Progress, buttons, inputs |
| `components/Sidebar.js` | Sidebar |
| `components/Charts.js` | Bars, Trend, Donut, WeekBars |
| `components/ActionForm.js` | Form with pending and result states |
| `app/admin/page.js` | Statistics dashboard |
| `app/(member)/book/page.js` | Slot grid and two-column page |
| `app/login/page.js` | Login page |

## Colours

Copy this into `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-jakarta), ui-sans-serif, system-ui, sans-serif;

  --color-primary: #005532;
  --color-on-primary: #ffffff;
  --color-primary-container: #136f45;
  --color-on-primary-container: #9aefba;
  --color-primary-fixed: #a0f5bf;
  --color-primary-fixed-dim: #84d8a5;
  --color-secondary: #2d6a48;
  --color-secondary-container: #b0f1c7;
  --color-on-secondary-container: #33704e;
  --color-on-secondary-fixed: #002111;
  --color-on-secondary-fixed-variant: #0f5132;
  --color-tertiary-fixed: #ffddb8;
  --color-on-tertiary-fixed: #2a1700;
  --color-court: #f6f8f6;
  --color-surface: #f9f9ff;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #f0f3ff;
  --color-surface-container: #e7eeff;
  --color-surface-container-high: #dee8ff;
  --color-on-surface: #111c2d;
  --color-on-surface-variant: #3f4941;
  --color-outline: #6f7a71;
  --color-outline-variant: #bec9bf;
  --color-error: #ba1a1a;
  --color-error-container: #ffdad6;
  --color-on-error-container: #93000a;
}

body {
  background: var(--color-court);
  color: var(--color-on-surface);
}

.material-symbols-outlined {
  font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
  display: inline-block;
  vertical-align: middle;
  line-height: 1;
  font-size: 20px;
}

.filled {
  font-variation-settings: "FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24;
}

.stripes {
  background: repeating-linear-gradient(45deg, #fef3c7, #fef3c7 6px, #fde68a 6px, #fde68a 12px);
}

.scroll-thin::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}

.scroll-thin::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
```

### What each colour means

| Meaning | Colours | Used for |
|---|---|---|
| Brand, good, selected | `primary`, `secondary-container` | Main buttons, active nav, positive badges, bars |
| Warning, waiting | Tailwind `amber` | No-shows, waiting lists, mid-level alerts |
| Error, destructive | `error`, `error-container` | Cancel, overdue, full, log out |
| Information | Tailwind `sky` | Neutral stat icons |
| Neutral, unavailable | Tailwind `slate` | Booked slots, default badges, progress track |
| Pages and cards | `court` for the page, `surface-container-lowest` for cards | Backgrounds |
| Text | `on-surface`, then `on-surface-variant`, then `outline` | Main, secondary, helper |

### Changing the brand colour

Change the tokens, then these values, which are hardcoded:

- `components/Charts.js`: all chart colours
- `app/admin/page.js`: heatmap cells, `rgba(0, 85, 50, …)`
- `app/admin/courts/page.js` and `app/admin/events/page.js`: checkboxes, `accent-[#005532]`

## Typography

Plus Jakarta Sans for everything, loaded with `next/font/google` as `--font-jakarta`. Material Symbols loads from a Google Fonts `<link>` in the root layout.

| Element | Classes |
|---|---|
| Page title | `text-3xl font-bold tracking-tight text-primary` |
| Page subtitle | `mt-1 text-sm text-on-surface-variant` |
| Card title | `text-lg font-semibold text-on-surface` |
| Stat label | `text-sm font-medium text-on-surface-variant` |
| Stat number | `text-3xl font-extrabold tracking-tight text-on-surface` |
| Table header | `text-xs uppercase tracking-wide text-outline` |
| Table body | `text-sm`, with `font-semibold` on the first column |
| Helper text | `text-xs text-outline` |
| Sidebar wordmark | `text-2xl font-extrabold tracking-tight text-primary` |
| Login headline | `text-5xl font-extrabold leading-tight tracking-tight` |

## Shape and spacing

| Element | Radius |
|---|---|
| Login card | `rounded-3xl` |
| Cards, stat cards | `rounded-2xl` |
| Panels inside cards, day picker, icon tiles | `rounded-xl` |
| Inputs, small buttons, slot pills, nav items | `rounded-lg` |
| Heatmap cells | `rounded-md` |
| Primary buttons, badges, filter chips | `rounded-full` |

- **Borders:** `border border-outline-variant/70` on cards. Depth comes from these more than from shadows.
- **Shadows:** `shadow-sm` only. There are no large shadows.
- **Padding:** `p-6` on cards, `p-5` on stat cards, `p-3` or `p-4` on inner panels.
- **Gaps:** `space-y-6` between page sections, `gap-6` between cards, `gap-4` between stat cards.

## Page layout

```jsx
<div className="min-h-screen bg-court">
  <Sidebar items={items} user={user} roleLabel="Admin" />
  <main className="ml-72 min-h-screen px-8 py-8">{children}</main>
</div>
```

- **Sidebar:** fixed, `w-72`, white with a right border. Logo tile, wordmark and optional role badge at the top, then nav. The user card and a red log out button sit at the bottom.
- **Active nav item:** `border-l-4 border-primary bg-secondary-container`, with a filled icon.
- **Inactive nav item:** `text-on-surface-variant`, with `hover:bg-surface-container-low`.
- **Page header:** title and subtitle on the left, one status badge or action on the right.
- **Two-column pages:** `flex gap-6`, with the main column `min-w-0 flex-1` and the side panel `w-80 shrink-0 space-y-6`.

## Components

All of these are in `components/ui.js`.

| Component | Notes |
|---|---|
| `Card` | Optional title, icon and a right-side `action` slot |
| `Stat` | Label, big number, helper line, icon tile. Tones: `green`, `amber`, `red`, `blue` |
| `Badge` | `rounded-full px-2.5 py-0.5 text-xs font-semibold`. Tones: `green`, `grey`, `amber`, `red`, `blue`, `dark` |
| `Progress` | `h-2 rounded-full bg-slate-100`. Tones: `primary`, `amber`, `red` |
| `Empty` | Dashed box with centred text |
| `Field` | Label, input, optional hint |
| `Icon` | `<Icon name="key" filled />`, using Material Symbols names |

**Buttons and inputs:**

```js
buttonClass = "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-on-secondary-fixed-variant active:scale-[0.98] disabled:opacity-60"

ghostButtonClass = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-50"

dangerButtonClass = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-error transition hover:bg-error-container/50 disabled:opacity-50"

inputClass = "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
```

**Live status badge:** a green `Badge` containing `<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />`.

**Forms:** `ActionForm` disables its fields while saving and shows a green or red message under the form. Use `compact` for short inline text inside cards and tables.

**Tables:** header row `border-b border-outline-variant`, body rows `border-b border-outline-variant/50 last:border-0`, numbers right-aligned. Main values are `font-bold text-primary`.

## Statistics dashboard

Source: `app/admin/page.js`. It reads top to bottom, from summary to detail:

| Row | Grid | Contents |
|---|---|---|
| 1 | Page header | Title, subtitle, live data badge |
| 2 | `grid-cols-4 gap-4` | 4 `Stat` cards, each with a different icon tone |
| 3 | `grid-cols-3 gap-6` | Trend chart (`col-span-2`), Donut |
| 4 | `grid-cols-2 gap-6` | Bars with a table under it; list of labelled progress bars |
| 5 | `grid-cols-3 gap-6` | Heatmap (`col-span-2`), Bars at `height={220}` |
| 6 | `grid-cols-3 gap-6` | Ranked table with badges; progress list; alert rows |
| 7 | Full width | Detail table with a `Progress` bar inside a column |

Each chart sits in a `Card` with an icon, a title and a small tag on the right showing its time range or data source.

### Charts

Source: `components/Charts.js`. Chart components need `"use client"`.

**Shared settings:**

```js
const GREENS = ["#005532", "#136f45", "#2d6a48", "#4f9a6f", "#84d8a5", "#b0f1c7"];
const axis = { fontSize: 12, fill: "#6f7a71" };
const tip = { contentStyle: { borderRadius: 12, border: "1px solid #bec9bf", fontSize: 12 } };
```

Axes use `axisLine={false}` and `tickLine={false}`. Grid lines are horizontal only, `stroke="#e7eeff"`. A negative left margin pulls the Y axis in so charts line up with the card title.

| Chart | Default height | Specification |
|---|---|---|
| `Bars` | 240 | Top corners `[8, 8, 0, 0]`. Value labels on top, 11px, bold, `#005532`. The first 3 bars use `GREENS` and the rest are `#bec9bf`, so sort the data with the leaders first |
| `Trend` | 260 | Monotone areas, 2px strokes, circle legend. Main series: stroke `#005532`, fill fading from `#136f45` at 0.45 to 0.02. Warning series: stroke `#d97706`, fill `#fde68a` at 0.4. Bad series: stroke `#ba1a1a`, fill `#ffdad6` at 0.4 |
| `Donut` | 220 | Inner radius 62%, outer 90%, `paddingAngle={2}`, no stroke. Total in the centre (`text-2xl font-extrabold`) with a small caption. Legend under the chart, showing name and value. Colours: done `#005532`, upcoming `#84d8a5`, warning `#f59e0b`, bad `#ba1a1a` |
| `WeekBars` | 140 | Stacked bars. Main `#136f45`, warning `#f59e0b`, top corners `[6, 6, 0, 0]` |

### Heatmap

A plain HTML table with `className="border-separate border-spacing-1"`, not a chart library. Each cell:

```jsx
<td title={`${day} ${hour}:00 · ${value} bookings`}>
  <div
    className="h-8 w-10 rounded-md"
    style={{ background: `rgba(0, 85, 50, ${0.06 + 0.94 * (value / max)})` }}
  />
</td>
```

Hour labels go on top, day labels on the left, and one sentence above the grid states the busiest cell.

### Progress list

```jsx
<div className="mb-1.5 flex justify-between text-sm">
  <span className="font-semibold">Name <span className="font-normal text-outline">· Type</span></span>
  <span className="font-bold text-primary">42%</span>
</div>
<Progress value={42} />
<p className="mt-1 text-xs text-outline">176 of 420 slots used</p>
```

### Thresholds

Colour shows status only when a value crosses a limit:

| Value | Rule |
|---|---|
| No-show badge | Red at 30% or more, otherwise amber |
| Day load dot | Red above 60%, amber above 35%, otherwise green |
| Event fill bar | Red at 100%, otherwise green |
| Overdue count | Red badge above 0, otherwise a plain `0` |

## Slot grid

Source: `app/(member)/book/page.js`. Works for anything booked by time slot. Rows are resources, columns are hours, and the first column is sticky. Each pill is `h-10 rounded-lg text-[11px] font-semibold`, and every state has a text label, so colour is never the only signal.

| State | Classes | Label |
|---|---|---|
| Open | `border border-primary/70 bg-white text-primary hover:bg-secondary-container` | Open |
| Yours | `bg-primary text-on-primary border border-primary` | Yours |
| Waiting | `bg-amber-100 text-amber-800 border border-amber-300` | #position |
| Taken | `bg-slate-100 text-slate-500 border border-slate-200 hover:border-slate-400` | Booked, or +n wait |
| Blocked | `stripes text-amber-900 border border-amber-300` | Event |
| Past | `bg-slate-50 text-slate-300 border border-slate-100` | — or Played |
| Selected | Add `ring-2 ring-offset-2 ring-primary` | |

Above the grid are a 7-day picker (`grid-cols-7 gap-3`, active day solid `primary`, with a small coloured load dot), rounded filter chips and a colour legend.

## Login page

Two equal columns, `lg:grid-cols-2`. The left column is hidden below `lg`.

- **Left:** solid `bg-primary`, with a line grid at 20% opacity (`backgroundSize: "120px 80px"`), one blurred `primary-container` circle in the corner, a large headline and 3 translucent stat cards (`border-white/20 bg-white/10 backdrop-blur`).
- **Right:** `bg-surface`, with a centred `max-w-md rounded-3xl p-10` card and a full-width primary button.

## Writing style

Short and plain. Say what will happen: "Click an open slot to book, or a booked one to join its waiting list". Helper lines give context for a number, like "176 of 420 slots used".

## Known limits

- **Desktop only:** only the login page adapts to screen size. The sidebar, `ml-72` and the fixed grids need a mobile layout before use on phones.
- **No dark mode:** chart colours and Tailwind palette colours would also need dark versions.
- **No modals:** the app uses side panels and inline messages instead.

## Specific to KREEDA

Replace these in another project:

- Name, logo icon and "PES University Sports Complex"
- Nav items and sports icons
- The SQL view name tags on dashboard cards, which were there to show the database work in the project demo
- The demo login box on the login page
