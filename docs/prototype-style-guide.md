# Prototype Style Guide — Admin Surfaces

How this admin prototype applies the canonical Unity Design System
(docs/unity-design-system.md). Read BOTH files before building UI.

## Mode decision
Unity's "Light UI"/"Dark UI" modes are both dark-surface product themes.
This admin prototype is a LIGHT-SURFACE ADAPTATION: white cards on a light
page background, using Dark-UI-mode semantic values (navy foregrounds) and
the black-based (rgba(0,21,40,x)) opacity tokens. Do not "fix" this to a
dark theme.

## Tokens (frontend/src/theme/tokens.ts) — each maps to a Unity source
| Token | Value | Unity source |
|---|---|---|
| navy | #001528 | Blue/betika-950 |
| navyDeep | #001d3d | Blue/betika-900; Buttons/secondary-background (Dark UI) |
| yellow | #ffde24 | Yellow/betika-100; Buttons/primary-background |
| yellowActive | #ffea73 | Buttons/primary-background-active |
| white | #ffffff | Base/betika-white |
| offWhite | #fcfcfc | Grey/betika-50 (light mode) — page bg, hovers, panels |
| textPrimary | #001528 | Text/White (Dark UI) |
| textSecondary | rgba(0,21,40,0.7) | Opacity/70% (black-based) |
| border | rgba(0,21,40,0.1) | Opacity/10% (black-based) |
| ghostBorder | rgba(0,21,40,0.15) | Opacity/15% (black-based) |
| success | #007600 | Green/betika-600; Badges/success (Dark UI) |
| destructive | #ad0000 | Red/betika-600 |
| destructiveActive | #cc3225 | Red/betika-500 |
| red | #da0000 | (legacy — prefer destructive; do not use in new work) |
| blue | #213d8f | Betika Brand Blue |
| green | #1d880b | (legacy — prefer success; do not use in new work) |
| darkGrey | #272728 | ~Grey/betika-800 — neutral badges |
| draft | rgba(0,21,40,0.45) | Draft status colour (same resolved value as scrim) |
| scrim | rgba(0,21,40,0.45) | Opacity/50% (black-based, approx) |
| progressActive | #47AA39 | Border/Green + Badges/success (Light UI) — Progress foreground-active (stepper completed) |
| selectionBg | rgba(0,21,40,0.03) | Black-based 3% opacity — selected-card fill |
| activeFill | rgba(0,21,40,0.05) | Black-based 5% opacity — active list item fill |
| shadowRaise | 0 8px 20px rgba(0,21,40,0.08) | Hover raise shadow for selectable cards |
| radiusSm | 8px | Radius/Small |
| radiusMd | 14px | Radius/Medium |
| radiusPill | 999px | Radius/Extra Large |

## Typography (Inter — snap to the Unity scale, no 13px)
- Page title: 20px/600 (H5 Bold)
- Section heading: 15px/500 (B1)
- Body & table cells: 14px/400 (B2 Regular)
- Labels, table headers, secondary: 14px (Footnote) or 12px (Caption Bold)
 — pick per hierarchy; NEVER 13px in new work
- Captions/meta: 12px (Caption)
- Stat values: 20px/600

## Spacing
Use the Unity spacer scale only: 0,1,2,4,8,12,14,16,18,20,24,32,48,60,80,120.

