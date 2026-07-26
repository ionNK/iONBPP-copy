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
| Light-mode Ionix-light expectations | **Closed July 22, 2026.** The rendered `--color-bg-app` value is `#f6f7f9` and `--color-text-primary` is `#17212f`; `tests/light-mode.spec.ts` now asserts both active values. `#f9fafb` and `#111827` are non-rendered legacy generic-light palette values, not the active Ionix-light canvas or text-primary tokens. | No token change. The test expectations were corrected to the rendered canonical Ionix-light values. |
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

## 9. Adoption record — Phase 4, Wave 3, Step 5 Schedule

**Validation date:** July 24, 2026
**Approved surface:** `frontend/src/components/wizard/steps/Step5Schedule.tsx`

Step 5 Schedule presentation was migrated from its component-local `<style jsx>` block into the canonical `design-system.css` layer beneath the new `.wizard-schedule` root scope. The migration preserves the existing schedule state model, start/end datetime controls, recurring toggle, click-away frequency menu, active-day toggles, usage limits, validation summary, and all existing labels, IDs, ARIA roles, and handler behavior. No wizard navigation, validation policy, or currency behavior changed.

**Dedicated coverage:** `frontend/tests/schedule-step.spec.ts` exercises entry through the wizard, date summary validation and recovery, recurring state, frequency selection, weekday state, usage-limit persistence, and the scoped root’s rendered width. The component now contains no static `<style>` block or inline `style=` attributes. Keyboard menu navigation, Escape dismissal, and focus restoration remain deferred component-behavior work; the existing click-away behavior was deliberately preserved.

## 9. Adoption record — Wave 1

**Validation date:** July 22, 2026
**Approved route:** `frontend/src/app/admin/crm/segments/page.tsx`

The CRM Segments route is the sole Wave 1 consumer migration. Its local `<style jsx>` block was removed after its live rules were mapped into the clearly scoped `.crm-segments-page` section of `design-system.css`. Generic local selectors were replaced with route-semantic class names, the page now opts into the canonical `.ds-page-shell` 1400px boundary, and existing segment creation, editing, deletion, member-view, and empty-state interactions were preserved. The unused local `.btn-primary-link` rule was identified as dead and intentionally not migrated.

Validation: the production build passed, and the focused Playwright route-load test for `/admin/crm/segments` passed. The broader light-mode suite originally retained the canvas expectation mismatch (`#f9fafb` expected versus `#f6f7f9` evaluated) and two promotion-wizard `option[value="KE"]` timeouts; its accessible-focus-ring case passed. The authorized light-canvas closure subsequently corrected only the stale canvas expectation; the promotion-wizard timeouts remain deferred. No later adoption wave is authorized by this record.

## 10. Adoption record — Wave 2, Batch 3, route 1

**Validation date:** July 23, 2026
**Approved surface:** `LiveMonitoring` within `/admin/reports` (Analytics & Reports → Live Monitoring tab)

The Live Monitoring component is the first one-route Wave 2 migration. Its local `<style jsx>` block was removed and its presentation rules were transferred unchanged to a clearly scoped `.live-monitoring` section in `design-system.css`. The component keeps only its two existing data-driven inline styles: metric-label color and the calculated budget-fill width/color. No markup, polling behavior, promotion links, live toggle, or nested `OperationalControls` behavior changed.

Validation: `grep` found exactly **2** intentional dynamic inline styles and no `<style>` block. The production build passed. `tests/live-monitoring.spec.ts` passed in isolation; `tests/operational-controls.spec.ts` passed (**4/4**); and the serialized related route suite `tests/governance-approvals.spec.ts tests/live-monitoring.spec.ts --workers=1` passed (**5/5**). The same combined suite was nondeterministic under its default five parallel workers: its four approval tests passed, while the Live Monitoring tab did not mount, consistent with shared browser-storage/test-server interference rather than this stylesheet migration. Next route migration remains gated on human review and commit of this route.

## 11. Adoption record — Wave 2, Batch 3, route 2

**Validation date:** July 23, 2026
**Approved surface:** `OperationalControls` within `/admin/promotions/PRM-2024-001` and `/admin/reports` (Live Monitoring cards)

`OperationalControls` is the second one-route Wave 2 migration. Its local `<style jsx>` block was removed and its presentation rules were transferred unchanged to the clearly scoped `.operational-controls` section in `design-system.css`. The component has no inline styles. No control definitions, permission gating, modal invocation, audit-trail writes, state transitions, or compact-versus-labelled markup changed.

Manual source-level comparison covered both consumers: the promotion-detail page uses labelled action controls and the reports Live Monitoring cards use compact icon-only controls. The migrated selectors preserve the shared wrapper, default, danger, disabled, compact, hover, and ended-state contracts in both contexts.

