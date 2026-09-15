# Legacy Step 1 Basics: functional specification

## Scope and source status

This report documents `frontend/src/components/wizard/steps/Step1Basics.tsx` as stored in the local repository's Git `HEAD` object database. The component is deleted from the working tree, so it was read with local, read-only commands such as `git show HEAD:<path>`; it was not restored and no remote service was contacted.

At `HEAD`, `CreatePromotionWizard` renders this component at wizard step 1. The component's exported function is named `StepBasics`, but the parent imports it as `Step1Basics`. It accepts no props. It reads the complete wizard `state`, `fieldErrors`, and context mutations through `useWizardContext()`.

This specification is functional only: it intentionally excludes CSS, layout, icons, class names, and visual styling.

## 1. Inputs and controls, top to bottom

### 1. Saved-template picker — conditionally present

- **Trigger label:** `Use a saved template` when collapsed; `Hide saved templates` when expanded.
- **Control:** button that toggles an expandable region labelled `Saved promotion templates`.
- **Options:** one button per current `templates` entry, in the order returned by `useTemplates()`. Each option shows the template `name`; `description` only when nonempty; and `basedOnType` with underscores replaced by spaces, followed by ` · <market>` only when `market` is nonempty.
- **Default:** collapsed (`showTemplates: false`), no selected template (`selectedTemplateId: null`).
- **Required/validation:** optional; no validation.
- **Availability:** rendered only when `features.promoTemplatesLegacy` is `true` **and** `templates.length > 0`. The `HEAD` default for this flag is `false`, so this picker is hidden by default.
- **Selection behavior:** selecting a template stores its ID in local component state and calls `loadPromotion(tpl.payload)`. This replaces the **entire** wizard state—not just Step 1 fields—with the saved `WizardState` snapshot. The picker remains open; no navigation occurs.
- **Switching after edits:** there is no dirty-state detection, confirmation, merge, or preservation of edits. Selecting any template after any edits immediately replaces all those edits with the newly selected template's complete payload. Editing fields after selection does not clear `selectedTemplateId`, so the selected visual state can remain even when the draft no longer equals that template.

### 2. `Promotion Name`

- **Control:** single-line text input.
- **Placeholder:** `e.g. Welcome Bonus 2024`.
- **Options:** free text; no length, character, uniqueness, or trim-on-write restriction.
- **Default:** `''`.
- **Required:** yes, validated when the parent tries to continue from step 1.
- **Draft behavior:** every keystroke writes the raw string to `basics.name` via `updateBasics({ name })`.
- **Validation:** a missing value or a whitespace-only value causes `Please enter a promotion name.` The raw whitespace remains in the draft; validation uses `name.trim()`. When an existing `name` error is present, the first subsequent input change removes that field error immediately.

### 3. `Description (Internal)`

- **Control:** multi-line textarea (`rows={3}`).
- **Placeholder:** `Description for internal team...`.
- **Options:** free text.
- **Default:** `''`.
- **Required/validation:** optional; no validation and no inline error clearing behavior because no error is created for it.
- **Draft behavior:** every change writes the raw string to `basics.description` via `updateBasics({ description })`.

### 4. `Promotion Type`

This section consists of a search field followed by a single-choice card catalog.

#### Search field

- **Control:** single-line text filter.
- **Placeholder:** `Search promotion types...`.
- **Default:** `''` (all types visible).
- **Required/validation:** the search value itself is optional and is not persisted or validated.
- **Behavior:** trims and lowercases the query for matching against both type label and description. It only filters the displayed catalog; it never changes `basics.type` or clears an existing selection.

#### Type choices

- **Control:** one-of-many clickable card selection; the selected card reflects `basics.type`.
- **Default:** `''` (none selected).
- **Required:** yes, validated on Continue.
- **Validation:** an empty type causes `Please select a promotion type.` The code does not clear that error when a type is selected; the parent replaces field errors only on the next validation attempt.
- **Ordering:** the first eight IDs below are always sorted first, in this order: `welcome_bonus`, `deposit_match`, `bet_get`, `free_bets`, `aviator_free_rounds`, `cashback`, `acca_insurance`, `manual_bulk`. Remaining entries preserve the static array order. Filtering occurs before this sorting.
- **Options (verbatim label — stored ID — verbatim description):**

