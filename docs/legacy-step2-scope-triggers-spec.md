# Legacy Step 2 Scope and Step 3 Triggers: functional specification

## Source and scope

This specification describes the deleted `HEAD` versions of:

- `frontend/src/components/wizard/steps/Step2Scope.tsx` (wizard step 2)
- `frontend/src/components/wizard/steps/Step3Triggers.tsx` (wizard step 3)
- their parent, `frontend/src/components/wizard/CreatePromotionWizard.tsx`

It excludes styling and CSS behavior. Both components take **no props**. They read `state.eligibility` and write partial updates through `useWizardContext().updateEligibility`.

## Step 2 — Scope & Eligibility

### Inputs, in rendered order

1. **`Target Market`** — rendered only when `features.multiCountry` is `true`.
   - **Control:** single-select custom dropdown; selection always replaces the market array with one item.
   - **Options:** the configured market list from localStorage `settings_countries`, rendered as each configured market's `name` (stored value/ID is its `code`). The component parses that list into uppercase IDs. If missing, invalid, unparsable, or empty, fallbacks are `Kenya` (`KE`), `Ghana` (`GH`), `Nigeria` (`NG`), `Ethiopia` (`ET`), `Tanzania` (`TZ`), `Uganda` (`UG`), and `Zambia` (`ZM`).
   - **Default:** context default is `['KE']` with `primaryMarket: 'KE'`; after the Zambia single-country flag work, on mount, if `features.multiCountry` is false **and** `markets` is empty, it writes `markets: ['ZM']` and `primaryMarket: 'ZM'`. The market control is hidden in that default flag state.
   - **Required/validation:** optional at component level. Parent Continue validation requires at least one market only when `features.multiCountry` is true; error: `Please select at least one target market.`
   - **Write:** selecting ID `id` writes `{ markets: [id], primaryMarket: id }` and closes the menu. There is no deselect action or multi-select behavior.

2. **`Channels`**
   - **Control:** independent multi-select buttons.
   - **Options:** `All`, `Desktop`, `Mobile Web`, `Mobile App`, `USSD` (stored IDs: `desktop`, `mobile`, `app`, `ussd`; `All` is a control-only pseudo-option).
   - **Default:** `['desktop']`.
   - **Required/validation:** optional; no component or parent step-2 validation.
   - **Write:** choosing `All` writes all four stored IDs when one or more is absent; when all four are present, it writes `[]`. Each individual option independently adds/removes its stored ID; ordering follows the prior array plus appended selections.

3. **`Target Audience`** — rendered only when `features.segmentTargeting` is `true`.
   - **Control:** searchable single-select custom dropdown.
   - **Options:** saved CRM segments first, using each saved `name` (stored ID is `id`), under `Your saved segments`; then, under `Built-in audiences`, `No segment` (stored `''`), `All Registered Players` (`all`), `New Players` (`new`), `VIP Segments Only` (`vip`). Actions are `Create a new segment` / `Define a new audience rule` (opens inline builder) and `Custom List (Upload CSV)` / `Upload a player list from a file` (opens upload modal).
   - **Default:** `''` (`No segment`).
   - **Required/validation:** optional; none. The parent does not skip Step 3 when a segment is selected: the apparent skip implementation is commented out.
   - **Write/transforms:** choosing an audience writes `{ segment: value }`. Saving the inline builder reloads segments and writes the newest non-preset segment ID. Completing the simulated file upload writes `{ segment: 'custom_csv' }`; dismissing its success badge writes `{ segment: 'all' }`. Search only filters local UI by saved-segment name/description.

4. **`Upload Player List`** — modal reached through `Custom List (Upload CSV)`; rendered only while that local modal is open.
   - **Control:** file input accepting `.csv`.
   - **Displayed instructions:** `Drag and drop your CSV file here`, `or click to browse`, `• Accepted format: CSV, XLS`, `• Required columns: player_id, mobile_number`.
   - **Default/required/validation:** no file by default; optional; no file-content, extension-at-runtime, CSV, XLS, column, or upload validation. A selected file drives simulated local progress and ultimately the `segment: 'custom_csv'` write above.

