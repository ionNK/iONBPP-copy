# Platform repositories reconnaissance

**Date:** 2026-08-09
**Deliverable:** source-based feasibility report only; no UI adoption or dependency changes.

## 1. Decision summary

**Feasible, with integration and design gates.** The web-shell template supplies a Next.js/locale/provider foundation, not a finished admin shell. The component source supplies most form, table, overlay, and sidebar building blocks, but does not supply the promotion workflow. Retain the active iONBPP draft/domain model and light-surface rules; adapt shared primitives behind the existing application component contracts.

The installable UI package is **`@betikake/ui`**, published to GitHub Packages. Source presence is not proof of a working package import: six explicit type-export targets are missing in this checkout, and the template pins older UI/token versions than the inspected source. The correct stepper exports are **`FormStepper` and `FormStep`**, not `FormStepperStep`. The stepper is presentation only. `Button` automatically slots a single React-element child and has **no `asChild` prop**; `Badge` and `Chip` do have that prop.

Use the template's provider/locale wiring and the library's primitives after verifying versions, exports, token generation, and accessibility. Compose a separate iONBPP admin layout; do not expand the demo home layout into an admin product. No production-readiness or runtime-compatibility claim is made here.

## 2. Scope, provenance, and limitations

| Source | Absolute location | Audit role |
|---|---|---|
| Active iONBPP | `/Users/nanakwasisarpong/Desktop/iONBPP copy` | Current requirements, primitives, tokens, shell, wizard |
| Web-shell template | `/Users/nanakwasisarpong/Desktop/platform-web-shell-template` | Application foundation and configuration |
| Platform components | `/Users/nanakwasisarpong/Desktop/platform-frontend-components` | Packages, components, token CSS, icons |
| Sibling mapping | `/Users/nanakwasisarpong/Desktop/iONBPP/docs/component-library-mapping.md` | 36-row baseline and eight-gap list |

The mapping at `/Users/nanakwasisarpong/Desktop/iONBPP copy/docs/component-library-mapping.md` is absent (shown as deleted in the pre-existing working tree). The sibling mapping represents a different prototype state: glass panels, legacy CSS/theming, and components no longer present here. Its header says November 8, 2026, later than this environment date; that timestamp is not evidence of chronology or current scope. Its usage counts and migration estimates are **not carried forward**.

Current authority is `/Users/nanakwasisarpong/Desktop/iONBPP copy/docs/unity-design-system.md` plus `/Users/nanakwasisarpong/Desktop/iONBPP copy/docs/prototype-style-guide.md` and `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/theme/tokens.ts`. The canonical document currently contains color sections through Border; radius/type/spacing requirements below are evidenced by the style guide and adapter, not asserted to appear in that canonical excerpt.

Registry permissions are unavailable; no dependencies were installed. The platform directories have no installed root dependencies or built UI output, and no Git metadata was found at their roots. The active working tree has pre-existing modifications/deletions/untracked files. Preserve them. The only requested addition is this report. Evidence references [A]–[J] resolve to absolute files in section 12.

## 3. Web-shell foundation [A, B]

- **Routing/layout:** locale-segment App Router; static locale parameters come from `@betikake/web-intl` settings. The locale page renders a minimal `HomeModule`; `HomeLayout` houses language/theme controls, not admin navigation.
- **Providers:** `RootProvidersServer` passes server state into local `AppRootProvidersClient`, which wraps `RootProvidersClient`. Server/client refresh callbacks use `getRefreshSession`; the server login path is locale-aware. A header-derived CSP nonce is forwarded. Inter/Oswald font variables are loaded.
- **Boundaries:** this verifies wiring, not unpublished provider internals. React Query, Apollo, auth, and theme dependencies are declared; actual provider behavior, authorization, and refresh failure handling require runtime/package inspection. These call sites do not supply iONBPP RBAC, a maker-checker backend, or audit persistence.
- **Proxy/config:** the proxy combines GraphQL and i18n middleware with API/static exclusions. Next config widens file tracing to the parent for local symlinks unless `BUILD_CONTEXT` is `vercel` or `github`. Verify deployment tracing when moving routes; the inspected config does not declare the README's `transpilePackages` setting.
- **CSS:** global CSS imports tokens through an explicit `node_modules` path and scans application and `@betikake` TypeScript sources. This assumes compatible installation and package-source layouts; Yarn version alone does not establish them.
- **Locale/theme:** language switching replaces the leading locale segment and preserves search parameters (no explicit hash-preservation contract). Theme switching uses `next-themes`. Do not carry a dark-mode control into the light admin experience without approval.