| Label | Stored ID | Description |
| --- | --- | --- |
| Welcome Bonus | `welcome_bonus` | Acquire & activate new customers. |
| Deposit Match Bonuses | `deposit_match` | Match a percentage of a deposit. |
| Bet & Get | `bet_get` | Place a bet, get a free bet or bonus. |
| Free Bets | `free_bets` | Issue free bets to qualifying customers. |
| Aviator Free Rounds | `aviator_free_rounds` | Drop free rounds to active Aviator players. |
| Cashback | `cashback` | Return part of losses or stake as bonus. |
| Stakeback / Acca Insurance | `acca_insurance` | Refunds an acca when one leg fails. |
| Manual / Bulk Awards | `manual_bulk` | Grant goodwill, VIP or correction rewards. |
| Multiple Bonus | `multiple_bonus` | Bonus for qualifying multiple/acca bets. |
| Odds Boosts | `odds_boosts` | Boost odds on selected bets or markets. |
| Enhanced Odds | `enhanced_odds` | Improved odds on selected markets. |
| Bet Streaks | `bet_streaks` | Reward consecutive qualifying bets. |
| Reload Bonuses | `reload_bonus` | Bonus on a repeat deposit. |
| Tournament-Specific | `tournament` | Offers tied to a tournament or competition. |
| Event-Based | `event_based` | Rewards linked to specific events. |
| Personalised / Targeted | `personalised` | Offers tailored to segments or individuals. |
| Reactivation Offers | `reactivation` | Win back inactive or lapsed customers. |
| Leaderboards | `leaderboards` | Ranked competition on points or stakes. |
| Referral Bonuses | `referral` | Reward customers who refer new players. |
| Birthday Bonuses | `birthday` | Reward customers on their birthday. |
| Live Betting | `live_betting` | Rewards for in-play betting activity. |
| Price Boost Happy Hours | `happy_hour` | Boosted pricing in a time window. |
| Combo / Bet Builder | `bet_builder` | Offers for combo or bet builder bets. |
| Insurance (Markets/Events) | `insurance` | Insurance on defined markets or events. |
| Retention / Churn Prevention | `retention` | Bonuses to reduce churn risk. |
| Channel-Specific | `channel_specific` | Offers restricted to a specific channel. |

- **Draft behavior:** clicking a card immediately writes its ID through `updateBasics({ type: t.id })`. No other field is changed, and it does not apply a saved template or fill rewards/eligibility.

### Template metadata summary — conditionally present, not an input

Directly below the type catalog, a read-only `Template details` region appears only when `getTemplateMeta(basics.type)` returns metadata. It is not controlled by `promoTemplatesLegacy`.

At `HEAD`, metadata exists for these eight selected IDs: `welcome_bonus`, `deposit_match`, `bet_get`, `free_bets`, `aviator_free_rounds`, `cashback`, `acca_insurance`, and `manual_bulk`. The region shows the selected metadata's `Purpose`, `Trigger`, `Allowed rewards`, and `Customer journey`. Selecting any other catalog type does not show it and does not generate an error.

## 2. Step-1 Continue validation and wizard navigation

The parent owns the `Next Step` button and invokes `validateStep(currentStep)` before incrementing the step. For step 1 it:

1. requires `state.basics.name` to be nonempty after trimming;
2. requires `state.basics.type` to be nonempty;
3. stores errors in context as `{ name?: string, type?: string }`;
4. blocks navigation when one or both errors exist; and
5. displays one summary error: `Please fix the highlighted field to continue.` for one error, or `Please fix <count> highlighted fields to continue.` for two.

`Description (Internal)`, a saved-template selection, and the search query do not affect Continue validation. The parent does not validate that a type is known to `promotionTemplates.ts`; any nonempty static or externally loaded string is sufficient at step 1.

## 3. Template selection and prefill

### Saved-template source and listing

The Step 1 saved-template picker obtains `templates` from `TemplatesContext`; it has no direct API request.

- **Storage key:** `saved_templates` in browser `localStorage`.
- **Hydration:** client-side on provider mount, and refreshed for browser `storage` events.
- **List construction:** successfully parsed locally saved templates first, followed by built-in `SEED_TEMPLATES` whose IDs do not duplicate locally saved IDs. Locally saved entries therefore override same-ID seeds. If parsing fails, saved entries are discarded and seeds remain available.
- **Operator-created entries:** the parent’s separately flag-gated `Save as Template` action saves a complete current `WizardState` snapshot using `saveTemplate`. It assigns `tpl_<Date.now()>`, trims name/description, uppercases supplied market, timestamps creation/update, prepends it to the in-memory list, and serializes the complete list to `saved_templates`.
- **Seed entries:** built at module load from a static base `WizardState` plus deep section-specific overrides; their fixed timestamp is `2026-02-01T00:00:00.000Z`. They are static source data, not a network/API response.