### Conditional rendering and data sources

- With default configuration (`multiCountry: false`, `segmentTargeting: false`), neither Target Market nor Target Audience nor its CSV status is rendered; Channels remains rendered.
- When `multiCountry` is true, Target Market starts as `Loading markets...`; an empty configured list shows `No countries configured. Please go to Settings > Countries & Limits.` `Refresh List` reloads after 500 ms; a browser `storage` event also reloads it.
- Segments load from `getSegments()` on mount, window focus, and `storage`; search appears only with more than eight saved segments. The builder is an inline `SegmentBuilder` drawer.
- `Custom list uploaded successfully (12,405 users)` renders only when `features.segmentTargeting` is true and `segment === 'custom_csv'`.
- Estimated reach is display-only: `all` = `214,900`, `new` = `48,200`, `vip` = `10,745`, `custom_csv` = `12,405`, otherwise `2.4M`.

## Step 3 — Qualification Rules

### Inputs, in rendered order

1. **`Advanced`**
   - **Control:** on/off toggle, local component state only.
   - **Default:** off.
   - **Required/validation:** optional; none.
   - **Behavior:** on replaces editable trigger UI with read-only rule text. It writes no draft field.

2. **`Add Trigger Event`**
   - **Control:** opens a modal event-card picker.
   - **Default:** on first mount, if `triggers.length === 0`, writes `{ id: 't-init', eventId: 'deposit', rules: [] }`.
   - **Required/validation:** optional. All triggers can be deleted; Continue from step 3 has no validation.
   - **Write:** selecting event ID `eventId` appends `{ id: 't-' + Date.now(), eventId, rules: [] }`, then closes the modal. Deleting a trigger filters it and all of its rules.

3. **`Add Condition` / `Select Parameter`** — per trigger.
   - **Control:** opens an in-place parameter picker listing only the selected trigger event's parameters.
   - **Default:** no rules in a new trigger.
   - **Required/validation:** optional; duplicate parameters are allowed.
   - **Write:** selecting parameter `p` appends `{ id: Date.now(), param: p.name, type: p.type, operator, value: '' }`. `operator` is `>` for `integer`/`float`; otherwise it is `=`.

4. **Operator** — per rule.
   - **Control:** select.
   - **Options (label — stored value):** `> Greater Than` — `>`; `≥ Greater or Equal` — `>=`; `< Less Than` — `<`; `≤ Less or Equal` — `<=`; `= Equals` — `=`; `≠ Not Equals` — `!=`; `⇔ Between` — `between`; `⇎ Not Between` — `not_between`; `IN List` — `in`; `NOT IN List` — `not_in`; `Contains` — `contains`; `Does Not Contain` — `not_contains`; `Is Set (has value)` — `is_set`; `Is Empty (no value)` — `is_empty`.
   - **Default:** `>` for numeric parameters; `=` for string, enum, and boolean parameters.
   - **Required/validation:** optional; operator/type compatibility is not validated.

5. **Value control** — per rule, after Operator.
   - **Arity:** `is_set` and `is_empty` have none and display `— no value —`; existing `value` and runtime `value2` are not cleared on an operator change. `between` and `not_between` have two inputs, `Min` and `Max`; every other operator has one.
   - **Control by declared parameter type:** integer/float = number input; string = text input; enum = select containing `Select...` then that parameter's options; boolean = select containing `Select...`, `Yes (True)` (string `true`), and `No (False)` (string `false`). Range uses number inputs for numeric types and text inputs for every other type, including enum and boolean.
   - **Placeholders:** range `Min` / `Max`; `in` and `not_in` single input `Comma-separated`; other single text/number input `Value`.
   - **Default/required/validation:** blank string(s); optional. Values remain strings. There is no required-value, parsing, numeric-bound, range-order, enum compatibility, or operator compatibility validation.
   - **Write:** lower/single value writes `value`; upper range value dynamically writes `value2` despite `Rule` not declaring it.

### Event catalog and comparison with `legacy-eligibility-spec.md`