### Version/configuration gate [A, C, D, G]

| Concern | Template | Component source / active frontend | Consequence |
|---|---|---|---|
| Next.js | 16.2.9; README says 15 | Active frontend 16.1.6 | README is not an upgrade authority |
| Package manager | `yarn@4.10.3`; README describes Classic/v1 | Library Yarn 4 workspace; active frontend has npm lockfile | Choose installation/linker/lockfile strategy explicitly |
| UI | 0.48.0 | Source 0.55.2 | Verify APIs against the selected release |
| Tokens | 0.7.0 | Source 0.8.1 | CSS roles/entrypoints may differ |
| React | 19.2.7 | UI peer `^19.2.1`; active 19.2.3 | Declared compatibility is not a build result |
| lucide-react | 0.575.0 | UI 0.556.0; active `^1.40.0` | Check resolution; preserve lucide-only app convention |

UI peers also include Next >=16.0.10, next-themes ^0.4.6, and zod ^4.3.6. The active frontend does not declare Tailwind, Radix, or `@betikake/ui`; adoption is not a zero-dependency swap. Template dev/build run locale synchronization, and build writes app-version environment data. These scripts require platform configuration, not just a Next installation.


## 4. Component API and distribution findings [C, E]

The source is a React 19/TypeScript component library using Tailwind utilities, CVA, Radix primitives, and some custom implementations. Use **verified package subpaths**, not copied component source or undocumented deep imports. These observations apply to source 0.55.2, not automatically to template pin 0.48.0.

### Export risks

| Declared type-export key | Missing declared target | Source observation |
|---|---|---|
| `.` | `./src/index.ts` | Component barrel exists separately; root target is absent |
| `./chip` | `./src/components/chip/index.ts` | Actual barrel is `index.tsx` |
| `./avatar` | `./src/components/avatar/index.ts` | Actual barrel is `index.tsx` |
| `./sidebar` | `./src/components/sidebar/index.ts` | Actual barrel is `index.tsx` |
| `./menu` | `./src/components/menu/index.ts` | Actual barrel is `index.tsx` |
| `./drawer` | `./src/components/drawer/index.ts` | Actual barrel is `index.tsx` |

These are six **explicit type-target mismatches in this checkout**, not a claim that a published artifact has been tested and fails. Runtime exports point to unbuilt `dist` files. The component barrel also omits Chip; Calendar (directory spelling `calander`) and Popover source are not public component subpath exports. A Storybook demo, dependency, or source directory does not establish a supported import. Verify the released tarball and consumer TypeScript resolution before adoption.

### Behavioral details that affect migration

- **Button:** `default`, `secondary`, `destructive`, `outline`, `ghost`, and `link`; sizes `default`, `xs`, `sm`, `lg`, `icon`; `loading` passes `disabled` to the rendered target (effective native disabling depends on that target). A single React element automatically becomes the slotted element. A lone icon, span, or div can therefore replace the native button. Do not pass `asChild`, and do not assume `disabled` prevents navigation on a slotted anchor. The template theme switcher's single div child warrants a rendered-semantics check. Preserve native keyboard/button behavior in an adapter; handle loading and accessible names explicitly.
- **Chip:** defaults to a span, supports `asChild`, and styles `data-state="checked"`. It supplies neither state management nor radio/toggle-group semantics. For an interactive filter, slot a real button and provide application-controlled selection and accessible state; avoid nesting dismiss buttons inside another button.
- **FormStepper / FormStep:** the parent numbers direct children and inserts connectors. `FormStep` accepts `isSuccess`, `isActive`, `stepNumber`, children, and className. No navigation, validation, persistence, disabled-step policy, arbitrary DOM-prop forwarding, or ordered-list/current-step semantics are supplied. Success is an outlined circle/check; active is an inner dot, not the active wizard's filled numbered circle. Class overrides alone may not restore the required markup.
- **Badge / Card / Separator:** Badge default is success, not brand-primary; Card is an opaque, padded, shadowed container, not a selection control. Separator is a custom div (optionally labeled), not the declared Radix Separator dependency; use menu-specific separators within menus and preserve meaningful separator semantics where required.
- **Public gaps:** Radix radio/toggle/progress dependencies and token roles exist without corresponding public UI components. Button's internal spinner is not a public UI LoadingState. Library icons include non-lucide assets; application icon policy remains lucide-react only, with bundled icon usage an explicit adoption review item.

