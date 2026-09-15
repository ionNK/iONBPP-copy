# Legacy eligibility step: functional specification

## Scope and source status

This report specifies the legacy component at `frontend/src/components/wizard/steps/Step2Eligibility.tsx`, read from the repository `HEAD` object because the working-tree copy is deleted.

At that revision, `CreatePromotionWizard.tsx` does **not** render this component: wizard step 2 renders `Step2Scope`, and wizard step 3 renders `Step3Triggers`. `Step2Eligibility` is therefore legacy/unsequenced code rather than the active form. Its functionality combines the active flow's scope and qualification concerns. The active wizard's feature-flag behavior is included below where relevant.

The legacy component reads and updates `state.eligibility` through `useWizardContext().updateEligibility`; it receives no component props.

## 1. Inputs (rendered top to bottom)

### Target Audience

1. **`Markets`**
   - **Control:** card-select; zero or more cards can be selected.
   - **Options:** dynamically supplied country names; when no configured country list exists, the verbatim fallback options are `Kenya`, `Ghana`, `Nigeria`, `Ethiopia`, `Tanzania`, `Uganda`, and `Zambia` (stored IDs: `KE`, `GH`, `NG`, `ET`, `TZ`, `UG`, `ZM`).
   - **Default:** `KE` / Kenya, from `eligibility.markets: ['KE']` and `eligibility.primaryMarket: 'KE'`.
   - **Required:** optional in the legacy component itself; the wizard only requires at least one selected market when `features.multiCountry` is true.
   - **Behavior:** selected IDs are uppercased. Selecting a market makes it `primaryMarket`. Removing the primary market promotes the first remaining market, or sets `primaryMarket` to `''` if none remain.

2. **`Channels`**
   - **Control:** multi-select (independent selectable channel controls).
   - **Options:** `web`, `mobile`, `app`, `ussd`.
   - **Default:** `desktop` in `eligibility.channels`; consequently none of the legacy component's displayed options starts selected. (The active replacement uses `desktop`, `mobile`, `app`, `ussd`.)
   - **Required:** optional; no validation.
   - **Behavior:** clicking an option adds/removes its exact lowercase ID.

3. **`Player Segments`**
   - **Control:** select.
   - **Options, in order:**
     1. `All Registered Players` (value `all`)
     2. `New Players (<30 days)` (value `new`)
     3. `VIP Tiers 1-3` (value `vip`)
     4. Every non-preset saved CRM segment, displayed by its saved name and valued by its stable ID, under `Your saved segments`
     5. Any ID in `customSegments` that is not a currently saved CRM segment, displayed as that ID with underscores replaced by spaces and uppercased
     6. `+ Create new segment…` (value `create_new`)
   - **Default:** empty string (`''`; no legacy option selected).
   - **Required:** optional; no validation.
   - **Behavior:** choosing `create_new` opens `/admin/crm/segments?create=1` in a new tab and does not change the draft. All other selections write the selected value to `eligibility.segment`.

### Qualification Rules

4. **`Advanced`**
   - **Control:** toggle.
   - **Options:** off/on.
   - **Default:** off.
   - **Required:** optional.
   - **Behavior:** local-only view switch. When on, it displays a read-only textual rendering of existing trigger/rule data; it cannot edit and writes no draft field.

5. **`Add Trigger Event`**
   - **Control:** card-select in a modal opened by this action.
   - **Options:**
     - **Sportsbook:** `Bet Placed (Prematch)`, `Live Bet Placed`, `Bet Settled (General)`, `Accumulator Settled`, `Cashout Execution`
     - **Aviator & Crash Games:** `Aviator Bet Placed`, `Aviator Cashout`, `Round Crashed (Loss)`
     - **Wallet & Transactions:** `Deposit (General)`, `First Time Deposit (FTD)`, `Withdrawal Request`, `Withdrawal Completed`
     - **Casino & Slots:** `Game Launch`, `Spin / Round`, `Big Win`, `Bonus Round Entry`
     - **Engagement & Lifecycle:** `New Registration`, `User Login`, `KYC Verified`, `App Installation`
   - **Default:** on first mount, if no triggers exist, the component writes one trigger for event ID `deposit` (shown as `Deposit (General)`) with ID `t-init` and no rules.
   - **Required:** optional; all triggers may be deleted and no minimum is enforced.
   - **Behavior:** selecting an event appends `{ id: 't-' + Date.now(), eventId, rules: [] }` and closes the modal. The trigger delete action removes that trigger.

