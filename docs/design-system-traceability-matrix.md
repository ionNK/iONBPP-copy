# Unity Design System Traceability Matrix

**Phase:** 3 — additive shared-primitives implementation
**Audit date:** July 22, 2026
**Source specification:** recovered `design.md` from `ba6f7d4~1:design.md` (Unity/Betika Figma extraction, June 17, 2026)
**Canonical CSS audited:** [`frontend/src/app/design-system.css`](../frontend/src/app/design-system.css)
**Compatibility CSS noted:** [`frontend/src/app/globals.css`](../frontend/src/app/globals.css)

## 1. Audit basis and boundary

The recovered `design.md` is the source specification. It documents the Figma-derived Unity design system: nine variable collections (636 variables), 82 text styles, and 119 component sets/components. This matrix is its repository traceability record; it is deliberately grouped by reusable token and component **contracts**, rather than repeating every Figma variable instance.

`design-system.css` is the canonical destination for shared web-admin tokens and opt-in primitives. `globals.css` remains a compatibility layer for active legacy consumers and is not counted as canonical Unity primitive coverage. Feature-scoped CSS is likewise excluded from shared-primitive coverage.

Phase 2 made no CSS, component, behavior, or visual changes. Phase 3 adds only approved reusable tokens and opt-in static primitives to `design-system.css`; it does not adopt them in existing product surfaces, remap live semantic values, alter behavior, or change page/component markup. Line references are verified against the current `design-system.css` (1,951 lines) and should be refreshed if that file is materially reordered.

### Status vocabulary

| Status | Meaning |
|---|---|
| **Implemented** | A reusable canonical token or CSS primitive materially covers the documented shared responsibility. |
| **Partial** | Relevant canonical coverage exists, but documented variants, values, states, or breadth are incomplete. |
| **Missing** | An applicable shared token or primitive is absent from the canonical layer. |
| **Deferred** | No confirmed current web-admin consumer justifies a shared implementation yet. This is not an implementation defect. |
| **Behavior-only gap** | CSS cannot satisfy the documented interaction, semantic, or state requirement on its own. |

## 2. Current implementation map

| Layer | Location | Audit treatment |
|---|---|---|
| Canonical shared design system | `frontend/src/app/design-system.css` | Source evaluated by this matrix. `--ds-*` tokens and `.ds-*` primitives count as shared coverage. |
| Legacy compatibility styles | `frontend/src/app/globals.css` | Required by active consumers, but not counted as canonical design-system coverage. |
| Feature presentation | Page-scoped sections in `design-system.css` | Correctly scoped ownership; excluded from reusable Unity primitive coverage. |
| Consumer markup and logic | `frontend/src/components/**`, `frontend/src/app/admin/**` | Out of scope except for recording behavior-only gaps. |

### Verified canonical CSS location index

| Canonical area | Current location in `design-system.css` |
|---|---:|
| Semantic, spacing, radius, opacity, type, breakpoint, control, and shadow tokens | lines 7–102 |
| Ionix light and dark token overrides, including primitive ramps | lines 105–223 |
| Display typography, scrim, field composition, textarea, and choice controls | lines 232–359 |
| Tabs and tables | lines 361–445 |
| 1400px page shell | lines 447–451 |
| Page/header, panel-header, empty-state, and responsive composition | lines 317–426 |
| Panels/cards and controls/selects | lines 428–529 |
| Dropdown | lines 531–606 |
| Choice card, notices, action buttons, switch, and status | lines 608–842 |
| Settings, Manual Award, and other feature-scoped styles | lines 844 onward |

## 3. Token traceability