## 5. Reconciled 36-row mapping [C, E, F, G, H, I, J]

This preserves the sibling baseline's 36 row subjects, **not its current-usage claims**. Direct = functional primitive match with adapter/token work still required; Partial = meaningful behavior, markup, visual, or accessibility work; No equivalent = no public primitive for the responsibility. Every adoption remains subject to section 4's distribution gate. Legacy class names identify baseline rows, not new implementation instructions.

| # | Baseline primitive / responsibility | Shared candidate | Assessment | Source-based reconciliation |
|---|---|---|---|---|
| 1 | Primary/secondary/cancel/action buttons | `Button` | Direct | Map yellow primary to default, navy secondary to secondary, bordered cancel to outline. Adapt events, sizes, pressed colors, and implicit slotting; not a class-only swap. |
| 2 | Icon buttons | `Button` ghost/icon | Partial | `size-4` is only 16px under the usual utility scale. Supply an approved hit area, accessible name, and native button semantics; no ghost-destructive combination. |
| 3 | Yellow-outline header CTA | `Button` outline | Partial | No built-in yellow inversion. Legacy styling is not active shell policy; current primary CTA is the sanctioned yellow button. |
| 4 | Glass panel | `Card` | Partial | Card is opaque with padding/shadow. Do not recreate legacy glass: active white/light surfaces take precedence. |
| 5 | Panel / card | Card slots | Direct | Header/title/description/content/footer cover structure; reconcile fixed padding, radius, shadow, headings, and busy announcements. |
| 6 | Status/type badges | `Badge` | Partial | Success/destructive/neutral are available; active `color`, `ghost`, `textColor` contract and scheduled/draft/warning statuses need an adapter. Default means success. |
| 7 | Chips / filter chips | `Chip` | Partial | Checked data-state is visual only. `asChild` enables a real button; application supplies selected/pressed state and dismissal semantics. |
| 8 | Pills / pill selectors / day circles | No grouped control | No equivalent | Chip is only a visual building block; it does not supply mutually exclusive or multi-toggle keyboard/state semantics. |
| 9 | Choice cards | No selectable card | No equivalent | Card lacks selection, focus, disabled, and group behavior. Retain current choice interactions pending an approved shared design. |
| 10 | Icon/label option cards | No selectable card | No equivalent | Same shared gap as row 9; one candidate can cover both patterns rather than two parallel implementations. |
| 11 | Text/number/password input | `Input` + `FormFieldBottomLabel` | Direct | Prefix/suffix, label and error support exist. Preserve controlled values, currency strings, ids, helper/error association, and native input attributes. |
| 12 | Textarea | `Textarea` | Direct | Map controlled value and invalid state; verify helper association, minimum height, and resizing. |
| 13 | Native select | `Select` slots | Partial | Native options become Radix trigger/content/items; onChange becomes onValueChange. Re-test keyboard, empty values, mobile, and portal stacking. |
| 14 | Checkbox | `Checkbox` | Direct | Adapt checked/onCheckedChange and label/error association; handle indeterminate values deliberately. |
| 15 | Radio | No public RadioGroup | No equivalent | Radix dependency is not an exported UI radio control. Preserve native radio semantics until a shared control is approved. |
| 16 | Switch | `Switch` | Direct | Active `Toggle` already has checked/boolean callback and disabled contract. Adapt callback name; preserve accessible label and mandatory-rule lock. |
| 17 | Underline tabs | `Tabs` line variant | Direct | Controlled value/onValueChange plus triggers/content replace manual state and markup. Re-test focus and mounted-panel state. |
| 18 | Tables | `Table` slots | Direct | Structural table/overflow primitives, not a data-grid engine. Sorting, filtering, row navigation, and pagination state remain application-owned. |
| 19 | Modal overlays | `Dialog` | Partial | Adds portal/focus trap/scroll lock/Escape and outside-click behavior. Re-test confirmation and wizard flows; do not silently alter maker-checker behavior. |
| 20 | Action menus and menu dividers | `DropdownMenu` and its separator/group slots | Direct | Popper positioning and menu keyboard behavior replace hand-positioned menus. Preserve destructive confirmation and item labels; use menu-specific grouping/separator semantics. |
| 21 | Avatar initials | `Avatar` | Direct | Fallback covers initials and sizing. Keep user identity only in the top bar per the active shell. |
| 22 | Wizard stepper | `FormStepper` + `FormStep` | Partial | Visual progress can be reused; retain `PromotionDraft`, local persistence, validation, navigation, and current-step semantics in the wizard controller. |
| 23 | Dividers / OR rules | `Separator` | Direct | Labeled separator covers OR; preserve decorative vs meaningful semantics and spacing. |
| 24 | Spinner loading state | `Skeleton` or retained local state | Partial | Skeleton is not a spinner and changes UX. No public LoadingState exists; retain current loading affordance until an approved replacement exists. |
| 25 | Skeletons | `Skeleton` | Direct | Additive adoption for loading regions; establish dimensions and accessible busy/status behavior at the consuming route. |
| 26 | Persistent notices | No public Alert/Notice | No equivalent | Toast is transient, ErrorComponent is error-oriented, and field labels are local. Keep the active inline notice pattern or add a shared primitive first. |
| 27 | Empty state | `ErrorComponent` nearest | Partial | The structure is reusable, but error semantics are wrong for zero-data screens. Prefer an EmptyState gap addition or preserve local empty state. |
| 28 | Pagination | `Pagination` | Direct | Candidate covers controls; page count, query state, disabled edges, and data fetching remain application-owned. |
| 29 | Search and clear | `SearchInput` | Partial | Supports controlled values, Enter search, and clear controls, but Escape calls onClear without onChange; click-clear then calls onChange with the input before a confirmed DOM update. Clearing consumer state via onClear alone may be overwritten by that later event. An adapter must distinguish or suppress the synthetic clear event, or the shared implementation must be fixed; test click and Escape paths and retain the accessible search label. |
| 30 | Display/heading/body/caption type | `Typography` | Partial | Roles align, but platform sizes include values outside the active admin 20/15/14/12 scale. Use `T`/style-guide-approved consumer classes, not automatic typography defaults. |
| 31 | Page shell | Sidebar/layout composition | Partial | Shared layout is a sidebar shell with collapse/mobile behavior; current admin main offset, 1280px content boundary, and light surface require consumer composition. |
| 32 | Admin Sidebar/Header/AppShell | Sidebar family + local top bar | Partial | Sidebar provides provider, collapse, mobile Sheet, groups, menu buttons, and cookie writes (consumer-owned restoration). It does not provide the iONBPP brand/market/user top bar or flat nav policy; preserve those mount points. |
| 33 | Flags and icons | `@betikake/icons` / library icons | Partial | Shared icons are not the active app's lucide-only policy and flag coverage needs audit. Keep `lucide-react` and the local Zambia flag unless explicitly approved. |
| 34 | Native title tooltips | `Tooltip` | Partial | Optional polish, not a behavior-preserving replacement. Check portal/focus behavior and touch affordance. |
| 35 | Theme/CSS override layer | Platform token CSS + active `T` | No equivalent | Do not merge the old dual-axis/theme-family cascade. Reconcile token aliases and generated CSS with the light-surface adapter before any broad migration. |
| 36 | Domain components: MatchCard, BetSlipWidget, SegmentBuilder, FieldPicker, Player360, charts, OnboardingTour, GlobalAssistantWidget | None by design | No equivalent | Preserve this baseline responsibility, not its legacy inventory as active scope. Product workflows, data models, charts, and assistants remain application-owned compositions of primitives, not additional shared-library gap categories. |

