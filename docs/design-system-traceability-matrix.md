# Unity Design System Traceability Matrix

**Phase:** 3 — Missing primitive foundations (implementation complete)
**Source specification:** [`design.md`](../design.md), extracted June 17, 2026  
**Canonical implementation reviewed:** [`frontend/src/app/design-system.css`](../frontend/src/app/design-system.css)  
**Compatibility layer reviewed:** [`frontend/src/app/globals.css`](../frontend/src/app/globals.css)  
**Audit date:** July 22, 2026

## 1. Scope and phase boundary

This document is the Phase 2 traceability audit between the Unity/Betika design-system specification and the current frontend shared-style implementation.

Phase 2 was documentation-only. Phase 3 adds only opt-in, consumer-backed shared CSS foundations; it does not migrate feature markup, workflows, behavior, or existing page presentation.

- no component, application, workflow, or visual migration was performed;
- no Settings, Manual Award, Promotions, or Experiments presentation was changed;
- no lint, type-check, build, test, responsive, or theme command was run;
- documented items without a current web-admin consumer are recorded as deferred, not implementation defects.

### Status vocabulary

| Status | Meaning |
|---|---|
| **Implemented** | A reusable canonical token or primitive exists in `design-system.css` with a materially matching responsibility. |
| **Partial** | A relevant implementation exists, but its documented variants, token completeness, or values are incomplete/divergent. |
| **Missing** | An applicable shared token or primitive is absent from the canonical layer. |
| **Deferred** | The documented item has no confirmed current web-admin consumer, so implementation is not justified until a consumer is selected. |
| **Behavior-only gap** | CSS alone cannot complete the requirement; component semantics, keyboard handling, state logic, or interaction implementation is needed. |

## 2. Current ownership and implementation map

| Layer | Location | Current ownership | Phase 2 assessment |
|---|---|---|---|
| Canonical shared design-system layer | `frontend/src/app/design-system.css` | `--ds-*` semantic foundation and shared `ds-*` primitives. | Canonical destination for new shared styling. It has a useful foundation but is not yet a complete Unity token/component implementation. |
| Legacy compatibility layer | `frontend/src/app/globals.css` | Existing `--color-*`, layout, app-shell, sidebar, global baseline, and legacy utilities. | Still required by active consumers and referenced by some `design-system.css` rules. It is not a second canonical design-system source. |
| Feature-scoped presentation | `frontend/src/app/design-system.css` under `.settings-container` | Settings-specific page and component presentation. | Validly scoped, but not a reusable primitive contract. It must not be counted as shared Unity primitive coverage. |
| Consumer components | `frontend/src/components/**`, `frontend/src/app/admin/**` | Feature structure, semantic markup, state, event logic, and workflows. | Out of scope for Phase 2 except where a behavior-only gap is identified. |

### Canonical CSS location index

| Canonical section | Location in `design-system.css` | Current coverage |
|---|---:|---|
| Base semantic tokens | lines 7–45 | Surfaces, text, borders, accent, focus, feedback, radius, limited spacing, control heights, transitions, shadows. |
| Theme overrides | lines 48–102 | Ionix light and dark values for the existing semantic foundation. |
| Page boundary | lines 104–112 | `.ds-page-shell`, `max-width: 1400px`, centered content. |
| Panels/cards | lines 114–126 | `.ds-panel`, `.ds-card`, busy state. |
| Controls/selects | lines 143–215 | `.ds-control`, `.ds-select`, hover, focus, disabled, invalid. |
| Dropdown | lines 217–292 | Trigger, menu, items, selected, disabled, focus-visible. |
| Choice card | lines 294–324 | `.ds-choice`, selected, disabled, focus-visible. |
| Notices | lines 350–419 | `.ds-notice` plus info, warning, success, danger variants. |
| Action buttons | lines 421 onward | `.ds-action-button` variants and disabled/focus-visible states. |
| Switch/status | later shared primitive section | `.ds-switch`, `.ds-status`, state variants. |
| Settings-specific styles | `.settings-container` onward | Feature-scoped Settings presentation; excluded from reusable primitive coverage. |

## 3. Token traceability

### 3.1 Color primitives and semantic colors