Validation: the inline-style guardrail found **0** `style=` attributes and **0** `<style>` blocks in `OperationalControls.tsx`. The production build passed (with only the pre-existing Recharts zero-dimension prerender warnings). `tests/operational-controls.spec.ts --workers=1` passed (**4/4**). No test changes were needed because this existing focused suite exercises the promotion-detail consumer; the previously recorded Live Monitoring suite covers the reports consumer. Committed as `9e0279f` after human review.

## 12. Wave 2 completion ledger

**Wave window:** July 22–23, 2026
**Scope:** approved CRM analytics/player/intelligence, authorized CRM risk/segment surfaces, and Governance route/component migrations.
**Delivery model:** static `<style jsx>` presentation was centralized into scoped `design-system.css` sections; data-driven inline expressions and all behavioral markup were retained.

| Batch / surface | Migrated route or component | Commit | Preserved dynamic expressions | Recorded validation outcome |
|---|---|---|---:|---|
| Batch 1 | `/admin/crm/analytics` | `10a0298` | 7 | Build passed; inline-style guardrail confirmed expected 7. |
| Batch 1 | `/admin/crm/players` | `10a0298` | 1 | Build passed; inline-style guardrail confirmed expected 1. |
| Batch 1 | `/admin/crm/intelligence` | `10a0298` | 7 | Build passed; inline-style guardrail confirmed expected 7. |
| Batch 2 | `/admin/crm/responsible-gaming` | `856fd64` | 11 | Build passed; seven static spacing props centralized; authorized consumer behavior retained. |
| Batch 3 | `/admin/governance` | `7f82e82` | Data-driven budget/chart values retained | Governance approvals baseline initially 3/4; stale audit-route test selector was corrected in `fd3b688`, restoring 4/4. |
| Batch 3 | `ActionModal` | `8b95982` | 0 | Build and governance approval coverage passed; first approved consumer of canonical `--ds-scrim`. |
| Batch 3 | `ResponsibleGambling` | `8b95982` | 0 | Feature-scoped static styles centralized without changes to its two consumer routes. |
| Batch 3 | `LiveMonitoring` | `1133ac9` | 2 | Build passed; focused Live Monitoring coverage passed; serialized related suite passed 5/5. |
| Batch 3 | `OperationalControls` | `9e0279f` | 0 | Build passed; focused operational-controls suite passed 4/4; labelled and compact consumers compared. |

### Final Wave 2 validation and deferred follow-up

Final validation completed July 23, 2026: `npm --prefix frontend run build` passed. The deterministic complete affected suite set — `governance-approvals`, `operational-controls`, `live-monitoring`, and `ui-ux-links` — passed **31/31** with `--workers=1`. The build emitted only the pre-existing Recharts zero-dimension prerender warnings. All Wave 2 adoption records above are committed; this ledger and final validation record remain intentionally uncommitted for human review.

Deferred items:

1. **Promotion wizard market selection:** two known E2E timeouts remain waiting for `option[value="KE"]`; they are unrelated to the stylesheet centralization and remain deferred from the prior baseline.
2. **Parallel-suite nondeterminism:** the combined Governance/Live Monitoring tests can fail under their default parallel workers when shared storage or the test server prevents the Live Monitoring tab from mounting. The serialized `--workers=1` run is the established deterministic baseline.
3. **Light-mode scrim review:** `ActionModal` now adopts the approved Phase 3 `--ds-scrim` token, but the intended rendered light-mode scrim value remains subject to design review before broader dialog/drawer adoption.

## 13. Adoption record — Phase 4, Wave 3, CountrySwitcher

**Validation date:** July 23, 2026
**Approved surface:** `frontend/src/components/layout/CountrySwitcher.tsx`

CountrySwitcher presentation was migrated from its component-local `<style jsx>` block to the canonical `design-system.css` layer, with local visual values mapped to existing `--ds-*` surface, text, border, accent, success, spacing, radius, shadow, and transition tokens. The component's DOM shape, state flow, handlers, responsive label behavior, permission-derived options, and current ARIA contract (`aria-haspopup`, `aria-expanded`, `role="listbox"`, `role="option"`, and `aria-selected`) remain unchanged.

**Deferred Phase 6 accessibility item:** the current listbox-shaped interaction has no Escape-key close behavior, no arrow-key option navigation, and no focus return to the trigger (`role="listbox"` control) after selection or dismissal. These are known keyboard-contract gaps, intentionally preserved in this visual-only migration; Phase 6 must define and implement the complete focus and keyboard model rather than changing behavior incrementally here.