## 6. Eight shared-library gaps

These are the active gap categories, consolidated from the sibling baseline and verified against the inspected public component barrel/source. The first seven are functional coverage gaps; the eighth is conditional visual scope.

1. **ChoiceCard / selectable card:** selected, hover, disabled, focus, and group semantics for promotion choices. Do not use Card or Chip as a semantic substitute.
2. **Persistent inline Alert/Notice/Banner:** four-severity, non-transient notices used inside pages. Toast, ErrorComponent, and field feedback do not cover this contract.
3. **Radio / RadioGroup:** the package has Radix radio as a dependency but no public radio component export in the inspected barrel.
4. **ToggleGroup / segmented control:** grouped `aria-pressed` or single-select behavior for pill/day controls. A lone Chip does not provide roving focus or group semantics.
5. **EmptyState:** icon/title/body/action for no-data states without error semantics.
6. **Public Spinner / LoadingState:** route-level spinner/announcement contract. Button's internal loader is not a reusable exported primitive; Skeleton is an intentional UX alternative, not an equivalent.
7. **Progress:** determinate progress bar/meter for budget/simulator/rules progress. Token roles/dependencies exist, but no public Progress component is exported.
8. **Elevated/glass Card variant (conditional):** only add if the design team confirms that legacy glassmorphism remains a shared product requirement. The active admin prototype explicitly uses light surfaces; do not resurrect glass by default.