### What a selected saved template pre-fills

Selecting any saved template passes its `payload` verbatim to `loadPromotion`, which sets the complete wizard draft exactly to that payload. Thus it can prefill `basics`, `eligibility`, `rewards`, `schedule`, and `display`, including nested fields and data not shown in Step 1. There is no type-specific, partial, or per-field mapping in Step 1.

All built-in seed snapshots start from these common base values unless overridden:

- `basics`: empty name, description, and type;
- eligibility: `markets: ['KE']`, `primaryMarket: 'KE'`, `channels: ['desktop', 'mobile']`, empty segment/custom segments/triggers;
- reward: bonus/simple, percentage `100`, cap `500`, wagering `5`, and the static freebet/qualification/multi-day defaults;
- schedule: `2026-02-01T00:00` through `2026-03-01T00:00`, not recurring, weekly recurrence with no days, and limits `{ totalClaims: '', perPlayer: '1', budget: '' }`;
- display: empty title/teaser/banner, standard terms text, `['NEW']`, and the static SMS/push defaults.

The five seed-specific overrides are:

| Saved template | Basics | Eligibility | Rewards | Schedule | Display |
| --- | --- | --- | --- | --- | --- |
| `Welcome Bonus — 100% up to KES 5,000` | Name same as template; `First-deposit match for new customers.`; `welcome_bonus` | segment `New Users`; KE primary/only market | bonus/simple; wagering 5; 100%/KES 5000 cap | common base | `Double Your First Deposit`; `100% match up to KES 5,000`; `NEW`, `HOT` |
| `Acca Insurance — Refund up to KES 1,000` | Name same; `Get your stake back if one leg lets you down.`; `acca_insurance` | segment `Sportsbook Players` | freebets/simple; 100%/KES 1000 cap; freebet KES 1000 for Aviator, expiry 168 | common base | `Acca Insurance`; `One leg lets you down? We’ve got your back.`; `HOT` |
| `Weekly Cashback — 10% up to KES 2,000` | Name same; `Get a slice of your weekly losses back.`; `cashback` | segment `Active Players` | bonus/simple; wagering 3; 10%/KES 2000 cap | recurring, weekly on `Mon` | `Weekly Cashback`; `10% back every week`; `NEW` |
| `Aviator Free Rounds — 25 x KES 2` | Name same; `Free rounds for our Aviator fans.`; `aviator_free_rounds` | segment `Casino Players` | freerounds/simple; wagering 10; freebet KES 2 for Aviator, 5 per award, 25 maximum, expiry 48 | common base | `Free Aviator Rounds`; `25 free rounds — fly high!`; `HOT` |
| `Bet & Get — KES 500 Free Bet` | Name same; `Reward for placing a qualifying bet.`; `bet_get` | segment `Sportsbook Players` | freebets/simple; freebet KES 500 for Aviator, expiry 72; qualifying Sportsbook bet enabled: stake 200, multiplier 2.00, one/day, losing bets count | common base | `Bet & Get Free Bet`; `Bet KES 200, get KES 500 free`; `NEW` |

### `promoTemplatesLegacy` flag effect

`features.promoTemplatesLegacy` defaults to `false` and hides all **legacy saved-template UI**:

- the Step 1 `Use a saved template` picker;
- the parent `Save as Template` footer action; and
- its `Save as Template` modal.

It does **not** hide the Step 1 promotion-type catalog, the `Template details` metadata for the eight recognized types, URL loading with `?template=<id>`, `TemplatesContext`, seed templates, or the downstream reward mandatory-field validator. Consequently, a template URL may still load a saved snapshot even though the legacy picker is hidden.

## 4. Conditional rendering and flags

- **`features.promoTemplatesLegacy`:** the only feature flag read directly by `Step1Basics`; controls the legacy picker as described above.
- **Template picker list:** only appears after the picker toggle is open and there is at least one template; the entire picker is absent for an empty list.
- **Template description:** rendered only for a truthy `tpl.description`.
- **Template market suffix:** rendered only for a truthy `tpl.market`.
- **Template summary:** appears only for a `basics.type` with a `TEMPLATE_META` record; there are eight such IDs, listed above.
- **Name inline error:** appears only when `fieldErrors.name` is set. Its input exposes invalid/error-description accessibility attributes at that time.
- **Type inline error:** appears only when `fieldErrors.type` is set.
- **No other flags:** Step 1 does not read `multiCountry`, `segmentTargeting`, or any other feature flag. Those affect parent/downstream behavior, not Step 1 controls.