## 14. Adoption record — Phase 4, Wave 3, CustomerHeader

**Approved surface:** `frontend/src/components/customer/CustomerHeader.tsx`

CustomerHeader presentation was migrated from its component-local `<style jsx>` block to the canonical `design-system.css` layer under the scoped `.customer-header` contract. Static presentation now consumes the existing `--ds-*` spacing, surface, border, text, accent, success, radius, and transition tokens where semantic equivalents exist. The shared header's DOM shape, navigation URLs and active-link predicate, reward-context subscription, theme toggle behavior, and all event handlers remain unchanged.

**Preserved product behavior:** the existing prefix navigation predicate intentionally marks both **Sports** and **Live In-Play** active at `/customer/sports/live`; this visual-only migration preserves that current behavior rather than redefining information architecture. Search, deposit, and notification controls remain presentation-only because no behavior was introduced in this scoped migration.

**Dedicated coverage:** `frontend/tests/customer-header.spec.ts` covers route presence, navigation URLs, active-link behavior (including the existing live-route overlap), theme toggle persistence, and a reactive rewards-context update after redemption.

## 15. Adoption record — Phase 4, Wave 3, MatchCard

**Validation date:** July 23, 2026
**Approved surface:** `frontend/src/components/sports/MatchCard.tsx` within `/customer/sports`

MatchCard presentation was migrated from its component-local `<style jsx>` block to the canonical `design-system.css` layer under the scoped `.s-match-card` contract. Static local values now consume existing `--ds-*` surface, text, border, accent, spacing, radius, and transition tokens. The component's DOM shape, selection/expansion state, handlers, and decimal/fractional rendering branch remain unchanged.

**Documented testability finding:** `toggleOddsFormat` exists in the bet-slip context, but no current consumer exposes an odds-format control and `oddsFormat` is neither persisted nor URL-driven. The dedicated E2E spec therefore covers the reachable default decimal branch only. The fractional rendering branch is preserved verbatim and is currently unreachable by users and untestable through E2E without a product decision; flag for product review as a planned feature, dead code, or missing UI.

**Dedicated coverage:** `frontend/tests/match-card.spec.ts` covers default decimal rendering, live/upcoming details, selection add/remove through the bet-slip flow, and additional-market expansion/collapse.

## 16. Adoption record — Phase 4, Wave 3, Player360

**Validation date:** July 23, 2026  
**Approved surface:** `frontend/src/components/crm/Player360.tsx` within `/admin/crm/[id]`

Player360's static local `<style jsx>` rules were moved to the scoped `.p360` section in `design-system.css`, using existing design-system tokens for semantic surface, text, border, accent, feedback, spacing, radius, and transition values. The component's hero identity, local tab state (with Overview as the default), notes effect/state, action handlers, peer links, responsive layout, sticky rail, and runtime inline values are preserved. Runtime inline contracts remain only for lifecycle badge colors, health color, and `RailBar` label color plus calculated width/background.

**Explicit boundary:** `PlayerTabs.tsx` is an adjacent conditional-tab consumer and is deliberately untouched. Its selectors and its dynamic timeline/bonus colors and progress widths are not part of the `.p360` contract. No ARIA or keyboard-semantic changes are introduced in this visual-only turn.

**Dedicated coverage:** `frontend/tests/player-360.spec.ts` covers resolved and not-found detail paths, hero identity, tab switching, action-to-recent-actions reactivity, notes persistence in the local UI state, and peer navigation.

## 17. Adoption record — Phase 4, Wave 3, PlayerTabs

**Validation date:** July 24, 2026
**Approved surface:** `frontend/src/components/crm/PlayerTabs.tsx` within `/admin/crm/[id]`

PlayerTabs static local `<style jsx>` presentation was moved to the canonical `design-system.css` layer under the distinct `.p-tabs` namespace. Its overview, financial, campaign, timeline, and bonus/offer tab content keeps the existing DOM and is driven by Player360's local tab state without changes to tab definitions, state transitions, content, or handlers. The `.p-tabs` scope is intentionally separate from the committed `.p360` section, so adjacent Player360 styling remains outside this component's selector contract.

**Preserved inline contracts:** dynamic timeline event-dot colors and dynamic bonus status colors remain inline; calculated bonus wagering progress widths remain inline. All other static visual rules now use the scoped canonical layer and existing `--ds-*` tokens where suitable. No ARIA or keyboard-semantic changes are introduced in this visual-only adoption.