| `design.md` contract | Canonical CSS location | Status | Traceability and Phase 3 implication |
|---|---|---|---|
| Blue primitive ramp (`betika-50`–`950`) | No named Unity blue primitive scale. Existing surfaces use `#00152e` / `#001d3d` at lines 10–11 and 78–79. | Missing | Add named primitive aliases only if Phase 3 needs them to support a semantic mapping. Do not recolor existing UI automatically. |
| Green primitive ramp (`betika-50`–`950`) | `--ds-success: #008e00`, `--ds-success-bright: #47aa39` at lines 27–28; theme overrides at 67–68 and 95–96. | Partial | Semantic success coverage exists, but no full documented ramp or `#007600` canonical semantic mapping. |
| Red primitive ramp (`betika-100`–`950`) | `--ds-danger` at line 30 and theme overrides at 69 and 97. | Partial | Existing operational danger values (`#ef4444` / `#dc2626`) differ from Unity destructive values (`#AD0000`, `#CC3225`, `#EB5141`). Value adoption requires visual approval. |
| Yellow primitive ramp (`betika-50`–`900`) | `--ds-accent: var(--color-betika-yellow)` at lines 23 and 63/91. | Partial | The operational compatibility alias is intentional. It does not yet express Unity’s `#FFDE24` primitive/action token directly. |
| Grey primitive ramp (`betika-50`–`950`) | No named Unity grey scale. Theme-specific text/surface values at lines 10–22 and 50–62. | Missing | Add only if future semantic aliases cannot be expressed with current semantic tokens. |
| White/black primitive semantics | `--ds-text-primary`, `--ds-text-secondary`, `--ds-text-muted`, `--ds-text-inverse` at lines 16–19. | Partial | Primary/secondary/inverse roles exist. Disabled/static-white semantics are absent as explicit tokens. |
| Semantic surfaces | `--ds-canvas`, `--ds-surface`, raised/hover/selected/disabled at lines 10–15 with theme overrides. | Implemented | Responsible semantic surface roles exist, though their values represent the current Ionix product contract rather than direct Unity mode values. |
| Semantic borders | `--ds-border`, subtle, strong at lines 20–22. | Partial | Shared border roles exist; Unity color-specific border roles (red, green, yellow, black/white solid) are not exposed. |
| Semantic action colors | `--ds-accent`, hover, foreground at lines 23–25. | Partial | Primary action semantics exist. Secondary, destructive, success, link, odds, tabs, chips, and side-nav aliases are absent. |
| Semantic feedback colors | `--ds-success`, `--ds-warning`, `--ds-danger`, `--ds-info` at lines 27–31. | Partial | Base feedback roles exist but foreground, active, and component-specific aliases are incomplete. |
| Component-specific semantic groups | General `--ds-*` foundation only. | Partial | Inputs, notices, and status primitives consume generic tokens. No documented semantic groups for accordion, dialog, drawer, tooltip, table, pagination, progress, or tabs. Add only with a confirmed primitive consumer. |
| Theme A / Theme B token modes | Ionix light/dark overrides at lines 48–102. | Partial | Theme switching exists, but is operational Ionix theming rather than a direct Unity theme-A/theme-B implementation. Do not assume Figma “Light UI” equals current light workspace. |

### 3.2 Opacity, overlay, and elevation

| `design.md` contract | Canonical CSS location | Status | Traceability and Phase 3 implication |
|---|---|---|---|
| Opacity scale: 2%, 5%, 10%, 15%, 25%, 50%, 60%, 70%, 80%, 90% | Literal opacities appear in surface/border/shadow values at lines 12–15, 20–22, 44–45, and in component declarations. | Partial | Introduce named overlay/opacity tokens if a Phase 3 primitive needs repeated, theme-aware overlay values. |
| Inverse black-prefixed opacity scale | No dedicated token scale. | Missing | Defer until a primitive requires both directional overlay scales. |
| Scrim token | No shared `--ds-scrim` token or `.ds-scrim` primitive. | Missing | Implement with dialog/drawer work, not as standalone unused CSS. |
| Elevation | `--ds-shadow-sm`, `--ds-shadow-md` at lines 44–45 and light overrides 72–73. | Partial | Reusable elevation exists but is not mapped to a documented Unity effect system. |

### 3.3 Spacing, radius, layout, and breakpoints