6. **`Add Condition` / `Select Parameter`** (one per trigger)
   - **Control:** card-select parameter picker; one parameter is added per action and parameters are not de-duplicated.
   - **Options:** only the parameters of that trigger's selected event (full catalog in section 2).
   - **Default:** no condition rows.
   - **Required:** optional.
   - **Behavior:** adding a parameter appends a rule with a numeric `Date.now()` ID, the parameter's name and type, `operator: 'eq'`, and `value: ''`. Each row shows a non-editable parameter label, an operator select, a value control, and a remove action.

7. **Operator** (per condition row)
   - **Control:** select.
   - **Options, verbatim:** `> Greater Than`, `≥ Greater or Equal`, `< Less Than`, `≤ Less or Equal`, `= Equals`, `≠ Not Equals`, `⇔ Between`, `⇎ Not Between`, `IN List`, `NOT IN List`, `Contains`, `Does Not Contain`, `Is Set (has value)`, `Is Empty (no value)`.
   - **Stored values:** `>`, `>=`, `<`, `<=`, `=`, `!=`, `between`, `not_between`, `in`, `not_in`, `contains`, `not_contains`, `is_set`, `is_empty`.
   - **Default:** a new rule stores `eq`, which is not one of the option values, so no option matches until the user changes it.
   - **Required:** optional; no validation.

8. **Value control** (per condition row)
   - **Control:** varies by parameter type and operator (detailed in section 2).
   - **Default:** blank string(s).
   - **Required:** optional; no validation.

## 2. Condition/rule builder

### Event parameters (full catalog)

The event selected for a trigger determines the complete parameter list below. A parameter's declared type controls its value widget: `integer` and `float` use number inputs; `string` uses a text input; `enum` uses a select containing the listed values; `boolean` uses a Yes/No select.

| Event (stored ID) | Parameters (name — declared type — enum options where applicable) |
| --- | --- |
| Bet Placed (Prematch) (`bet_placement`) | Stake — float; Odds — float; Sport — enum: `Football`, `Basketball`, `Tennis`, `Ice Hockey`, `Rugby`, `Cricket`, `Any`; League — string; Market — string; Selections Count — integer; Potential Win — float |
| Live Bet Placed (`live_bet_placement`) | Stake — float; Current Score — string; Match Minute — integer; Sport — enum: `Football`, `Tennis`, `Basketball`, `Table Tennis` |
| Bet Settled (General) (`bet_settled`) | Outcome — enum: `Win`, `Loss`, `Void`, `Cashout`, `Half-Win`, `Half-Loss`; Losing Selections Count — integer; Winning Selections Count — integer; Voided Selections Count — integer; Payout — float; Profit — float; Total Odds — float |
| Accumulator Settled (`acca_bet_settled`) | Total Legs — integer; Losing Legs — integer; Min Odds per Leg — float; Outcome — enum: `Win`, `Loss`, `One-Cut` |
| Cashout Execution (`cashout`) | Cashout Type — enum: `Full`, `Partial`, `Auto`; Amount — float; Original Stake — float; Cashout % — float |
| Aviator Bet Placed (`aviator_bet`) | Stake — float; Auto Cashout Enabled — boolean; Auto Cashout Target — float |
| Aviator Cashout (`aviator_cashout`) | Multiplier — float; Win Amount — float; Burst Multiplier — float |
| Round Crashed (Loss) (`aviator_crash`) | Stake Lost — float; Crash Point — float |
| Deposit (General) (`deposit`) | Amount — float; Method — enum: `Mpesa`, `AirtelMoney`, `Cashia`, `Card`, `BankTransfer`, `Voucher`; Currency — enum: `KES`, `GHS`, `NGN`, `UGX`, `ETB`, `TZ`, `MWK`; Is First Deposit — boolean; Promo Code — string |
| First Time Deposit (FTD) (`first_deposit`) | Amount — float; Method — string; Days Since Reg — integer |
| Withdrawal Request (`withdrawal`) | Amount — float; Method — string |
| Withdrawal Completed (`withdrawal_completed`) | Amount — float |
| Game Launch (`game_launch`) | Game ID — string; Provider — string; Category — string |
| Spin / Round (`spin`) | Bet Amount — float; Game Type — enum: `Slots`, `Table`, `Live Casino` |
| Big Win (`game_win`) | Win Amount — float; Multiplier — float |
| Bonus Round Entry (`bonus_round`) | Game ID — string |
| New Registration (`registration`) | Reg Method — enum: `SMS`, `Web`, `App`; Referral Code — string |
| User Login (`login`) | Days Inactive — integer; Platform — string |
| KYC Verified (`profile_update`) | Doc Type — string |
| App Installation (`app_install`) | OS — enum: `Android`, `iOS` |