| Documented contract | Canonical CSS location | Status | Audit finding / behavior-only gap |
|---|---|---|---|
| Blue primitive ramp (`betika-50`–`950`) | `--ds-betika-blue-50` through `--ds-betika-blue-950`, dark 177–187 / Ionix light 134–144 | Implemented | Exact recovered Unity values are present. Unity Dark is the `:root`/Ionix dark mapping; Unity Light is explicitly mapped to Ionix light. Tokens are not connected to live semantic product colors. |
| Green primitive ramp (`betika-50`–`950`) | `--ds-success`, `--ds-success-bright`, lines 27–28; theme overrides 92–93, 120–121 | Partial | Success semantics exist; full ramp and all Unity mappings do not. |
| Red primitive ramp (`betika-100`–`950`) | `--ds-danger`, line 30; overrides 94, 122 | Partial | Operational danger tokens exist but do not map the full documented Unity ramp. |
| Yellow primitive ramp (`betika-50`–`900`) | `--ds-accent`, `--ds-accent-hover`, lines 23–25; overrides 88–90, 116–118 | Partial | Action semantics exist through the compatibility yellow alias; no complete named Unity scale. |
| Grey primitive ramp (`betika-50`–`950`) | `--ds-betika-grey-50` through `--ds-betika-grey-950`, dark 188–198 / Ionix light 145–155 | Implemented | Exact recovered Unity values are present. Tokens are additive and do not remap current semantic text, surface, or border roles. |
| White/black, semantic text, surface, border, action, and feedback roles | `--ds-canvas` through `--ds-info`, lines 10–31; theme overrides 73–127 | Partial | Core roles exist, including disabled/static text at 57–58, but Unity’s complete semantic groups and value mappings are not modeled. |
| Component-specific semantic groups | Generic `--ds-*` foundation, lines 7–70 | Partial | Fields, tabs, tables, notices, buttons, switch, and status have reusable roles; groups for overlays, pagination, progress, and several component families do not. |
| Unity Theme A / Theme B modes | Ionix light/dark overrides, lines 73–127 | Partial | Theme switching exists, but it is not verified as a direct mapping to Unity Figma modes. |
| Opacity and overlay scale | `--ds-opacity-subtle`, `faint`, `muted`, `overlay`, lines 53–56 | Partial | Four reusable values exist; the full documented 2/5/10/15/25/50/60/70/80/90% scale does not. |
| Inverse black-prefixed opacity scale | `--ds-opacity-inverse-2` through `--ds-opacity-inverse-90`, root 57–66; Ionix light 156–165 | Implemented | Exact recovered 2/5/10/15/25/50/60/70/80/90% source steps are represented. The Ionix-light override uses the recovered `#001528` base; root/Ionix dark uses white. |
| Scrim | `--ds-scrim`, root 67 and theme overrides 166 and 176; `.ds-scrim`, 297–301 | Implemented | Approved dedicated overlay token: Ionix light `rgba(0, 20, 37, 0.8)` and Ionix dark `rgba(0, 20, 37, 0.3)`. The class is static only; modal/drawer behavior remains component work. |
| Elevation/effects | `--ds-shadow-sm`, `--ds-shadow-md`, lines 69–70; overrides 97–98, 125–126 | Partial | Two reusable elevations exist, not the complete Unity effect system. |
| Spacing scale | `--ds-space-0` through `--ds-space-30`, lines 39–52 | Implemented | All documented scalar values (0, 1, 2, 4, 8, 12, 14, 16, 18, 20, 24, 32, 48, 60, 80, 120px) are represented. |
| Radius scale | `--ds-radius-xs` through `--ds-radius-pill`, lines 32–38 | Implemented | Documented 4, 8, 14, 20, and 999px roles are represented; legacy 6px `--ds-radius-sm` remains for compatibility. |
| Breakpoint tiers | `--ds-breakpoint-mobile-*` through `--ds-breakpoint-desktop-*`, lines 89–96 | Implemented | Exact named Unity mobile, tablet portrait, tablet landscape, and desktop tiers are documented as additive tokens. Existing responsive rules remain unchanged; CSS media queries retain literal values because custom properties are invalid there. |
| Screen padding, margins, columns, and gutters | `.ds-page-shell`, 311–315; app-shell compatibility styles in `globals.css` | Partial | Content width is shared; outer gutters/grid are not a canonical shared layout primitive. |
| Standard administrative page boundary | `.ds-page-shell`, lines 311–315 | Implemented | Canonical 1400px centered content boundary. |
| Control heights and component sizes | `--ds-control-height-sm`, `--ds-control-height`, lines 66–67 | Partial | Two practical heights exist; the complete Unity size system does not. |
| Inter web typeface | `--ds-font-family`, line 59; type roles 137–159 | Implemented | Inter is the canonical web-admin font family. |
| Display scale D1–D3 | `--ds-font-size-display-*`, `--ds-line-height-display-*`, `--ds-font-weight-display`, and `--ds-letter-spacing-display`, lines 75–87; `.ds-type-display-d1`–`d3`, 232–277 | Implemented | Exact recovered mobile and desktop sizes, line heights, weight, and tracking are available through opt-in roles. Existing product hierarchy is unchanged. |
| Heading scale H1–H5 | `.ds-type-heading`, 137–148; page-header title, 330–336 | Partial | Generic heading and page-title roles exist; documented H1–H5 scale is incomplete. |
| Body, footnote, and caption scale | `--ds-font-size-body`, `--ds-font-size-caption`, lines 60–65; roles 150–159 | Partial | Body and caption roles exist; no complete documented text-scale system. |
| Documented weights and tracking | Local weights; table tracking at 295–301 | Partial | No complete reusable weight/tracking contract. |
| SF Pro / Roboto native styles | No browser-admin implementation | Deferred | Native-platform styles are outside the browser-based admin scope. |