| `design.md` contract | Canonical CSS location | Status | Traceability and Phase 3 implication |
|---|---|---|---|
| Spacing: 0, 1, 2, 4, 8, 12, 14, 16, 18, 20, 24, 32, 48, 60, 80, 120px | `--ds-space-1` through `--ds-space-6` define 4, 8, 12, 16, 20, 24px at lines 35–40. | Partial | Add the remaining documented values with value-oriented names or an explicitly documented compatibility mapping. |
| Radius: 4, 8, 14, 20, 999px | `--ds-radius-sm: 6px`, `--ds-radius-control: 8px`, `--ds-radius-panel: 14px` at lines 32–34. | Partial | Define canonical extra-small (4), small (8), medium (14), large (20), and pill (999) aliases. The 6px legacy small radius should remain only as a compatibility decision. |
| Breakpoint tiers | No named breakpoint tokens. Existing component media queries use feature-specific values. | Missing | Establish documentation/contract for shared primitive breakpoints before applying them; do not rewrite existing feature layouts. |
| Screen padding, margin, columns, gutter | `.ds-page-shell` only constrains width at lines 104–112. App-shell outer gutters remain in `globals.css`. | Partial | A shared container/grid primitive is a Phase 3/4 candidate after compatibility requirements are specified. |
| Standard administrative page boundary | `.ds-page-shell`, 1400px max width, lines 104–112. | Implemented | This is the canonical 1400px content-width contract. Page-specific outer padding stays outside the primitive. |
| Control heights | `--ds-control-height-sm: 36px`, `--ds-control-height: 48px` at lines 41–42. | Partial | Useful operational tokens exist; Unity component size variants are not completely modeled. |

### 3.4 Typography

| `design.md` contract | Canonical CSS location | Status | Traceability and Phase 3 implication |
|---|---|---|---|
| Inter product typeface | Global baseline in `globals.css`; shared primitives inherit font at lines 225 and 429. | Implemented | Retain Inter as the web-admin product typeface. |
| Display scale D1–D3 | No named shared display tokens/classes. | Missing | Add only when a shared consumer is selected. |
| Heading scale H1–H5 | No named shared heading token/class system. Local values occur in consumers and Settings-scoped selectors. | Missing | Define a semantic type scale before cross-feature heading normalization. |
| Body B1/B2, footnote, caption | Individual primitive font sizes exist (for example lines 134, 270, 356, 430), but no named scale. | Partial | Add reusable tokens/classes for current applicable text roles. |
| Specified weights and tracking | Local hardcoded weights/tracking; no canonical typography contract. | Missing | Phase 3 should define a minimal shared type contract before visual adoption. |
| SF Pro / Roboto native styles | No implementation. | Deferred | Not applicable to the current browser-based admin UI. |

## 4. Component traceability

