# Shared Component Library Mapping

**Phase:** 1 — inventory and mapping only. No code, style, component, or markup changes.
**Audit date:** November 8, 2026
**Library source:** [`https://platform-frontend-components.vercel.app/`](https://platform-frontend-components.vercel.app/) — Storybook index crawled from `/index.json` (schema `v5`, 49 story titles). `/stories.json` returns HTTP 404 and is not available on this deployment.
**Prototype source audited:** `frontend/src/**` (88 `.tsx` files), [`frontend/src/app/design-system.css`](../frontend/src/app/design-system.css), [`frontend/src/app/globals.css`](../frontend/src/app/globals.css)
**Related record:** [`docs/design-system-traceability-matrix.md`](./design-system-traceability-matrix.md)

## 1. Audit basis and boundary

This document maps the prototype's hand-rolled UI primitives against the shared component library so production adoption reuses existing components rather than rebuilding them. It is a mapping record only: no prototype component or style was modified in producing it, and it does not authorize adoption work.

Library APIs were read from deployed Storybook chunks (`button-DDuS6zHI.js`, `card-HyJnYqoa.js`, `badge.stories-np_KZF5A.js`, `chip.stories-D2sLcOsf.js`, `table.stories-onYn8vOc.js`, `form-stepper.stories-sE_JPFbv.js`, `switch.stories-BLprq6yc.js`, `separator.stories-D7PnbnDg.js`, `skeleton.stories-CjvTTsI_.js`) rather than inferred from story names.

### Status vocabulary

| Confidence | Meaning |
|---|---|
| **Direct** | A library component covers the prototype primitive's responsibility. Adoption is variant/prop mapping, not redesign. |
| **Partial** | A related library component exists, but variants, visual treatment, markup shape, or behavior require a decision or rework. |
| **No equivalent** | The library ships nothing that covers this responsibility. A library addition or explicit prototype-only justification is required. |

## 2. Architectural finding (governs the whole mapping)

The library is **Tailwind CSS v4 + `cva` + Radix primitives**, using shadcn conventions (`data-slot`, `asChild`/Slot, `cn()`). It is styled with semantic Tailwind tokens such as `bg-button-primary-background`, `bg-badge-success`, `text-chip-foreground`, `bg-table-background-active`, and `text-progress-foreground-active`.

The prototype uses **no Tailwind and no Radix**. It styles through `--ds-*` CSS custom properties and `.ds-*` / legacy class contracts, with dual-axis theming (`data-theme` light/dark and `data-theme-family` ionix/betika) that uses `!important` cascade overrides in `globals.css` lines 690–930.

`frontend/package.json` declares no Tailwind, Radix, `cva`, or component-library dependency. Its runtime dependencies are `clsx`, `framer-motion`, `lucide-react`, `next@16.1.6`, `react@19.2.3`, and `recharts`.

Storybook resolves sources to `../../packages/ui/src/components/<name>/<name>.tsx`, indicating a monorepo `packages/ui` workspace. **The installable package name and registry are not discoverable from the deployed Storybook.** This is an open question for Jeremy and a hard prerequisite for Phase 2.

## 3. Library inventory

### 3.1 Components

| Component | Confirmed variants / props | Stories |
|---|---|---|
| **Accordion** | single and multiple modes | Default, Multiple, interaction states |
| **Avatar** | sizes `xs`, `sm`, `md`, `lg`; circle/square; initials fallback | Default, sizes, shapes |
| **Badge** | `default` (success/green), `secondary`, `destructive`, `outline`, `ghost`; `asChild` | Icon, pill, count, spinner, link |
| **Button** | `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`; sizes `default`, `xs`, `sm`, `lg`, `icon`; `loading`, `disabled`, `asChild` | 16 stories incl. all variants/states |
| **Calendar** | range, multiple, dropdown caption, week numbers, disabled dates, two months, localization | 9 stories |
| **Card** | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`; opaque `bg-card`, `rounded-xl border py-6 shadow-sm` | Default, header/action/footer/media/grid |
| **Carousel** | vertical, multiple items, dots, autoplay, disabled navigation | 7 stories |
| **Checkbox** | checked, disabled, error, label, error message, controlled, multiline label | 19 stories |
| **Chip** | `variant="default"`; sizes `sm`, `lg`; active via `data-state="checked"`; `asChild` | Icon, active, count, link, button, icon button, group |
| **Dialog** | title, custom close, action, sticky footer, pagination, media, scrollable content | 9 stories |
| **Drawer** | all sides, scrollable, responsive | 4 stories |
| **DropdownMenu** | groups, submenu, checkbox/radio items, destructive and disabled items | 8 stories |
| **ErrorComponent** | icon, title, description, actions, custom icon, constrained width | 5 stories |
| **FormFieldBottomLabel** | error/success info, prefix/custom prefix, password validation | 9 stories |
| **FormStepper** | `FormStepper` + `FormStepperStep`; `isSuccess`, `isActive`, automatic number and connectors | states, 2/3/4 steps, long labels, disabled |
| **Href** | bold, underline, text, Next.js integration | 6 stories |
| **Input** | label, prefix, suffix icon, error, password validation | 9 stories |
| **InputGroup** | addons, buttons, block addons, states, textarea | 5 stories |
| **InputOTP** | label, error, disabled | 5 stories |
| **Logo** | sizes, letter variants, custom class, in-container | 12 stories |
| **NavigationMenu** | inline menu, inline grid, dropdown | 3 stories |
| **Pagination** | default, first/last controls, small | 3 stories |
| **Popover** | open, controlled, alignments | 4 stories |
| **ScrollArea** | default, inset padding | 2 stories |
| **SearchInput** | default value, disabled, error, clear button, controlled, submit-on-enter, toolbar | 10 stories |
| **Select** | Radix-based; groups, flag, full text, abbreviation | 5 stories |
| **Separator** | default, optional text label, in context | 4 stories |
| **Sheet** | left, top, bottom, all sides | 5 stories |
| **Skeleton** | `className`-driven sizing and shape | Text, Button, Avatar, Card |
| **SocialButton** | Google/Facebook/Apple; icon-only and text; disabled | 10 stories |
| **Switch** | Radix Switch: `checked`, `defaultChecked`, `onCheckedChange`, `disabled`, `required`, hidden bubble input | Default |
| **Table** | `Table` overflow container, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption` | Default, Without Footer |
| **Tabs** | Radix Tabs; default, **line** variant, vertical, vertical line | 4 stories |
| **Textarea** | default, with value, invalid | 3 stories |
| **Toast** | default, with cancel | 2 stories |
| **Tooltip** | offset, placements, text trigger | 4 stories |
| **Typography** | Display 1–3, Heading 1–6, Body 1/2, Footnote, Caption, polymorphic `as` | 27 stories |

### 3.2 Sidebar family

`Sidebar` (default, collapsible), `Sidebar/Group` (action, `asChild` label/action, header/footer, multiple groups), `Sidebar/Input` (prefix, suffix, error), `Sidebar/Layout` (default, rail, inset, separator), `Sidebar/Menu` (default, **skeletons**), `Sidebar/Provider`, and `Sidebar/Trigger`.

### 3.3 Patterns, icons, and layout

- **Modal Stacking** — Drawer over bottom nav, Dialog over bottom nav, Select inside Dialog over bottom nav.
- **Icons** — All Icons, Size Scale, States, Nav Bar Icons, Tap Nav Icons, **Country Flags**.
- **Layout** — Footer (Composed), Navbar (Composed, Mobile Overflow), TapNav (Playground, Mobile, Tablet).

### 3.4 Absent from the library

Radio / RadioGroup, inline Alert / Notice / Banner, Progress bar, ToggleGroup / segmented control, EmptyState, a publicly exported Spinner or LoadingState (a spinner exists only as `loader-spinner`, internal to `Button`), Breadcrumb, and Combobox.

## 4. Prototype primitive inventory

The prototype has no reusable UI primitive components. Its equivalents are CSS-class contracts consumed directly by feature and page components.

| Primitive | Definition | Usages (approx.) | Consumer files |
|---|---|---:|---:|
| `.glass-panel` | `globals.css:141`, `:555`; theme overrides `:690`, `:873`; route redefinitions in `design-system.css` | 135 | 23 |
| `.ds-action-button` + modifiers | `design-system.css:877–975` | 52 | 6 |
| `.btn-primary/.btn-secondary/.btn-cancel/.btn-icon/.btn-sm` | `globals.css:177`; `design-system.css:1124/1142/1145`; route-scoped rules | 45+ | 42 using a button class |
| `.btn-primary-header` | `globals.css:492–508` | header action | 1 |
| `.ds-control/.ds-select` and `textarea.ds-control` | `design-system.css:599–668`, `:332–338` | 67 | 11 |
| `.ds-notice` (info/warning/success/danger) | `design-system.css:806–850` | 37 | 8 |
| `.ds-panel/.ds-card` | `design-system.css:570–582` | 40 | 15 |
| `.ds-choice` | `design-system.css:750+` | 29 | 8 |
| `.option-card` | `design-system.css:3242`, `:3252`; two divergent definitions | 6 | 2 |
| `.ds-choice-control` (native checkbox and radio) | `design-system.css:340–365` | form-step usage | wizard steps |
| `.ds-switch` | `design-system.css` approximately `:795–819` | 14 | 2 |
| `.ds-tabs/.ds-tab` | `design-system.css:367–410` | 3 direct; local `.tab` patterns in 16 files | 16 |
| `.ds-table/.data-table` | `design-system.css:413–450`, `:517`, `:1249` | 7 `.data-table` | 17 table consumers |
| status/type/general badges | `design-system.css:1130`, `:1249`, `:2603` | 12+ | 18 |
| chips, filter chips, pills, day circles | `design-system.css:2814`; promotions and wizard local contracts | about 10 | 3 |
| modal overlay/modal structures | `design-system.css:2295`, `:2768`, `:2888`, `:3206`; four independent implementations | 8 | 8 |
| `.ds-loading-state` | `design-system.css:1907–1945` | 5 | 5 loading files |
| empty states | `design-system.css:530–555`, `:1249` | 7 | 7 |
| avatars | route-local plus `design-system.css:1249` | 11 files | 11 |
| `.ds-page-shell` | `design-system.css:453` | admin layout boundary | admin routes |
| type primitives | `design-system.css:232–295` | low/ad hoc adoption | few |
| skeletons | **none**; only unrelated live-status pulse dots | 0 | 0 |
| pagination (`.page-btn`) | promotions page contract | 1 | 1 |
| action menu | `design-system.css:1249` | 7 files | 7 |

## 5. Mapping table

| Prototype primitive | Library equivalent | Confidence | Notes: adoption and deltas |
|---|---|---|---|
| `.btn-primary`, `.btn-secondary`, `.btn-cancel`, `.ds-action-button--primary/--secondary/--outline/--surface` | `Button` | **Direct** | primary→`default`; secondary→`secondary`; cancel/outline→`outline`; surface→`ghost`; `--primary-lg`→`size="lg"`; compact/small→`size="sm"`. `--block` needs `className="w-full"`. Library adds `loading`; height/token values must be reconciled. |
| `.btn-icon` | `Button variant="ghost" size="icon"` | **Partial** | Library icon size is an unpadded `size-4`; prototype has 6px padding and 5px radius. `.btn-icon.danger` has no exact ghost-destructive combination and needs class support. |
| `.btn-primary-header` | `Button variant="outline"` | **Partial** | Prototype is transparent with yellow border/text and solid-yellow hover, enforced with `!important`. Library outline does not provide that brand inversion. Requires a token override or a library variant. |
| `.glass-panel` | `Card` | **Partial** | Major visual mismatch: prototype glassmorphism (translucency, blur, `--shadow-lg`) vs library opaque `bg-card`/`shadow-sm`. Adopting it flattens 23 files and orphans `data-theme-family` overrides. Needs a design decision first. |
| `.ds-panel`, `.ds-card` | `Card` + `CardHeader/Content/Footer` | **Direct** | `ds-panel-header__title/subtitle`→`CardTitle/CardDescription`. Library fixed padding differs. Prototype `aria-busy` styling has no direct analogue; use `Skeleton`. |
| status/type/general badges | `Badge` | **Direct** | success→`default`; neutral/type→`secondary`/`outline`; danger→`destructive`. Important: library `default` is green/success, not brand primary. Monospace badge needs `className="font-mono"`. |
| `.chip`, `.filter-chip` | `Chip` | **Direct** | `size="lg"|"sm"`; prototype `.active` becomes `data-state="checked"`. The With Icon Button pattern covers dismissible filters. |
| `.pill`, `.pill-selector`, `.day-circle` | none; `Chip` is visual nearest match | **No equivalent** | These are mutually-exclusive/multi-toggle controls using `aria-pressed`. Library has no ToggleGroup or ToggleButton; Chip does not supply grouped selection semantics. |
| `.ds-choice` | none | **No equivalent** | Selectable card with default/hover/selected/disabled/focus states. Card is not selectable and Chip is not a card. 29 usages across 8 files. |
| `.option-card` | none | **No equivalent** | Icon + label + selected check/dot card. Two divergent prototype definitions already; good library-component candidate. |
| `.ds-control` input | `Input` | **Direct** | Library covers label, prefix, suffix, error and password strength. Map prototype `aria-invalid`/`.is-invalid` to library error API; map `.ds-field` help/error to `FormFieldBottomLabel`. |
| `textarea.ds-control` | `Textarea` | **Direct** | Invalid state maps directly. Min-height/resize differences are minor. |
| `.ds-select` native select | `Select` | **Partial** | Requires markup rewrite from `<select><option>` to Radix trigger/content/item. Re-test keyboard and mobile behavior; library flag story can improve country selection. |
| `.ds-choice-control` checkbox | `Checkbox` | **Direct** | Adds error states/message and label association that the prototype CSS contract lacks. |
| `.ds-choice-control` radio | none | **No equivalent** | Library has no Radio/RadioGroup. |
| `.ds-switch` | `Switch` | **Direct** | Change nested checkbox `onChange(e.target.checked)` to `onCheckedChange(boolean)`. Two consumers; library adds accessible Radix behavior. |
| `.ds-tabs`, local `.tab` patterns | `Tabs` line variant | **Direct** | Library's line variant matches the prototype underline treatment. Replace manual buttons and active state with `Tabs value/onValueChange`, `TabsTrigger`, and `TabsContent`; gains keyboard semantics. |
| `.ds-table`, `.data-table` | `Table` slots | **Direct** | `Table` includes overflow; replace table wrappers. Header uppercase/spacing stays a consumer `className`; TableFooter covers grid-footer. |
| modal overlay/modal structures | `Dialog` | **Partial** | Consolidates four hand-built patterns but introduces portal, focus trap, scroll lock, Escape/outside-click behavior. Re-test nested wizard, onboarding, rewards, and governance flows. |
| `.action-menu`, `.menu-item`, `.menu-divider` | `DropdownMenu` + `Separator` | **Direct** | Menu item and destructive item map directly. Manual absolute positioning becomes Popper positioning. |
| avatars | `Avatar` | **Direct** | Prototype initials-in-circle maps to library fallback and size/shape API. |
| `WizardStepper.tsx` | `FormStepper` + `FormStepperStep` | **Direct** | `isActive`/`isSuccess` map to existing states; numbering and connectors are automatic. |
| dividers (`hr`, `.menu-divider`, borders) | `Separator` | **Direct** | Optional text label also replaces hand-built “OR” separators. |
| `.ds-loading-state` | `Skeleton` | **Partial** | Prototype is spinner + “Loading”; library provides skeletons, not public Spinner/LoadingState. Adopt skeletons (UX change) or retain prototype loading state. |
| skeletons (absent today) | `Skeleton` | **Direct** | Net-new additive adoption; no existing primitive to replace. |
| `.ds-notice` | none | **No equivalent** | Toast is transient, ErrorComponent is full-page, and FormFieldBottomLabel is field-level. The library has no persistent inline Alert/Notice/Banner. |
| empty states | `ErrorComponent` | **Partial** | Similar icon/title/description/action structure but semantically error, not empty. Reuse is possible; a library EmptyState is preferable. |
| `.page-btn` pagination | `Pagination` | **Direct** | Default / first-last / small stories cover the one prototype usage. |
| `.search-group/.search-input/.clear-search` | `SearchInput` | **Direct** | Library is a superset: clear action, errors, disabled, submit-on-enter, and toolbar layout. |
| `.ds-type-display-*`, heading/body/caption | `Typography` | **Partial** | Role names align, including D1–D3. Token values must be diffed; prototype uses a 1920px desktop breakpoint and class-only API. |
| `.ds-page-shell` | `Sidebar/Layout` inset (nearest) | **Partial** | The library layout is sidebar-shell oriented; prototype's fixed 1400px content boundary is app-specific. |
| `Sidebar.tsx`, `Header.tsx`, `AppShell.tsx` | Sidebar family / Navbar | **Partial** | Library is richer (Provider, Trigger, Group, Menu, rail/inset). Adoption rewrites the admin shell and must preserve CountrySwitcher and assistant mount points. |
| emoji flags and `lucide-react` icons | Icons and Country Flags | **Partial** | Library provides a curated icon system and flags. Prototype has direct lucide imports in 64 files; icon-name audit required. |
| native `title=` tooltip patterns | `Tooltip` | **Partial** | Upgrade is optional polish, not a like-for-like replacement. |
| dual-axis theme/CSS override layer | library token layer | **No equivalent** | The Tailwind semantic-token layer and prototype `data-theme-family` `!important` cascade will conflict. This must be resolved before component migration. |
| domain components: MatchCard, BetSlipWidget, SegmentBuilder, FieldPicker, Player360, charts, OnboardingTour, GlobalAssistantWidget | none, by design | **No equivalent** | Product-specific components should compose library primitives rather than be added to the component library. |

## 6. GAPS — prototype primitives with no library equivalent

### Strong candidates for the shared library

1. **Choice card / selectable card** — `.ds-choice` (29 usages / 8 files) and `.option-card` (two divergent definitions). This is the highest-frequency true gap and occurs throughout the promotion wizard.
2. **Inline notice / alert / banner** — `.ds-notice` has 4 severities and 37 usages / 8 files. Existing Toast, ErrorComponent, and FormFieldBottomLabel do not satisfy this persistent inline pattern.
3. **Radio / RadioGroup** — Checkbox and Switch exist, so absence of radio controls is an apparent library coverage omission.
4. **ToggleGroup / segmented control** — required by `.pill-selector` and `.day-circle` controls that use grouped `aria-pressed` semantics.
5. **EmptyState** — ErrorComponent is structurally similar but incorrect as the semantic default for a zero-data state.
6. **Spinner / LoadingState** — a spinner is implemented internally for `Button`, but 5 route-level loading files need a public loading primitive or an approved Skeleton-based replacement pattern.
7. **Progress bar** — prototype `RailBar` and simulator meters have no library equivalent.
8. **Glass/elevated Card variant** — only if glassmorphism is confirmed as intentional shared brand language. Otherwise this is a prototype visual treatment to retire, not library scope.

### Justified as prototype-only

`ds-page-shell`'s 1400px boundary; the dual-axis `data-theme`/`data-theme-family` system; and domain components including MatchCard, BetSlipWidget, SegmentBuilder, FieldPicker, Player360, recharts visualizations, OnboardingTour, and GlobalAssistantWidget.

## 7. UNUSED — library components the prototype never needed

Accordion; Carousel; Drawer; Sheet; InputOTP; InputGroup; SocialButton; Href; NavigationMenu; ScrollArea; Popover; Logo; Footer; Navbar; TapNav; Modal Stacking; Calendar (the prototype uses native date inputs); FormFieldBottomLabel (it becomes relevant only after Input adoption); Sidebar/Group, Sidebar/Input, Sidebar/Provider, Sidebar/Trigger, Sidebar/Layout, and Sidebar/Menu (prototype has its own Sidebar); Toast (no actual toast system); and ErrorComponent in its intended error-state role.

No action is required for these items; this list exists only to make the Storybook inventory complete.

## 8. Phase 2 adoption-cost assessment

### 8.1 Gate before any component work

Phase 2 cannot start with an import replacement. It must first:

1. Confirm the **published package name / registry** for the Storybook's `packages/ui` source.
2. Add and configure Tailwind v4 plus the library token layer in this Next 16 application.
3. Reconcile library semantic tokens with prototype `--ds-*` tokens and the `data-theme-family` `!important` overrides.

Until those items are complete, component swaps are not technically available. The theme/token collision is the decisive risk, not any individual primitive.

### 8.2 Trivial: mechanical, contained, low behavior risk

| Mapping | Estimated blast radius | Why |
|---|---:|---|
| `WizardStepper` → `FormStepper` | 1–2 files | Existing success/current semantics map directly; automatic connectors/numbers reduce code. |
| `.ds-switch` → `Switch` | 2 files | Mechanical event signature change. |
| `.page-btn` → `Pagination` | 1 file | One existing consumer. |
| dividers → `Separator` | about 7 files | Presentation-only replacement. |
| avatars → `Avatar` | about 11 files | Direct initials/size/shape map. |
| skeleton adoption | 0 replaced; additive | No existing skeleton primitive. |
| search group → `SearchInput` | 4 files | Library is a feature superset. |
| badges → `Badge` | about 18 files | Mechanical with an audit for the green `default` meaning. |

This tier is roughly 40 file touches, one to two engineering days after the integration gate, and has near-zero behavioral risk.

### 8.3 Moderate: variant/state mapping or light markup restructuring

| Mapping | Estimated blast radius | Main work |
|---|---:|---|
| button classes → `Button` | 42 files; 52 `ds-action-button` and 45+ legacy occurrences | Map modifier classes to variants/sizes; remove local loading/disabled styling. |
| `.ds-panel/.ds-card` → `Card` | 15 files | Slot composition and padding decisions. |
| input/textarea → `Input`/`Textarea` | 11 files; 67 occurrences | Field wrapper/error/help conversion. |
| tabs → `Tabs` line variant | 16 files | Manual state becomes Radix controlled values and tab content. |
| tables → `Table` | 17 files | Slot markup and table-wrapper consolidation. |
| action menus → `DropdownMenu` | 7 files | Positioning moves from absolute CSS to Popper. |
| chips/filter chips → `Chip` | 3 files | Active-state attribute and dismiss action composition. |
| checkbox controls → `Checkbox` | wizard form files | Label/error association change. |

This tier is 110+ touches in aggregate. Buttons are the broadest mechanical migration; Tabs and Table have the most structural work.

### 8.4 Risky: behavior change, visual regression, or blocked by a gap

| Mapping | Estimated blast radius | Why risky |
|---|---:|---|
| `.glass-panel` → `Card` | 23 files / 135 occurrences | Largest radius and a genuine visual delta (glass + blur → flat opaque). Theme-family overrides and route-specific redefinitions become obsolete. |
| `.ds-select` → `Select` | 11 files / 17 usages | Native select becomes Radix trigger/portal/items. Full markup rewrite and keyboard/mobile regression testing required. |
| modal structures → `Dialog` | 8 files / 4 implementations | Portal, focus trap, scroll locking, and outside-click/Escape behavior alter existing flows, including nested wizard modals. |
| `.ds-choice`, `.option-card`, pill toggle groups | 8–10 files | **Blocked** until ChoiceCard and ToggleGroup are added or a reuse decision is approved. |
| `.ds-notice` | 8 files / 37 usages | **Blocked** until Alert/Notice exists or the prototype pattern is retained. |
| radio controls | wizard form files | **Blocked** until RadioGroup exists. |
| app shell → Sidebar family/Navbar | 3 shell files; app-wide effect | Rewrites layout assumptions and the 1400px content boundary. |
| theme/token layer | `globals.css` plus all consumers | The Tailwind token system and `data-theme-family` override layer must be reconciled before any migration. |

### 8.5 Overall blast radius and recommended sequencing

A full adoption would touch approximately **60–70 of 88 `.tsx` files**, dominated by `.glass-panel` (23 files), button classes (42 files), tables (17 files), and tabs (16 files).

Recommended Phase 2 sequence:

1. Resolve the package/registry and Tailwind/token integration gate.
2. Adopt the trivial tier to prove imports, theming, and build/test behavior.
3. Migrate direct `Button`, `Card`, `Input`, `Checkbox`, `Table`, and `Tabs` mappings incrementally.
4. File the gap additions with Jeremy in parallel: ChoiceCard, Alert, RadioGroup, ToggleGroup, EmptyState, Spinner/LoadingState, and Progress.
5. Defer glass panels, Radix Select, Dialog, and the application shell until their visual/behavioral decisions are explicitly approved.

## 9. Phase 1 result

- The Storybook inventory is complete for the deployed `index.json`: **49 story titles** across components, icons, patterns, and layout.
- The requested prototype primitive inventory, mapping table, GAPS, UNUSED list, and Phase 2 blast-radius assessment are recorded above.
- **Only this document was added.** No component, application route, CSS, dependency, lockfile, commit, or push was changed.