## 4. Component traceability

| Unity component family | Canonical CSS location | Status | Static coverage | Behavior-only gap |
|---|---|---|---|---|
| Button (default, secondary, ghost, outline, destructive, link; sizes/states) | `.ds-action-button`, approximately 736–794 | Partial | Core primary, secondary, outline, surface, block, size, disabled, and focus styling exists. | Loading, pressed, destructive/link/icon-only API, and accessible state semantics require component adoption. |
| Badge / status | `.ds-status`, approximately 820–842 | Partial | Operational active, paused, scheduled, draft, ended, and default states exist. | Full Unity shapes, severity variants, and sizing API are absent. |
| Text field / select | `.ds-control`, `.ds-select`, 457–529 | Partial | Hover, focus, disabled, invalid, and select affordances exist. | Labels, help/error association, completed/stake states, and validation logic require markup/state. |
| Textarea | `textarea.ds-control`, 190–196 | Implemented | Shared multiline dimensions, resize, padding, and line-height exist. | Validation and field association remain component work. |
| Checkbox | `.ds-choice-control`, 198–223 | Partial | Native sizing, accent color, disabled state, and focus ring exist. | Indeterminate/error/group semantics require component markup and logic. |
| Radio button | `.ds-choice-control`, 198–223 | Partial | Native sizing, accent color, disabled state, and focus ring exist. | Group semantics and error state require component markup and logic. |
| Switch | `.ds-switch`, approximately 795–819 | Partial | Track, thumb, checked, and focus treatment exist. | Label association, disabled/error coverage, and form semantics require consumer verification. |
| Tabs (pill and line) | `.ds-tabs`, `.ds-tab`, 225–269 | Partial | Reusable line-tab visual contract with selected, hover, focus, and disabled states exists. | ARIA tablist/tab/tabpanel semantics and keyboard navigation are component behavior. |
| Dropdown menu | `.ds-dropdown-*`, 531–606 | Partial | Trigger, menu, selected, disabled, hover, and focus-visible styling exists. | Open/close lifecycle, Escape, click-away, focus management, and arrow-key navigation are behavior. |
| Accordion | No shared primitive | Deferred | None. | Disclosure semantics and keyboard handling require a selected consumer. |
| Dialog / scrim | `--ds-scrim` and `.ds-scrim`, 67, 166, 176, and 297–301 | Partial | Static, theme-aware scrim coverage exists. | Portal/layering, focus trap, dismiss, inert background, and dialog/drawer composition require a component primitive. |
| Drawer | No shared primitive | Deferred | None. | Modal semantics, focus, dismiss, and responsive placement require a component primitive. |
| Tooltip | No shared primitive | Deferred | None. | Trigger behavior, positioning, and accessible descriptions require a component primitive. |
| Notice / banner / toast | `.ds-notice`, approximately 650–735 | Partial | Info, warning, success, and danger static notice variants exist. | Toast lifecycle, `aria-live`, dismissal, stacking, and placement are runtime behavior. |
| Table | `.ds-table-wrap`, `.ds-table`, 271–309; table composition 375–386 | Partial | Overflow, header, row, border, hover, and responsive scroll foundations exist. | Sorting, pagination, selectable rows, semantic headers, and consumer adaptation require components. |
| Pagination | No shared primitive | Deferred | None. | Requires a selected paginated consumer and accessible current-page navigation. |
| Chips | No shared primitive | Deferred | None. | Requires a selected filter/tag consumer and interaction contract. |
| Date picker / calendar | No shared primitive | Deferred | None. | Requires locale, date-range, validation, and complex keyboard behavior. |
| Progress / skeleton | No shared primitive | Deferred | None. | Requires an active shared loading consumer and motion/reduced-motion contract. |
| Empty state | `.ds-empty-state`, 388–411 | Implemented | Shared centered layout, title, description, and spacing exist. | Consumer content/actions and illustration guidance remain feature decisions. |
| Navigation / sidebar | Primarily `globals.css`; no `.ds-*` navigation primitive | Partial | Operational navigation exists outside the canonical layer. | High-impact migration/behavior work is outside this audit. |
| Page container | `.ds-page-shell`, 311–315 | Implemented | Shared centered 1400px content boundary exists. | Responsive outer gutters remain app-shell/layout behavior. |
| Panel / card | `.ds-panel`, `.ds-card`, 428–440 | Partial | Shared border, radius, surface, shadow, and busy state exist. | Padding, heading/action composition, variants, and density remain consumer-defined. |
| Choice card | `.ds-choice`, approximately 608–649 | Partial | Default, hover, selected, disabled, and focus-visible treatment exists. | Selection semantics and group keyboard behavior depend on consumer type. |