Do not add these primitives inside the active page. If a shared primitive is approved, add it under `frontend/src/components/ui/` for the active application only when its API is documented in the style guide; for platform-library work, add it to the platform package with export/build tests and versioned release notes.

## 7. Token and style reconciliation [C, F, G, H]

The active prototype is not a direct consumer of the platform token theme. It is a light-surface adaptation: white cards and an `offWhite` canvas, navy foregrounds, black-based opacity borders, and the `T` adapter. The older sibling mapping's glassmorphism and dual-axis `data-theme-family` strategy must not be treated as current requirements.

| Active requirement | Local authority | Platform observation | Adoption rule |
|---|---|---|---|
| Page/card surfaces | `T.offWhite`, `T.white`; style guide white shell | Platform semantic background/card roles are generated theme tokens and Card is opaque | Keep light consumer surfaces; map platform roles only after rendered color comparison |
| Navy/yellow actions | `T.navy`, `T.navyDeep`, `T.yellow`, `T.yellowActive` | Button semantic roles exist, but defaults/hover gradients come from platform CSS | Use a thin adapter/approved classes; do not hardcode hex in page code or force platform gradients into the prototype |
| Text and borders | `T.textPrimary`, `T.textSecondary`, `T.border`, `T.ghostBorder` | Platform variables include navy and black opacity ramps | Map semantic roles to local `T` values and document any alias; no inline hex/rgba |
| Success/destructive | `T.success`, `T.destructive`, `T.progressActive` | Platform separates green 600, green 400, red 600/500 and progress roles | Preserve local distinction: dark-UI success for statuses versus light-UI progress green |
| Radius | `radiusXs=4`, `radiusSm=8`, `radiusMd=14`, pill | Platform radii resolve to 4/8/14/20/full | `radius-lg` is 20 and is not an automatic local `radiusMd` replacement |
| Typography | active scale 20/15/14/12; Inter in admin | Platform includes display/heading/body scales and Oswald heading defaults | Set page-level admin type explicitly; never introduce 13px or inherit large display defaults accidentally |
| Spacing | local Unity spacer scale: 0,1,2,4,8,12,14,16,18,20,24,32,48,60,80,120 | Tailwind/platform utilities expose a broader generated scale | Use only approved local spacer values in active pages; verify equivalent utility output |
| Icons | `lucide-react`, 12–20px | UI source also imports `@betikake/icons` | Keep lucide in iONBPP; no icon-package substitution without audit |