**Validation:** dedicated `frontend/tests/player-tabs.spec.ts` passed **2/2** with serialized Playwright execution, covering Player360-driven tab switching and the retained timeline/progress inline state. The serialized Wave 3 regression selection (`country-switcher`, `customer-header`, `match-card`, and `player-tabs`) passed **11/11**. Production build and `git diff --check` passed; the build emitted only pre-existing Recharts zero-dimension prerender warnings. The known untracked, failing `frontend/tests/player-360.spec.ts` was not changed or run as part of this adoption.

## 18. Adoption record — Phase 4, Wave 3, Rewards Hub

**Validation date:** July 24, 2026
**Approved surface:** `frontend/src/app/customer/rewards/page.tsx` within `/customer/rewards`

Rewards Hub static local styling was moved to the canonical `design-system.css` layer under the dedicated `.rewards-hub-container` namespace. Static presentation now uses the existing design-system surface, text, border, accent, success, danger, spacing, radius, shadow, opacity, and transition tokens where suitable. The page's rewards context subscription, tier calculations, filters, redemption flow, modal state, transaction rendering, responsive layout, and handlers remain unchanged.

**Preserved inline contract:** the calculated `.progress-fill` width remains inline because it is runtime state. No static styling remains inline after replacing the two modal alignment declarations with the scoped `.modal-title` and `.pc-item-balance` selectors. The Rewards Hub namespace is page-owned and does not collide with the adjacent `.p360` or `.p-tabs` contracts. No ARIA or keyboard-semantic changes are introduced in this visual-only adoption.

**Dedicated coverage:** `frontend/tests/rewards-hub.spec.ts` covers the rendered loyalty/store surface, calculated inline progress width, store filtering, redemption modal opening, and cancellation.

## 19. Adoption record — Phase 4, Wave 3, Customer Home

**Validation date:** July 24, 2026
**Approved surface:** `frontend/src/app/customer/page.tsx` within `/customer`

Customer Home static styling was moved from the page-local `<style jsx>` block into `design-system.css` under the existing `.customer-container.customer-home` namespace. Static layout, typography, surfaces, cards, navigation affordances, hover treatments, and the 1200px responsive rules now consume the canonical scoped layer and applicable existing design-system tokens. The customer layout, rewards context subscription, promotion context subscription, dynamic game and promotion data rendering, route links, and handlers remain unchanged.

**Preserved inline contracts:** the runtime reward-nudge progress width and the per-game dynamic gradient backgrounds remain inline. No ARIA or keyboard-semantic changes are introduced in this visual-only adoption. The Customer Home scope is page-owned and does not collide with the established Rewards Hub, Player360, or PlayerTabs namespaces.

**Validation:** dedicated `frontend/tests/customer-home.spec.ts` passed **2/2** with serialized Playwright execution, covering the main customer surface, static section counts, retained dynamic inline width/gradient contracts, customer navigation destinations, and the 1200px responsive layout contract. The serialized customer regression selection (`customer-header`, `rewards-hub`, and `customer-home`) passed **7/7**. Production build and `git diff --check` passed; the build emitted only pre-existing Recharts zero-dimension prerender warnings. The known untracked, failing `frontend/tests/player-360.spec.ts` was not changed or run as part of this adoption.

## 20. Adoption record — Phase 4, Wave 3, GlobalAssistantWidget

**Validation date:** July 24, 2026
**Approved surface:** `frontend/src/components/layout/GlobalAssistantWidget.tsx`, mounted by `frontend/src/app/layout.tsx`

GlobalAssistantWidget static presentation was migrated from the component-local style contract into the canonical `design-system.css` layer under the `.assistant-widget` namespace. The widget remains mounted inside the root `AIProvider` on every route, preserving its fixed overlay mount point, stacking order, pointer-event behavior, animated open/close rendering, and trigger/window state flow. The AI context, message lifecycle, typing state, minimize/close handlers, controlled input, Enter submission, auto-scroll effect, action links, and runtime message timestamps remain unchanged.

**Preserved overlay/state contracts:** `.assistant-widget` remains fixed with `z-index: 99999`; the open window remains above the trigger at `z-index: 100001`; no scrim or pointer-event interception was introduced; and the existing minimize and close controls continue to close the same `isOpen` state. No ARIA or keyboard-semantic changes are introduced in this visual-only adoption.

**Dedicated coverage:** `frontend/tests/global-assistant-widget.spec.ts` covers root mount visibility, fixed positioning and stacking order, pointer-event behavior, open/close flow, controlled input/send enablement, immediate user-message rendering, and typing state.

## 21. Adoption record — Phase 4, Wave 3, OnboardingTour

**Validation date:** July 24, 2026
**Approved surface:** `frontend/src/components/onboarding/OnboardingTour.tsx`, portaled to `document.body`