## 5. Cross-cutting behavior-only gaps

| Area | Requirement outside CSS-only coverage |
|---|---|
| Focus management | Dialogs, drawers, menus, tooltips, and tab panels need controlled focus movement and restoration. |
| Keyboard interaction | Tabs, menus, radio groups, accordions, date pickers, and selectable collections need documented key handling. |
| Accessible state semantics | Fields need label/help/error associations and `aria-invalid`; controls need checked/pressed/selected semantics. |
| Runtime states | Loading buttons, toasts, async menus, skeletons, and progress indicators need component/state logic. |
| Responsive behavior | Grid collapse, tab overflow, table adaptation, overlay placement, and app-shell gutters need layout/component contracts. |
| Theme behavior | New tokens need both Ionix values and theme validation before visual adoption. |
| Motion | Overlays, toasts, tooltips, and progress need animation and reduced-motion policy. |

## 6. Value-alignment decisions requiring visual approval

| Documented Unity value | Current canonical/product value | Decision required before any later implementation |
|---|---|---|
| Primary yellow `#FFDE24` | `--ds-accent` uses the existing `--color-betika-yellow` compatibility alias. | Approve global value change or retain compatibility alias. |
| Destructive `#AD0000` / `#CC3225` / `#EB5141` | `--ds-danger` is `#ef4444` dark / `#dc2626` light. | Approve destructive visual migration before remapping. |
| Dark canvas `#001528` | Current canvas is `#00152e`. | Confirm whether the one-channel difference is intentional branding. |
| Unity theme modes | Current Ionix workspace light/dark modes. | **Approved Phase 3 mapping for additive primitives only:** Unity Light → Ionix light; Unity Dark → Ionix dark. This does not assert a global semantic-theme equivalence or alter live tokens. |
| Unity typography weights/tracking | Existing shared and local typography values. | **Approved Phase 3 additive values only:** D1–D3 use recovered 700 weight and `-2px` tracking. No existing hierarchy changed; later adoption requires visual review. |