### Active primitive equivalents

- `PrimaryButton`, `SecondaryButton`, `GhostButton`, and `DestructiveGhostButton` already encode the admin contract through `T`; platform Button adoption should happen behind these contracts, not by changing pages one at a time.
- `Badge`, `StatChip`, `Toggle`, `FilterSelect`, and `EvidenceCard` are active local primitives. Their documented APIs are domain-shaped (`color`, numeric stat, `checked`, options, evidence metadata); replacing them with generic platform components requires an adapter or consumer rewrites.
- `FilterSelect` is a hand-built popover and currently contains an inline SVG chevron despite the style guide's lucide-only rule. This is a local compliance issue to fix separately; it is not evidence that the platform icon package should be adopted.
- The current wizard imports local primitives, `T`, and lucide icons. It persists one `PromotionDraft` in local storage, validates per step, confirms submit/discard, and maps submission to a pending approval row. Shared primitives must not own or replace that controller.

## 8. Wizard feasibility

**Feasible as a composition, not as a replacement.** Keep the current wizard route/controller, `PromotionDraft`, local-storage restore/persist behavior, `validateStep`, template application, banner/T&C file handling, `saveDraft`, confirm-before-submit, and router transitions. These are domain behaviors absent from the shared library.

Use `FormStepper` + `FormStep` only if its visual state can be reconciled with the active design: completed `isSuccess`, current `isActive`, and upcoming default. The current wizard renders an ordered progress list with `aria-label`, `aria-current="step"`, filled navy current circle, green completed circle/check, labels, and lines. The shared stepper renders a generic div, uses a five-unit circle, an active inner dot, and no navigation or current-step ARIA. Therefore:

1. Keep an accessible application-owned progress wrapper/controller.
2. Render the shared stepper only as the visual child if its generated markup meets the approved screenshot and semantics.
3. Preserve `STEPS`, current index, validation, and transitions in the route.
4. Re-test compact widths, long labels, screen-reader announcements, keyboard focus, reload persistence, and modal confirmation focus restoration.

The eight-step wizard can use the library's input, textarea, select, checkbox, switch, Card, Dialog, and separator pieces incrementally. Radio, choice cards, persistent notices, public progress, and route loading remain blocked or local according to section 6.

## 9. Admin-shell feasibility [B, E, G, I]

**Feasible through composition; neither repository supplies the finished iONBPP admin shell.** Reuse template routing/providers/session wiring and verified Sidebar primitives, while preserving the active top bar and light-surface layout.

| Requirement | Available foundation | Application work / constraint |
|---|---|---|
| White global bar, wordmark, Zambia flag, avatar/role menu | Local TopBar; shared Avatar and DropdownMenu candidates | Current identity/role and menu are prototype stubs. Wire actual session/logout/permissions; do not move identity into sidebar footer |
| Flat grouped navigation with search | SidebarProvider, SidebarInput, groups, menu buttons | Retain Engage/Insights/CRM groups, application filtering, route matching, accessible nav landmark and Soon states. Do not introduce expandable nav modules |
| Route-aware links | SidebarMenuButton supports `asChild`, `isActive` | Slot Next Link; supply `aria-current`, locale-aware hrefs and an explicit parent/child active-route policy. Current Sidebar uses exact pathname equality |
| Sidebar width and global-bar offset | CSS width variables and layout slots | Match approximately 240px sidebar and top-bar geometry. Shared desktop sidebar is fixed from viewport top; it will overlap the global bar unless adapted |
| Small-screen navigation | Offcanvas/mobile Sheet, trigger, separate mobile state | Choose and test mobile behavior; `collapsible="none"` returns before the mobile Sheet branch. Flat nav and responsive shell are separate concerns |
| Collapse state | Controlled/uncontrolled provider, cookie write, keyboard shortcut | Cookie is written, not restored by provider itself. Consumer must hydrate desired initial state. Review shortcut and persistence rather than assuming they are admin requirements |
| Content and queues | Sidebar layout slots, Card, Table, Pagination, Tabs | Keep offWhite canvas, centered 1280px content, sanctioned stat filters, two-line table cells, explicit row action, and empty state |
| Details and confirmations | Sheet/Dialog/Drawer primitives | Preserve 520px right-detail pattern, scrim, scroll/focus behavior, and confirm-before-commit. Confirm exported Drawer entrypoint before use |
| Authorization and approval workflow | Template provider/session call sites only | Server-side permissions, maker/checker separation, approval transitions, audit log and API enforcement remain product/backend work |