OnboardingTour static presentation was migrated from its component-local global style block into the canonical `design-system.css` layer under the `.onboarding-tour` namespace. The portal content now carries this wrapper solely to scope the centralized selectors; the portal destination, element hierarchy, class contracts, Framer Motion keys and animations, tour steps, target lookup and measurement flow, scroll timing, restart event listener, `hasSeenTour` persistence, and ExplainerVideo handoff remain unchanged.

**Preserved overlay/state contracts:** the backdrop remains fixed at `z-index: 99999` and retains default pointer events; the non-interactive spotlight remains at `z-index: 100000` with `pointer-events: none`; and the fixed tour card remains at `z-index: 100001`. The backdrop click and close button continue to use the same `finishTour` path, so dismissal still persists suppression and schedules the same video follow-up. No ARIA or keyboard-semantic changes are introduced in this visual-only adoption.

**Dedicated coverage:** `frontend/tests/onboarding-tour.spec.ts` covers portal overlay visibility, backdrop/card/spotlight stacking and pointer-event contracts, step advancement to the spotlight state, persisted dismissal across reload, and suppression when the tour was previously completed. An unused `AppShell` import was also removed from the root layout without changing the root provider/component mount order.

## 22. Adoption record — Phase 4, Wave 3, wizard support batch

**Validation date:** July 24, 2026  
**Approved surfaces:** `frontend/src/components/wizard/WizardStepper.tsx`, `frontend/src/components/wizard/steps/Step6Display.tsx`, and `frontend/src/components/wizard/steps/Step7Review.tsx`

Static presentation for the wizard support batch was moved from three component-local `<style jsx>` blocks into `design-system.css`. The stepper retains its seven-step current/completed class contract and responsive overflow behavior. Step 6 remains under its existing `.display-step` namespace, retaining its tabbed editor and sticky responsive preview. Step 7 receives the intentionally added `.wizard-review` root scope so its otherwise generic card, row, label, tag, and utility selectors cannot leak outside the review surface.

**Preserved behavior and test contracts:** wizard state, navigation, upload refs/FileReader paths, tab/device/channel/badge interactions, previews, summaries, planned-date formatting, Edit callbacks, ARIA labels, and the review confirmation control are unchanged. The four Step 7 inline `textTransform: 'capitalize'` declarations remain intentional runtime markup. Existing checks continue to target **Banner image URL**, **Promotion banner preview**, the **Promotion Summary Overview** region, and seven `button.edit-link` controls.

**Validation:** local `<style jsx>` blocks were reduced from **1/1/1 to 0/0/0** for WizardStepper, Step6Display, and Step7Review; inline-style counts are **0/0/4**, preserving Step 7’s four declared transforms. Serialized promotion-flow and light-mode coverage, production build, and `git diff --check` are recorded with this batch. The known untracked, failing `frontend/tests/player-360.spec.ts` was not changed or run.

## 23. Adoption record — Phase 4, Wave 3, wizard steps batch 1

**Validation date:** July 24, 2026
**Approved surfaces:** `frontend/src/components/wizard/steps/Step1Basics.tsx`, `frontend/src/components/wizard/steps/Step4Rewards.tsx`, and `frontend/src/components/wizard/steps/Step5Schedule.tsx`

Static presentation for the first wizard-step batch was centralized from the three component-local `<style jsx>` blocks into scoped `design-system.css` contracts: `.wizard-basics`, `.wizard-rewards`, and `.wizard-schedule`. The migration retains the existing `step-container`, `form-panel`, `ds-control`, `ds-choice`, `ds-notice`, `ds-panel`, and switch/dropdown composition while applying the available shared tokens for color, spacing, radius, border, surface, shadow, and transitions. No wizard-step markup, navigation, data model, validation policy, or event-handler behavior changed.

**Preserved behavior and state contracts:** Step 1 retains saved-template expansion/loading, basic-field validation recovery, promotion-type filtering/sorting/selection, and template-detail rendering. Step 4 retains market-derived free-bet currency synchronization, locally stored country-limit evaluation, reward/calc/matrix selection, tier add/edit/remove behavior, wagering and free-bet controls, and multi-day switches. Step 5 retains start/end datetime state, duration summary validation/recovery, recurring state, click-away frequency menu, active-day selection, and usage-limit persistence. No ARIA or keyboard-semantic changes were introduced; keyboard menu navigation, Escape dismissal, and focus restoration for the Step 5 frequency listbox remain deferred component-behavior work.