The Step 3 category labels, all 19 event labels/IDs, parameter names/types, and enum options are **identical** to the complete table in [the existing legacy eligibility specification](legacy-eligibility-spec.md#event-parameters-full-catalog), rows 90–109: categories are `Sportsbook`, `Aviator & Crash Games`, `Wallet & Transactions`, `Casino & Slots`, and `Engagement & Lifecycle`. Therefore they are not duplicated here.

**Diff from that specification's Step2Eligibility catalog/behavior:**

- No event, category, parameter, parameter type, enum option, operator, or value-arity difference was found; nothing is added, omitted, or renamed.
- The rule default differs: `Step3Triggers` uses `>` for numeric types and `=` otherwise, while legacy `Step2Eligibility` initialized every new rule with `eq`, a value absent from the operator list.
- Step 3 embeds its own `EVENT_CATALOG` constants. It does **not** import `@/lib/event-catalog`. The module exists separately, but is not this component's source of truth.

### Composition, removal, and conditional rendering

- Rules inside a trigger are joined/prefixed with `AND`; triggers are joined by `OR`. Each trigger reads `WHEN <event>`.
- Removing a rule filters only that rule. Removing a trigger filters that trigger and all of its rules. Neither action asks for confirmation or enforces a minimum.
- The event-selection modal renders only after `Add Trigger Event`. A parameter picker is rendered only for the one trigger whose Add Condition action activated it.
- In Advanced view, the editable triggers, add-trigger action, and event modal launcher are hidden. Read-only text lists `PROMOTION RULES`, `WHEN EVENT "<event>"`, and `AND <param> <operator> "<value>"`; it omits `value2`.
- Unknown/missing event IDs display `Unknown Event` (empty ID) or the raw ID (nonempty unrecognized ID) and have no available parameters.

## Draft shape, parent integration, and transforms

```ts
eligibility: {
  markets: string[];
  primaryMarket: string;
  channels: string[];
  segment: string;
  customSegments: string[]; // read by neither requested step
  triggers: Array<{
    id: string;
    eventId: string;
    rules: Array<{
      id: number;
      param: string;
      operator: string;
      value: string;
      type: string;
      value2?: string; // runtime-only, written by Step 3 range control
    }>;
  }>;
}
```

`updateEligibility` shallow-merges the partial object into `state.eligibility`; neither requested step submits an API request or persists wizard state itself. Context defaults are `markets: ['KE']`, `primaryMarket: 'KE'`, `channels: ['desktop']`, `segment: ''`, `customSegments: []`, and `triggers: []`.

The parent renders `<Step2Scope />` at step 2 and `<Step3Triggers />` at step 3; neither receives props. Its only Continue validation relevant to these steps is the conditional step-2 market check stated above. It has no step-3 validation. The commented-out segment-based Step 3 skip is inactive.

When the parent receives `?segment=<id>`, it resets/initializes the wizard and prewrites `{ segment: targetSegment, customSegments: [targetSegment] }` only if `features.segmentTargeting` is true. `segmentName` alone is never selected. On later publish, raw `wizardState` retains all fields; the summarized/API `market` is only `markets[0]?.toUpperCase() || 'ZM'`, so extra selected markets (though Step 2 cannot create them) would only survive in `wizardState`.

## Dependencies and storage

- **Shared state/types:** `@/context/WizardContext`: `useWizardContext`; Step 3 also imports `Trigger` and `Rule`.
- **Feature flags:** `@/config/features`: `multiCountry` gates Target Market and its validation; `segmentTargeting` gates all audience/segment and CSV UI. Defaults for both are false.
- **Markets:** browser localStorage `settings_countries`; no API call. Expected entries provide `code` and `name`.
- **Segments:** `@/data/segments` (`getSegments`, `newSegmentDraft`, `Segment`) and `@/components/crm/SegmentBuilder`; the segment helper is localStorage-backed under `crm_segments_v1`.
- **Step 3 catalog:** local embedded `EVENT_CATALOG`; no storage key, API, or catalog-module import.
- **Other imports:** both use React hooks and Lucide icons; the parent uses Next navigation/search params, templates, the other wizard step components, promotion-template validation, and feature flags.