## Component primitives (frontend/src/components/ui/)
Badge (pill, radiusPill — solid variant: colored fill + white text; ghost
variant via `ghost`: white fill + ghostBorder outline + colored text, used
for the "Pending approval" status; `textColor` overrides the foreground,
used for the yellow "content incomplete" warning badge with navy text),
StatChip, PrimaryButton (yellow bg + navy text,
pressed=yellowActive), SecondaryButton (navyDeep bg + white text),
GhostButton (ghostBorder), DestructiveGhostButton, FilterSelect,
Toggle (Unity Switch: navy track when on, ghostBorder track when off;
`disabled` renders a locked state, e.g. mandatory business rules),
Checkbox (Unity Checkbox: visually hidden native input + 18px custom box
with 4px radius; Unity success green selection state per Figma:
progressActive fill and border with a white 14px Check/Minus icon when
checked/indeterminate, white fill with ghostBorder outline when unchecked
(hover border progressActive), progressActive focus ring at 35% alpha;
optional `label` plus 12px `description`),
Checkbox group pattern (no primitive; compose Checkbox inline): a parent
Checkbox that is checked when every child is selected and `indeterminate`
when only some are, followed by the children on the same horizontal
wrapping flex row (gap 16), 14px labels; children may carry a leading 16px
lucide icon in textSecondary (gap 6 before the label), the parent has none.
Wrap in `role="group"` with `aria-label`; at-least-one validation and the
12px destructive error stay with the caller. Used for promotion Channels
(All channels; Web, Mobile web, App, USSD with the `CHANNEL_ICONS` Globe /
Smartphone / AppWindow / Hash icons); read-only channel summaries are
plain text via `channelSummary()`: "All channels" for a full set,
otherwise the labels joined by ", "),
FilterChip (Unity Chip, dismissible: ghost pill — white fill, ghostBorder
outline, radiusPill; 12px/500 "Label: value" with the label in
textSecondary; trailing 20px × button (lucide X 14px, activeFill hover,
`aria-label="Remove {label} filter: {value}"`). Rendered one per selected
facet value in a wrapping gap-8 row directly under the filter toolbar,
plus a 12px underlined "Clear all" text button when more than one is
active),
Filter panel pattern (no primitive; compose in the page): toolbar
GhostButton-styled "Filters" button with lucide Funnel 16px and a navy
count pill when filters are applied; opens a right-side drawer (same
scrim + panel shell as detail drawers, 400px) whose body is a gap-24
column of facets — 14px/600 facet title over a gap-8 column of Checkboxes,
Date range via DateRangePicker — and whose footer is GhostButton "Clear
all" left, GhostButton Cancel + PrimaryButton Apply right. Selections are
a draft until Apply; Esc / scrim / Cancel discard. Facets AND together,
values within a facet OR. Used for Promotions (Status, Type, Channel,
Vertical, Provider, Date range),
EvidenceCard, ComingSoon (teaser card for unreleased "TBC" nav routes:
white card radiusMd max-w 640, 20px/600 title + ghost navy "Coming soon"
Badge, 14px textSecondary description, 14px bullets with 16px lucide Check,
optional "Until then" notice = offWhite panel + Info icon + 12px text).
CoachMarks (step-by-step onboarding: scrim + spotlight ring + 360px white
card anchored to `[data-tour]` targets; 12px counter, 15px title, 14px body,
Skip / Back / Next-Done footer; optional `footer?: (ctx: { index, total,
isLast }) => ReactNode` slot rendered below the body and above the actions —
FirstRunTour uses it for the final-step 14px "Don't show again" checkbox; the
tour otherwise opens after every login).
DateRangePicker / DateTimeField / TimeField (Unity Date Picker; replaces
every native `type="date|time|datetime-local"` input). Trigger = ghost
field (ghostBorder, radiusSm, lucide Calendar 16px, 14px text: range
"Jan 11, 2026 - Feb 2, 2026", single "20 Aug 2026, 10:00"). Popover =
portal anchored below (white, 1px border, radiusMd, shadowRaise; Esc /
outside click close, focus trapped; z-index 35). Shared internal
CalendarGrid: Sunday-first, 32×32 day cells 14px radiusSm, today = 1px
ghostBorder ring, hover offWhite, selected = yellow fill + navy 600,
in-range = activeFill, out-of-month/disabled = textSecondary at 0.5;
arrow keys move (roving tabIndex), Enter selects. Range popover: preset
column (Today … This year, active = activeFill; collapses to a
FilterSelect and a single month below 1024px), two grids, footer with two
read-only offWhite date fields + GhostButton Cancel / PrimaryButton
Apply — selection is a draft until Apply. DateTimeField `showTime` adds a
24h hour / 5-minute FilterSelect row + 12px `timezoneLabel` (no AM/PM,
Africa/Lusaka). TimeField is the standalone hour:minute row. Value API is
`Date | null`; `toIsoDate/Time/DateTime` + `parseIsoDateTime` adapt to
consumers that persist the old input strings.
These correspond to Unity's Button (Default/Secondary/Ghost/
Destructive variants), Badge (Pill), Chips, Switch, Date Picker and Table
components. Never re-declare them inside page files.