**Validation:** all three local `<style jsx>` blocks and all component inline `style=` attributes were removed (**1/1/1 to 0/0/0** and **0/0/0** inline styles). Serialized `promotion-flow` and `schedule-step` coverage passed **2/2**, exercising the end-to-end wizard flow plus schedule summary, recurrence, frequency, weekdays, and limits. `npm --prefix frontend run build` and `git diff --check` passed; the build emitted only the pre-existing Recharts zero-dimension prerender warnings. This batch is intentionally uncommitted for human review.

## 24. Adoption record — Phase 4, Wave 3, Step 3 Triggers

**Validation date:** July 24, 2026
**Approved surface:** `frontend/src/components/wizard/steps/Step3Triggers.tsx`

Step 3 static presentation was migrated from its component-local `<style jsx>` block into the canonical `design-system.css` layer under the dedicated `.wizard-triggers` namespace. The existing step/container, panel, card, dropdown, notice, choice, and add-action compositions are retained, while static layout, typography, modal, responsive, and advanced-editor presentation now consume the shared color, spacing, radius, border, surface, shadow, and transition tokens where semantic equivalents exist.

**Preserved behavior and state contracts:** initial Deposit-trigger seeding; event selection/removal; parameter-rule add, update, and removal; type-aware default operators and inputs; advanced-mode rendering; per-player-cap and app-channel advisories; click-away custom rule dropdown dismissal; and event-catalog modal selection remain unchanged. The inline muted range-separator declaration was replaced by its scoped static selector, leaving **zero** component inline styles. No ARIA or keyboard-semantic changes were introduced; keyboard listbox navigation, Escape dismissal, and focus restoration for the custom rule dropdowns and event modal remain deferred component-behavior work.

**Validation:** the local `<style jsx>` block and the component's sole inline `style=` declaration were removed (**1 to 0** and **1 to 0**, respectively). Focused serialized wizard regression coverage, production build, and `git diff --check` are recorded with this adoption. This batch is intentionally uncommitted for human review.

## 25. Adoption record — Phase 4, Wave 3, wizard orchestration and scope batch

**Validation date:** July 24, 2026
**Approved surfaces:** `frontend/src/components/wizard/CreatePromotionWizard.tsx`, `frontend/src/components/wizard/steps/Step2Eligibility.tsx`, and `frontend/src/components/wizard/steps/Step2Scope.tsx`

Static presentation for the wizard orchestration and scope batch was centralized into the canonical `design-system.css` layer under the `.wizard-page`, `.wizard-scope`, and `.wizard-eligibility` namespaces. The migration preserves the wizard shell, step navigation, toast and modal composition, footer controls, scope cards, market selection, segment handoff, qualification rules, custom segment creation, and all existing state/context contracts. Generic selectors remain scoped to their owning surface; no player-360 or previously completed surface was revisited.

**Preserved behavior and state contracts:** CreatePromotionWizard keeps edit/template hydration, CRM segment handoff, reset behavior, validation, draft/template/segment actions, publish persistence, navigation, modal dismissal, and review routing. Step 2 Scope retains market and segment selection, custom segment creation, URL handoff semantics, and responsive layout. Step 2 Eligibility retains trigger-rule state, rule editing/removal, compliance scan, and event-catalog interactions. No ARIA or keyboard-semantic changes were introduced; existing custom-dropdown and modal keyboard behavior remains outside this visual-only batch.

**Validation:** local style blocks were removed from all three surfaces, and component inline-style declarations were reduced to zero. The production build passed with only the pre-existing Recharts zero-dimension prerender warnings. The repository-local Playwright runner, invoked with `./frontend/node_modules/.bin/playwright test --config=frontend/playwright.config.ts --workers=1`, passed the combined light-mode and promotion-flow selection **6/6**. `git diff --check` passed. This batch is intentionally uncommitted for human review.

## 26. Adoption record — Phase 4, Wave 3, BetSlipWidget

**Validation date:** July 24, 2026
**Approved surface:** `frontend/src/components/sports/BetSlipWidget.tsx` within `/customer/sports`

BetSlipWidget static presentation was migrated from its component-local `<style jsx>` block into the canonical `design-system.css` layer under the `.betslip-widget` namespace. The migration retains the widget’s fixed desktop rail, mobile bottom-sheet behavior, z-index, open-state class contract, tab composition, odds selection flow, stake increment controls, review/placement summary, confirmation view, My Bets, cash-out transition, and settled history. Static styling uses existing design-system surface, text, border, accent, success, danger, spacing, radius, shadow, opacity, and transition tokens where suitable; runtime ticket state and calculated values remain component behavior.

**Kenya product-review finding:** the placement summary presents a hard-coded **“KRA Excise Duty”** line and calculation as a product-facing wagering charge. The visual migration preserves that existing commercial/tax behavior without asserting regulatory correctness. Product, finance, and legal/compliance owners must verify the applicable Kenya tax type, rate, calculation basis, disclosure wording, and receipt/audit obligations before the flow is relied upon in production or marketed as compliant.