The active admin layout renders TopBar, Sidebar, and main for all children; the login page overlays that shell. When porting to locale routing, design a deliberate login/authenticated-layout boundary rather than carrying the overlay assumption into production. A locale-aware login path in RootProvidersServer does not prove that a matching route or access policy exists.

Shared Sidebar's optional rail, nested/collapsible menus, and footer are capabilities, not required features. `SidebarMenuBadge` defaults to count-style status labels; a static Soon pill needs deliberate semantics, not the default “Soon items” announcement. Keep global-bar identity exclusive and omit nav chevrons/accent indicators. Navbar is optional layout source, not an iONBPP shell or authorization system.

## 10. Adoption gates and sequence

| Gate | Owner / evidence needed | Exit condition |
|---|---|---|
| Distribution | Platform maintainer | Select compatible UI/token versions; verify published exports, source/type targets, build output, registry access and consumer imports, including Sidebar/Chip |
| Styling | Design-system and frontend owners | Approve semantic token bridge, Inter 20/15/14/12 typography, spacer scale, light portals/surfaces, button sizes/states, icons, and stepper visual/ARIA strategy |
| Foundation | Platform/application owners | Confirm locale/login routes, provider behavior, refresh failures, CSP, environment configuration, tracing and CSS source scanning in deployment |
| Shared gaps | Component-library owner + design | Approve reusable APIs and accessible behavior; retain local patterns until released. Glass remains deferred, not a launch blocker |
| Product behavior | iONBPP owner | Preserve draft/controller behavior; specify server validation, uploads, permissions, maker-checker and audit contracts separately from primitive adoption |
| Regression | Frontend/QA | Consumer typecheck/build, component tests, keyboard/screen-reader review, mobile and visual regressions pass against selected versions |

Recommended order: (1) resolve distribution and token bridge; (2) prove a small input/button/badge/card integration behind existing local contracts; (3) address shared gaps in parallel; (4) migrate wizard fields without replacing its controller; (5) adopt accessible progress/overlays after visual review; (6) compose and test the locale-aware admin shell last. Do not import the sibling report's old file counts or broad migration estimates.

No dependency installation, application rewrite, component proposal approval, commit, or push is part of this report.

## 11. Unresolved questions and validation boundary

- **Release choice:** which supported UI/token pair should iONBPP consume, and do its published files resolve all declared type/runtime exports? Who owns fixing the checkout mismatches and providing registry access?
- **Integration direction:** should the existing application adopt verified template wiring incrementally, or should its domain routes move into a new template-based application? This report recommends staged reuse, not a framework upgrade or wholesale move.
- **Design approval:** who approves the light token bridge, bundled non-lucide icons, stepper markup/states, and mobile navigation? Is a glass Card still needed by another product? It is not an active iONBPP requirement.
- **Platform contracts:** what are the supported locale list, login/logout routes, session-expiry behavior, environment variables, CSP policy, and deployment/package-linker configuration? Provider imports alone do not answer these.
- **Product/backend contracts:** which service enforces permissions, maker/checker separation, approval transitions, audit records, validation, durable drafts, and actual file uploads? Local-storage persistence and a pending mock row are not these services.

Validation for this deliverable is source/document inspection: reconcile all 36 baseline subjects, keep exactly eight gap categories, verify explicit export targets and version declarations, resolve the absolute references below, and inspect repository changes. Runtime rendering, accessibility behavior, package consumer typechecking/builds, and tests remain unverified because the required platform dependencies/build artifacts and registry access are unavailable. No installation was attempted as part of completing this report. Published-package compatibility must be validated separately against the selected release.