### Value arity, widgets, and validation

- `Is Set (has value)` and `Is Empty (no value)` take **no value**. The UI shows `— no value —`; it does not clear any pre-existing stored `value`/`value2` when the operator changes.
- `⇔ Between` and `⇎ Not Between` take a **range**: `Min` and `Max`. They are number inputs for integer/float parameters and text inputs for string parameters. The lower bound is stored in `value`; the upper bound is dynamically written as `value2` even though `Rule`'s declared TypeScript interface has no `value2` member.
- Boolean parameters take one select: `Select...`, `Yes (True)` (stored `true` as a string), or `No (False)` (stored `false` as a string), except for a zero-arity operator.
- Enum parameters take one select: `Select...` followed by that parameter's catalog options, except for a zero-arity operator. Range operators do **not** retain the enum select; they use text inputs.
- Other parameters take one text/number input. For `IN List` and `NOT IN List` its placeholder is `Comma-separated`; otherwise it is `Value`.
- All changes are stored verbatim as strings. There is no required-value check, number bound, integer/float parsing, range-order check, enum/operator compatibility check, duplicate-parameter prevention, or trigger/rule validation in this component or the wizard's step navigation.

### Rule composition and removal

- Within one trigger, every displayed rule is prefixed `AND`; conditions are conjunctive.
- Each trigger begins `WHEN <event>`. Separate triggers are joined visually and in advanced text by `OR`; they are disjunctive alternatives.
- `Add Condition` exposes only the parameter list for that trigger's event. Selecting one immediately adds one row.
- The row remove action deletes only that rule. The trigger delete action deletes that trigger and all its rules. There is no confirmation or minimum-row/minimum-trigger safeguard.
- Advanced mode only serializes current rows for display as `PROMOTION RULES`, `WHEN EVENT "…"`, and `AND <param> <operator> "<value>"`; it is not editable and omits `value2`.

## 3. Conditional rendering and handoffs

### In the legacy component itself

- Markets initially shows `Loading markets...`; then configured/fallback market cards or `No countries configured. Please go to Settings to add markets.`
- The CRM acknowledgement appears only when the URL has a nonempty `segment`. It states `CRM Segment attached`, shows `segmentName` (falling back to the segment ID), and shows `· N players` only if parsed `audience` is greater than zero.
- Saved CRM segments render only if at least one non-preset segment exists. Ad-hoc custom IDs render only if absent from that saved-segment list.
- Choosing `create_new` navigates only; it does not select a segment.
- The event modal is visible only after `Add Trigger Event`; normal trigger editing is hidden while Advanced is on and replaced by a read-only representation.
- The component does **not** import or inspect `features.segmentTargeting` or `features.multiCountry`; neither flag changes legacy inputs.

### CRM handoff behavior

With `?segment=<stable-id>&segmentName=<name>&audience=<count>`:

1. The component records the ID/name/audience in local UI state for the acknowledgement. `audience` is `parseInt(...) || 0`; nonnumeric or zero values do not show a count.
2. It writes the stable ID to `eligibility.segment`.
3. If absent from `eligibility.customSegments`, it appends the ID. This guarantees a selectable fallback option when CRM storage does not contain the segment.
4. It does not suppress Markets, Channels, Player Segments, or Qualification Rules, and does not clear triggers.