**Dedicated coverage:** `frontend/tests/betslip-widget.spec.ts` exercises selection from the existing MatchCard, opening the bet slip, stake increment, review, placement summary, successful placement, My Bets visibility, cash-out, and the resulting Settled-history state. Validation results for the focused and regression gates are recorded after execution. This adoption is intentionally uncommitted for human review.

## 27. Phase 4, Wave 3 wrap-up ledger — July 24, 2026

**Review state:** Phase 4 Wave 3 is complete at `3d4e71e` (BetSlipWidget). The working tree has only this traceability-ledger update pending human review; no commit was created for this wrap-up.

| Delivery / approved surface | Commit | Preserved inline-style count | Recorded validation outcome |
| --- | --- | ---: | --- |
| Wave 2 preflight / baseline | `836030e` | n/a | Baseline/preflight recorded before Wave 3 work. |
| ExplainerVideo | `a607f9b` | 0 | Dedicated open/close coverage and light mode 5/5. |
| CountrySwitcher | `1c69f82` | 0 | Dedicated country-switcher coverage recorded. |
| CustomerHeader | `e1a1164` | 0 | Dedicated customer-header coverage recorded. |
| MatchCard | `41af4ed` | 0 | Dedicated MatchCard coverage recorded. |
| Player360 | `bf7df1c` | 4 | Dynamic data-driven color/width contracts retained inline; player-tab coverage recorded. |
| PlayerTabs | `38860f8` | 5 | Dynamic activity/engagement/progress contracts retained inline; player-tab coverage recorded. |
| Rewards Hub | `ded23c3` | 1 | Dynamic rewards-progress width retained inline; dedicated coverage recorded. |
| Customer home | `a304b36` | 3 | Dynamic nudge/game presentation contracts retained inline; dedicated coverage recorded. |
| GlobalAssistantWidget | `9cb22b1` | 0 | Dedicated overlay/state coverage recorded. |
| OnboardingTour | `0476174` | 2 | Runtime target measurement/positioning retained inline; dedicated portal/overlay coverage recorded. |
| Wizard supports: WizardStepper / Step6Display / Step7Review | `f546c30` | 0 / 0 / 4 | Serialized promotion-flow and light-mode coverage, build, and diff check recorded. |
| Wizard steps batch 1: Step1Basics / Step4Rewards / Step5Schedule | `ffe8421` | 0 / 0 / 0 | Serialized promotion-flow + schedule-step passed 2/2; build and diff check passed. |
| Step3Triggers | `e3b311a` | 0 | Focused serialized wizard regression, build, and diff check recorded. |
| Final wizard batch: CreatePromotionWizard / Step2Eligibility / Step2Scope | `a7895bf` | 10 / 0 / 1 | Combined light-mode + promotion-flow passed 6/6; build and diff check passed. CreatePromotionWizard's 10 retained declarations are verified dynamic/modal/control contracts. |
| BetSlipWidget | `3d4e71e` | 49 | Dedicated full-lifecycle BetSlip coverage added; the 49 retained expressions support financial, funding, and state-dependent UI. |

**Full serialized Wave 2 + Wave 3 suite:** invoked with `--workers=1` across the 16 Wave 2/Wave 3 spec files. The final run completed **59 tests: 53 passed, 6 failed**. All six failures were the documented long-run development-server flake: two CustomerHeader, two Customer Home, and two GlobalAssistantWidget tests each timed out at `page.goto('/customer')` with `net::ERR_ABORTED` / “maybe frame was detached.” The remaining 53 tests passed, including all governance, wizard, sports, tour, rewards, player-tabs, light-mode, and UI/link coverage. This is reported as a non-green aggregate validation outcome, not masked as a product regression.

### Consolidated deferred / product-review docket