## 5. Wizard draft data read and written

### Fields read by Step 1

```ts
state.basics: {
  name: string;
  description: string;
  type: string;
}
fieldErrors: Record<string, string>;
```

Context defaults are:

```ts
basics: { name: '', description: '', type: '' }
```

### Normal interactive writes

`updateBasics(data: Partial<WizardState['basics']>)` shallow-merges into `state.basics`:

```ts
setState(previous => ({
  ...previous,
  basics: { ...previous.basics, ...data },
}));
```

Step 1 makes only these partial writes:

- name input: `{ name: e.target.value }`;
- description textarea: `{ description: e.target.value }`;
- type card: `{ type: t.id }`.

Values are kept as raw strings. Step 1 does not trim, normalize case, transform type IDs, derive display text, or alter any downstream draft field when type changes. The search query, open/closed picker state, and selected saved-template ID are component-local state and are not added to the wizard draft.

### Full-state writes and parent interactions

- Saved-template selection calls `loadPromotion(payload)`, which replaces `state` with the supplied `WizardState` reference. It does not merge it with the existing draft or reset the current step.
- Parent edit loading reads `saved_promotions`; if the matching record contains `wizardState`, it fully replaces the draft with it. The parent fallback for older records preserves current default state but replaces `basics.name` and `basics.type` (defaulting the type to `cashback`).
- Parent `?template=<id>` loading obtains the matching `TemplatesContext` entry and fully replaces the draft with its payload; a missing template calls `resetWizard()`.
- Parent reset for a new non-template/non-edit flow restores the `defaultState`. A CRM `segment` handoff may then alter eligibility only when the separate `segmentTargeting` flag is true; it does not modify Step 1 basics.

### Publish transform involving basics

On publish, the parent derives `newPromo.name` as `state.basics.name || 'Untitled Promotion'` and copies `state.basics.type`. It POSTs raw `state.basics.description` as `description`, raw type as `type`, and the complete untransformed wizard state in `config.wizardState`. The local dashboard record also retains `wizardState`. Step 1 itself does not publish or persist drafts.

## 6. WizardStepper structure

`WizardStepper` takes exactly one prop: `currentStep: number`. It uses a static seven-item ordered catalog; it has no context, callbacks, storage, route handling, validation, or feature flags.

| ID | Verbatim label |
| --- | --- |
| 1 | Basics |
| 2 | Scope |
| 3 | Qualification |
| 4 | Rewards |
| 5 | Schedule |
| 6 | Display |
| 7 | Review |

For every static item, state is derived numerically: active when `step.id === currentStep`; completed when `step.id < currentStep`; otherwise pending. A completed item displays a check indicator instead of its numeric ID. A connector follows every item except the final one. It is only a progress/status display: it does not change steps when clicked.

## 7. Dependencies and catalogs

### Direct Step 1 imports

- `useState` from React — local query, picker visibility, and selected-template ID.
- `useWizardContext` from `@/context/WizardContext` — complete draft, partial basics update, full-draft load, errors, and name-error clearing.
- `useTemplates` from `@/context/TemplatesContext` — current template list.
- `getTemplateMeta` from `@/data/promotionTemplates` — read-only recognized-type summary metadata.
- `features` from `@/config/features` — `promoTemplatesLegacy` gating.
- Lucide imports are presentation-only and have no functional data dependency.

### Parent dependencies that feed/affect Step 1

- Next.js `useSearchParams`: `edit`, `template`, and `segment` query values.
- Next.js router: navigation elsewhere in the wizard; it does not pass props to Step 1.
- `saved_promotions` browser localStorage: edit-mode source and local dashboard persistence after publication.
- `TemplatesContext`: template lookup for the `template` query, plus `saveTemplate` for the separately gated save UI.
- `getMissingRequiredFields` / static `TEMPLATE_META`: downstream step-4 reward validation associated with selected basics type.
- `WizardStepper`: receives only `currentStep` from the parent.

### Static catalogs and storage/API conclusion

- The 26 promotion-type choices are a static `PROMOTION_TYPES` constant embedded in `Step1Basics.tsx`.
- The eight recognized type metadata records are static `TEMPLATE_META` in `frontend/src/data/promotionTemplates.ts`.
- Saved templates are localStorage-backed (`saved_templates`) plus static `SEED_TEMPLATES` from `frontend/src/data/seedTemplates.ts`.
- The legacy Step 1 component makes no fetch/API request. Template listing and selection do not call a backend.
- No deleted source file was restored; this report is the only file created for this task.