The CRM Segments page creates this URL with exactly `segment: seg.id`, `segmentName: seg.name`, and `audience: String(count)`, then navigates to `/admin/promotions/create?...`.


### Parent wizard and feature flags

- At `HEAD`, the parent initializes a CRM handoff only when `targetSegment` is present **and** `features.segmentTargeting` is true. It writes `segment: targetSegment` and `customSegments: [targetSegment]` after reset. Defaults set both flags false, so this parent-level preattachment is normally disabled.
- The legacy `Step2Eligibility` independently reacts to `segment` when mounted; it has no flag guard. In the actual `HEAD` sequence it is not mounted, so active `Step2Scope` behavior governs.
- Active `Step2Scope` renders Segments controls and custom-CSV status only when `segmentTargeting` is true. Its market control is single-select when `multiCountry` is false and multi-market when true. Parent validation requires one or more markets only when `multiCountry` is true.

## 4. Data shape, writes, and save transforms

### Eligibility draft schema

```ts
eligibility: {
  markets: string[];
  primaryMarket: string;
  channels: string[];
  segment: string;
  customSegments: string[];
  triggers: Array<{
    id: string;
    eventId: string;
    rules: Array<{
      id: number;
      param: string;
      operator: string;
      value: string;
      type: string;
      // Runtime-only possible additional field: value2: string
    }>;
  }>;
}
```

Initial values are `markets: ['KE']`, `primaryMarket: 'KE'`, `channels: ['desktop']`, `segment: ''`, `customSegments: []`, and `triggers: []`. On initial legacy mount with no triggers, `triggers` becomes `[{ id: 't-init', eventId: 'deposit', rules: [] }]`.

`updateEligibility` shallow-merges a partial object into `state.eligibility`. The component does not parse rule values to numbers/booleans, split list values, or normalize fields except market IDs (uppercase). `value2` is added at runtime for ranges through the generic rule updater and remains serializable.

### Publication/payload transform

The parent publishes the full wizard state and also creates a summarized payload:

- Dashboard/local record: `market` becomes `state.eligibility.markets[0]?.toUpperCase() || 'ZM'`; `segment` is copied from `state.eligibility.segment`; `rules` becomes `Min ${state.eligibility.triggers.length} Qualifications`; and the unmodified full `state` is saved as `wizardState`.
- POST body to `http://localhost:4000/promotions`: `config.market` is that first uppercased market/default `ZM`, `config.segment` is the raw segment string, and `config.wizardState` is the complete raw state. The API config does **not** separately flatten `channels`, `primaryMarket`, `customSegments`, or `triggers`; they are available only inside `wizardState`.
- The summarized `market` field loses additional selected markets, but `wizardState` retains them.

## 5. Dependencies and option sources

- **Wizard state:** `useWizardContext`, `Rule`, and `Trigger` from `@/context/WizardContext`. This is in-memory React context; the component itself has no API call for draft persistence.
- **CRM segments:** `getSegments` and `Segment` from `@/data/segments`. `getSegments()` is a localStorage-backed mock using key `crm_segments_v1`, combining built-in presets with saved non-preset segments. The legacy picker filters out presets, so only non-preset saved segments are shown. It reloads on window focus and `storage` events.
- **Markets:** localStorage key `settings_countries`, expecting array items with `code` and `name`. If absent, invalid, empty, or unparsable, it uses the seven static fallback countries. It reloads on `storage` events. It does not fetch an API.
- **URL handoff:** Next.js `useSearchParams` supplies `segment`, `segmentName`, and `audience`.
- **Event/options catalog:** categories, events, parameters, enum values, operators, and arity rules are static constants embedded directly in `Step2Eligibility.tsx`. It does not use the separate `@/lib/event-catalog` module and does not fetch condition options.
- **No external option APIs:** apart from browser localStorage, URL parameters, and static data, the legacy component makes no network or mock-service request.