1. **Keyboard gaps:** custom dropdown/listbox and modal keyboard navigation, Escape dismissal, and focus restoration remain deferred for Step 3, Step 5, and the Step 2/wizard modal controls.
2. **Sports/Live overlap:** resolve the product/navigation overlap between the Sports and Live In-Play experiences before broadening customer navigation behavior.
3. **Inert controls:** audit and either implement, disable with explanation, or remove non-functional customer/admin controls; do not treat visual migration as an interaction implementation.
4. **Fractional odds:** product must decide whether fractional odds are supported and define formatting, conversion, validation, and localization rules before offering them.
5. **Dead Step2Eligibility variant:** the unreachable/legacy Step2Eligibility variant remains identified for product/engineering cleanup rather than activation by this visual migration.
6. **KRA market-specificity:** product, finance, and legal/compliance must verify Kenya tax type/rate/basis, copy, disclosures, receipts, and audit obligations for BetSlip's excise/withholding presentation before production/compliance claims.
7. **Parallel-suite flake:** the full serial suite exposed development-server `page.goto('/customer')` frame-detach/`ERR_ABORTED` failures under sustained execution; stabilize the test-server lifecycle before relying on parallel or long-run aggregate results.
8. **Light-mode scrim review:** design/product review is required for scrim/backdrop opacity and contrast in light mode across modal/tour overlays.
9. **CreatePromotionWizard 10-count verification:** completed in this ledger: all ten remaining inline declarations were rechecked and remain intentionally dynamic or modal/control-specific, not stray static presentation.
## Phase 5 — Style-JSX Elimination Ledger

Objective: migrate every remaining `<style jsx>` block into scoped sections of
`frontend/src/app/design-system.css` (contiguous Phase 5 region at file end, one
`/* Phase 5.x: <file> */` banner per surface). Root elements carry the scope class
alongside their original class (`.ds-<scope>.<root-class>` compound). Dynamic
`style={{...}}` expressions remain inline by policy.

| Turn | Surface | Scope class | Commit(s) |
|---|---|---|---|
| T1 (retro) | `admin/reports/loading.tsx`, `admin/predictions/promotions/loading.tsx` | `.ds-loading-state` (shared) | `2ea67b9` |
| 5.1 | `admin/crm/[id]/page.tsx` | `.ds-crm-detail` | `aeea716` |
| 5.2 | `admin/segments/create/page.tsx` | `.ds-segment-create` | `aeea716` |
| 5.3 | `components/layout/Header.tsx` | `.ds-app-header` | `380ce94` |
| 5.4 | `components/onboarding/ExplainerVideo.tsx` | `.ds-explainer-video` | `e731572` |
| 5.5 | `admin/predictions/churn/page.tsx` | `.ds-predict-churn` | `e731572` |
| 5.6 | `admin/predictions/promotions/page.tsx` | `.ds-predict-promotions` | `1c798c5` + fix `898d987` |
| 5.7 | `admin/predictions/responsible-gambling/page.tsx` | `.ds-predict-rg` | `d066106` |
| 5.8 | `admin/crm/page.tsx` | `.ds-crm-home` | `1c2a229` |
| 5.9 | `admin/reports/page.tsx` | `.ds-reports` | `4825d4f` |

**Retro-entry note (T1):** commit message for `2ea67b9` claimed a matrix update that
was not written at the time; this ledger row is that entry, recorded retroactively.

**Deliberate drops (no visual change):**
- 5.2: dead `:root { --color-betika-yellow }` declaration dropped (documented in CSS comment).
- 5.8: `:global(.crm-new*)` rules and `@keyframes spin` dropped as duplicates of existing
  design-system rules (`spin` = `ds-crm-players-spin`); markup keeps `.crm-new` class names.
- 5.6: static 89%/82% confidence-bar widths hoisted to `.conf-bar-89` / `.conf-bar-82`.
- 5.7: keyframe renamed page-unique (`ds-predict-rg-slide-in`); dynamic `.dot` inlines preserved.

**Incidents:**
- 5.6: blind append to design-system.css failed silently — page committed unstyled in
  `1c798c5`; section landed by hand-paste in `898d987`. Grep count on the scope class
  added to the standing verify ritual as a result.
- 5.7: agent falsely reported page-side edits complete (CSS landed, page untouched);
  caught by verify ritual, corrected in a follow-up task before commit.
- 5.9: scoped CSS accidentally pasted into `admin/crm/page.tsx` in addition to the
  stylesheet; caught immediately by build parse error, reverted via `git restore`
  (5.8 already committed, no loss).

**Permanent exclusion:** `admin/login/page.tsx` — under rebuild; sole expected
`style jsx` residual repo-wide.

**Closing gates (at `4825d4f`):** production build green (36/36 routes; 5 known
Recharts width(-1)/height(-1) prerender warnings, pre-existing); serialized Playwright
quartet (ui-ux-links, light-mode, governance-approvals, onboarding-tour, --workers=1)
34/34 passed; repo-wide `style jsx` grep returns login only; `git diff --check` clean.

**Deferred to manual janitorial:** Step3Test.tsx removal (dead usage; still imported at
`CreatePromotionWizard.tsx:12` — remove import first), Sidebar's 7 static inline styles.
**Deferred to Phase 6:** design-system.css module split, style-jsx enforcement guard,
full validation sweep, product decisions docket.