### Phase 3 source inconsistency recorded for upstream clarification

| Unity source entries | Phase 3 ruling | Follow-up |
|---|---|---|
| Dedicated overlay opacity token: Ionix light `rgba(0, 20, 37, 0.8)` / Ionix dark `rgba(0, 20, 37, 0.3)`; semantic `Scrim / background`: Ionix light `rgba(255, 255, 255, 0.8)` / Ionix dark `rgba(0, 21, 40, 0.3)` | Use the dedicated opacity token as `--ds-scrim`, because the recovered specification explicitly identifies it as the modal/drawer overlay. | **Flag upstream:** the documented Scrim component background differs from the documented overlay token. Confirm intended component composition with the design team before dialog/drawer adoption. |

## 7. Known issues — deferred to later phases

| Issue | Current evidence | Resolution / scope |
|---|---|---|
| Light-mode token discrepancy | `tests/light-mode.spec.ts` expects `--color-bg-app: #f9fafb`; the evaluated value remains `#f6f7f9`. Wave 1 validation reconfirmed this pre-existing failure and did not alter the test or token. | **Decision pending: update test / fix token.** Outside Wave 1 route-adoption scope. |
| Promotion-wizard market option timeout (occurrence 1) | E2E timeout waiting for `option[value="KE"]`. | **Phase 5 scope.** Do not fix in Phase 2. |
| Promotion-wizard market option timeout (occurrence 2) | E2E timeout waiting for `option[value="KE"]`. | **Phase 5 scope.** Do not fix in Phase 2. |

## 8. Audit summary and Phase 3 candidate shortlist

This group-level audit covers **49 documented applicable contracts**: **13 implemented**, **25 partial**, **1 missing**, and **10 deferred**. Phase 3 moved the approved blue/grey ramps, inverse opacity scale, scrim token/class, breakpoint contract, and D1–D3 roles into canonical additive coverage; dialog/scrim static coverage is partial because interaction semantics remain component work. Deferred items have no confirmed current web-admin consumer; behavior-only gaps are recorded separately because CSS cannot complete them.

### Phase 3 implementation record and later candidates

Phase 3 authorizes and implements only the six additive primitives listed above. It makes **no semantic remapping or existing-component adoption**.

Later candidates requiring separate authorization and visual review:

1. Shared layout/grid/gutter composition beyond the existing 1400px page boundary.
2. Complete heading/type-scale roles beyond the additive D1–D3 display roles.
3. Completion of the action/button, field, status/badge, and semantic-color contracts where a current consumer demonstrates a need.
4. A dialog/drawer primitive, including the behavior-only requirements recorded above and clarification of the Unity scrim inconsistency.

This document records the Phase 3 implementation gate. Stop here before any adoption or later-phase work.

## 9. Adoption record — Wave 1

**Validation date:** July 22, 2026
**Approved route:** `frontend/src/app/admin/crm/segments/page.tsx`

The CRM Segments route is the sole Wave 1 consumer migration. Its local `<style jsx>` block was removed after its live rules were mapped into the clearly scoped `.crm-segments-page` section of `design-system.css`. Generic local selectors were replaced with route-semantic class names, the page now opts into the canonical `.ds-page-shell` 1400px boundary, and existing segment creation, editing, deletion, member-view, and empty-state interactions were preserved. The unused local `.btn-primary-link` rule was identified as dead and intentionally not migrated.

Validation: the production build passed, and the focused Playwright route-load test for `/admin/crm/segments` passed. The broader light-mode suite retained its known baseline failures: the canvas expectation mismatch (`#f9fafb` expected versus `#f6f7f9` evaluated) and two promotion-wizard `option[value="KE"]` timeouts; its accessible-focus-ring case passed. No later adoption wave is authorized by this record.