## 12. Source references

References identify this machine's inspected files, not stable remote permalinks or proof of a published release. Platform checkout revision IDs are unavailable because their roots have no Git metadata. [A]–[J] group related evidence; paths below are absolute.

### [A] Template configuration and declared versions

- `/Users/nanakwasisarpong/Desktop/platform-web-shell-template/package.json`
- `/Users/nanakwasisarpong/Desktop/platform-web-shell-template/README.md`
- `/Users/nanakwasisarpong/Desktop/platform-web-shell-template/next.config.mjs`
- `/Users/nanakwasisarpong/Desktop/platform-web-shell-template/src/proxy.ts`
- `/Users/nanakwasisarpong/Desktop/platform-web-shell-template/src/styles/global.css`
- `/Users/nanakwasisarpong/Desktop/platform-web-shell-template/scripts/write-app-version-env.mjs`

### [B] Template routing, provider and demo boundaries

- `/Users/nanakwasisarpong/Desktop/platform-web-shell-template/src/app/[lng]/layout.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-web-shell-template/src/app/[lng]/page.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-web-shell-template/src/components/app-root-providers-client.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-web-shell-template/src/components/language-switcher.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-web-shell-template/src/components/theme-switcher.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-web-shell-template/src/layouts/home-layout/home-layout.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-web-shell-template/src/modules/home-module/home-module.tsx`

### [C] UI distribution and public inventory

- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/package.json`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/tsconfig.build.json`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/index.ts`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/form-stepper/index.ts`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/chip/index.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/avatar/index.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/sidebar/index.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/menu/index.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/drawer/index.tsx`

### [D] Component workspace and token package

- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/package.json`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/tokens/package.json`

### [E] API/markup and Sidebar evidence

- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/button/button.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/chip/chip.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/badge/badge.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/card/card.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/form-stepper/form-stepper.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/separator/separator.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/search-input/search-input.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/pagination/pagination.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/sidebar/context/context.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/sidebar/root/root.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/sidebar/menu/menu.tsx`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/ui/src/components/sidebar/layout/layout.tsx`

### [F] Platform token definitions and generated utility roles

- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/tokens/src/css/globals.css`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/tokens/src/css/variables.css`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/tokens/src/css/theme-colors.css`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/tokens/src/css/theme-radii.css`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/tokens/src/css/theme-typography.css`
- `/Users/nanakwasisarpong/Desktop/platform-frontend-components/packages/tokens/src/css/base.css`

### [G] Active requirements, tokens and dependencies

- `/Users/nanakwasisarpong/Desktop/iONBPP copy/docs/unity-design-system.md`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/docs/prototype-style-guide.md`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/theme/tokens.ts`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/package.json`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/app/design-system.css`

### [H] Active UI contracts

- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/components/ui/index.ts`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/components/ui/PrimaryButton.tsx`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/components/ui/SecondaryButton.tsx`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/components/ui/GhostButton.tsx`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/components/ui/DestructiveGhostButton.tsx`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/components/ui/Badge.tsx`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/components/ui/StatChip.tsx`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/components/ui/FilterSelect.tsx`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/components/ui/Toggle.tsx`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/components/ui/EvidenceCard.tsx`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/components/ui/ZambiaFlag.tsx`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/components/ui/ui.css`

### [I] Active shell, wizard and local persistence

- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/app/admin/layout.tsx`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/app/admin/login/page.tsx`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/components/layout/TopBar.tsx`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/components/layout/Sidebar.tsx`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/app/admin/promotions/new/page.tsx`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/app/admin/promotions/new/draft.ts`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/app/admin/promotions/new/qualification.ts`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/app/admin/promotions/new/Step1Basics.tsx`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/app/admin/promotions/new/Step2Qualification.tsx`
- `/Users/nanakwasisarpong/Desktop/iONBPP copy/frontend/src/lib/promotions.ts`

### [J] Legacy baseline (comparison only)

- `/Users/nanakwasisarpong/Desktop/iONBPP/docs/component-library-mapping.md` — section 5 mapping subjects and section 6 gap categories; not the active prototype's visual or usage authority.