| Unity component family | Canonical implementation location | Status | Static CSS coverage | Behavior-only gap / Phase 3 action |
|---|---|---|---|---|
| Button — default, secondary, ghost, outline, destructive, link; sizes/states | `.ds-action-button` beginning line 421. | Partial | Generic, outline, surface, secondary, primary and sizing modifiers exist. Disabled and `:focus-visible` exist. | Pressed, loading, destructive, link, icon-only, complete sizing API, and semantic component state contract require both CSS and component adoption. |
| Badge / status | `.ds-status` shared section. | Partial | Existing status treatment covers operational state labels. | Unity pill/circle shapes, warning/destructive/verified/outline variants, and complete size variants are absent. |
| Text field / select | `.ds-control`, `.ds-select`, lines 143–215. | Partial | Default, hover, focus, disabled, and invalid presentations are present. | Completed/stake/error messaging/label-help association require component markup and validation semantics. |
| Textarea | `textarea.ds-control` Phase 3 section. | Implemented | Shared multiline minimum height, vertical resize, and control-consistent padding/line height exist. | Field association, validation, and consumer adoption remain component work. |
| Checkbox | `.ds-choice-control > input` Phase 3 section. | Partial | Opt-in native checkbox/radio sizing, accent color, disabled appearance, and focus ring exist. | Indeterminate/error states and adoption are component work; native browser keyboard behavior is retained. |
| Radio button | `.ds-choice-control > input` Phase 3 section. | Partial | Opt-in native checkbox/radio sizing, accent color, disabled appearance, and focus ring exist. | Group semantics, error states, and adoption remain component work. |
| Switch | `.ds-switch` shared section. | Partial | Visual track/thumb and checked/focus styles exist. | Complete disabled/error/label association and form semantics must be verified in component consumers. |
| Tabs — pill and line | `.ds-tabs`, `.ds-tab` Phase 3 section. | Partial | Shared line-tab layout, selected/hover/focus/disabled visual contract exists. | ARIA tablist/tab/tabpanel keyboard behavior and consumer adoption remain component work. |
| Dropdown menu | `.ds-dropdown-*`, lines 217–292. | Partial | Trigger, menu, selected, disabled, hover, and focus-visible styling exist. | Open/close lifecycle, escape, click-away, focus management, and arrow-key navigation are component behavior. |
| Accordion | No shared primitive. | Deferred | None. | Implement only when a consuming feature is selected; requires disclosure semantics and keyboard handling. |
| Dialog / scrim | No shared primitive. | Deferred | None. | Requires portal/layering, focus trap, escape/dismiss, inert background, and scrim behavior. |
| Drawer | No shared primitive. | Deferred | None. | Requires modal/non-modal semantics, focus handling, dismiss, and responsive placement. |
| Tooltip | No shared primitive. | Deferred | None. | Requires trigger/focus/hover/touch behavior, positioning, and accessible descriptions. |
| Notice / banner / toast | `.ds-notice` lines 350–419. | Partial | Info, warning, success, danger static notice variants exist. | Toast timing, announcement (`aria-live`), dismissal, stacking, and placement require runtime behavior. |
| Table | `.ds-table-wrap`, `.ds-table` Phase 3 section. | Partial | Shared overflow wrapper, header, row, border, and hover presentation exists. | Sorting, pagination, selectable rows, responsive transformation, semantic headers, and consumer adoption are component concerns. |
| Pagination | No shared primitive. | Deferred | None. | Implement with a selected paginated consumer and accessible current-page navigation. |
| Chips | No shared primitive. | Deferred | None. | Implement only when a selected/filter/tag consumer requires it. |
| Date picker / calendar | No shared primitive. | Deferred | None. | Requires complex keyboard, locale, date-range, and validation behavior. |
| Progress / skeleton | No shared primitive. | Deferred | None. | Implement only when an active shared loading pattern is selected. |
| Empty state | No shared primitive. | Partial | Feature-specific empty states may exist, but no canonical primitive. | Content/action structure and illustration rules need a confirmed cross-feature contract. |
| Navigation/sidebar | Global app-shell/sidebar styles in `globals.css`; no Unity shared navigation primitive. | Partial | Operational navigation is implemented outside canonical DS layer. | High-impact surface; audit/migrate separately in Phase 4 rather than folding into Phase 3 foundation work. |
| Page container | `.ds-page-shell`, lines 104–112. | Implemented | Shared centered 1400px content boundary. | Responsive outer gutters remain app-shell/layout behavior. |
| Panel / card | `.ds-panel`, `.ds-card`, lines 114–126. | Partial | Shared border, radius, surface, shadow, and busy state exist. | Padding, heading/action composition, variants, and density are presently consumer-defined. |
| Choice card | `.ds-choice`, lines 294–324. | Partial | Default, hover, selected, disabled, focus-visible presentation exists. | Selection semantics and keyboard group behavior depend on consumer component type. |

## 5. Cross-cutting behavior-only gaps

The following requirements cannot be completed by a token-only or static-CSS change:

| Area | Gap | Required implementation ownership |
|---|---|---|
| Focus management | Dialogs, drawers, menus, tooltips, and tab panels need controlled focus movement and restoration. | Shared React/component primitives. |
| Keyboard interaction | Tabs, menus, radio groups, accordions, date pickers, and selectable collections need documented key handling. | Shared React/component primitives. |
| Accessible state semantics | Fields need `aria-invalid`, error descriptions, labels/help text association; controls need correct checked/pressed/selected semantics. | Consumer markup plus shared component API. |
| Loading states | Button loading, toast lifecycles, async menu states, skeleton/progress transitions require runtime state. | Consumer/state-management code. |
| Responsive behavior | Grid collapse, tab overflow, table adaptation, modal/drawer viewport behavior, and page gutters require component/layout contracts. | Shared layouts and consumer components. |
| Theme behavior | New tokens must define both Ionix theme values and be verified against existing theme switching. | Token layer plus visual/theme validation in later phases. |
| Motion | Toast, dialog, drawer, tooltip, progress, and reduced-motion behavior require explicit animations and media-query policy. | Shared primitive implementation. |