## Internal Tool Shell (house style)

All internal tools follow this shell, modeled on the Admin Portal design:

- **GLOBAL TOP BAR:** white, 1px bottom border (`T.border`), full width.
  Left: product wordmark (navy 15px/700, accent word/dot in `T.yellow`) +
  market flag (20px, `radiusXs`, 1px border, `aria-label` = market name).
  Right: user avatar circle (initials) + role name 14px + chevron menu.
- **SIDEBAR:** white, 1px right border, ~240px. Search field at top (ghost
  input). Flat nav items grouped under UPPERCASE 12px/600 `textSecondary`
  group labels — no expandable modules, no chevrons in nav.
  Item states: default `textSecondary`; hover bg `T.offWhite`; active bg
  `rgba(0,21,40,0.05)` + `textPrimary` 600. No accent indicator bars.
  Unreleased items: reduced emphasis + "TBC" pill.
  The sidebar carries NO user identity block (no avatar/profile footer) —
  user identity lives exclusively in the global top bar.
- **CONTENT:** `T.offWhite` canvas; page title 20px/600 + 14px `textSecondary`
  subtitle; primary action as yellow `PrimaryButton` top-right.
- **TABLES:** white card, two-line cells (14px/600 title + 12px secondary),
  pill status badges (solid green=live/active, solid navy=scheduled,
  ghost grey=draft/expired), Actions column with icon buttons (edit/
  delete via `lucide-react`), pagination footer ("‹ Previous · page x of
  N · Next ›", current page in a bordered box).
- Destructive actions always go through confirm-before-commit.
- Stat-chip quick-filter rows are a sanctioned enhancement for queue-like
  lists (not in the base Figma — flag in design reviews).

Any new internal tool screen must use this shell unless explicitly exempted.

## Page skeleton (list/queue screens)
Top bar (white, border-bottom; title + context Badge left, primary action
right) → content max-w-[1280px] centered (Unity _Container is 1280) →
StatChip filter row → filter bar card (search + FilterSelects, or search +
Filters button with FilterChip row beneath when there are many facets) → table
card (rows hover offWhite, whole row clickable + explicit small GhostButton)
→ empty state. Detail views: right-side drawer sm:w-[520px], scrim overlay,
header → 2-col summary grid → tabs → scrollable body.

## Interaction rules
- Confirm-before-commit for any state-changing action (maker-checker).
- Budget indicators alert at >=90% (destructive) but NEVER block.
- Feature flags live in frontend/src/config/features.ts. Budget surfaces
  (BR-6) are gated on `features.budgets` — hidden for the current
  presentation, code retained; flip the flag to restore. The wizard
  Content step (CMS: tile copy, banners, T&Cs) and its Review summary
  are gated the same way on `features.content`; saved content data on
  existing drafts is preserved while hidden.
- Notices: offWhite panel + icon + Footnote text; success on
 rgba(0,118,0,0.08).
- Icons: lucide-react only, 12–20px.

## Domain conventions
Currency K 1,250.00 (ZMW); MSISDNs masked 26097••••214. Status colors:
Active=success, Scheduled=blue, Expired=darkGrey,
Draft=rgba(0,21,40,0.45), Critical=destructive.
Experiments (Promotions → Experiments, demo flag `features.experiments`):
Running=success, Completed=darkGrey, Draft=draft ghost pill. Results show
counts and rates only — never award values or currency. A promotion that is
an arm of a Running experiment carries a read-only navy ghost
`In experiment EXP-00X` tag in the promotions list.