## 6. Value-alignment decisions requiring visual approval

The following are traceability gaps, not automatic migration instructions:

| Documented Unity value | Current canonical/product value | Decision required before adoption |
|---|---|---|
| Primary yellow `#FFDE24` | `--ds-accent` aliases the existing `--color-betika-yellow`. | Approve a global value change or retain the compatibility alias. |
| Destructive `#AD0000` / `#CC3225` / `#EB5141` | Existing `--ds-danger` uses `#ef4444` or `#dc2626`. | Approve destructive visual migration before remapping. |
| Dark canvas `#001528` | Existing canvas is `#00152e`. | Confirm whether the one-channel difference is intentional product branding. |
| Unity theme modes | Existing Ionix light/dark workspace themes. | Confirm mapping before treating Unity “Light UI”/“Dark UI” as direct implementation targets. |
| Unity typography weights/tracking | Existing local typography choices. | Approve type-scale rollout before changing established page hierarchy. |

## 7. Phase 3 implementation backlog

Phase 3 should implement only the gaps demonstrated by this matrix, in this order:

1. **Token completion without visual migration**
   - Add documented spacing, radius, overlay/opacity, text-disabled/static, and selected semantic aliases.
   - Preserve current operational values through compatibility aliases unless visual approval explicitly changes them.

2. **Minimal typography contract**
   - Add named Inter body, caption, and heading token/class roles needed by shared primitives.
   - Do not mass-rewrite feature typography.

3. **Field composition**
   - Add shared field label, help, error, textarea, checkbox, and radio foundations with semantic state hooks.
   - Keep validation and form behavior in components.

4. **Core shared primitive gaps**
   - Add tabs and table foundations only after identifying a first consumer.
   - Normalize badge/status variants as needed by current consumers.
   - Extend action-button variants only where a consumer demonstrates the need.

5. **Deferred interactive overlays**
   - Implement dialog, drawer, tooltip, date picker, pagination, chips, skeleton, and progress only when an approved consumer and behavioral contract exist.

6. **No broad migration**
   - Do not migrate all Settings, Promotions, Experiments, Manual Award, or app-shell visuals as part of Phase 3.
   - Such adoption belongs to Phase 4 and Phase 5 after primitive contracts are ready.

## 8. Phase 3 implementation record

- [x] Added documented spacing, radius, opacity, disabled/static text, and type-role token aliases without changing approved product color values.
- [x] Added opt-in shared typography roles: `.ds-type-heading`, `.ds-type-body`, and `.ds-type-caption`.
- [x] Added opt-in field composition: `.ds-field`, label, help, error, textarea, and native choice-control foundations.
- [x] Added opt-in line-tab and responsive table foundations for confirmed active consumers.
- [x] Preserved existing Settings, Manual Award, Promotions, Experiments, and other feature markup, visual presentation, states, and interaction behavior; no broad migration occurred.
- [x] Kept behavior-only requirements—ARIA keyboard patterns, validation semantics, menu/dialog interactions, pagination, and responsive consumer transformation—out of the CSS-only Phase 3 scope.
- [x] No lint, type-check, build, test, responsive, theme, or other automated validation command was run, per user instruction.

## 9. Phase 2 completion record

- [x] `design.md` token groups, layout contracts, typography, and component inventory audited.
- [x] Current `design-system.css` tokens and shared primitive locations mapped.
- [x] Existing `globals.css` dependency identified as a compatibility layer rather than canonical shared ownership.
- [x] Applicable items classified as implemented, partial, missing, deferred, or behavior-only.
- [x] Value-alignment decisions separated from structural implementation gaps.
- [x] Behavior-only requirements recorded for component-level implementation.
- [x] Phase 3 backlog constrained to traceability-proven missing primitives and token gaps.
- [x] No product CSS, TSX, workflow, or UI behavior changed during Phase 2.
- [x] No lint, type-check, build, test, responsive, or theme command run during Phase 2.