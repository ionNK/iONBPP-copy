# Settings Enhancement Report

## 1. Restored & Expanded Functionality
- **Access:** Re-enabled access to the full System Settings page via the new "Manage System Settings" link in the header dropdown.
- **New Feature:** Added a dedicated **Win Limits** tab in Settings.
    - Allows configuring maximum win caps per country (KE, GH, TZ, UG, ET, NG, ZM).
    - Caps are persisted to local storage.
    - Visual indicators for country codes and currencies.

## 2. Test Verification
- **Scenario:** Change Kenya (KE) limit from 100,000 to 120,000.
- **Result:** Value persisted after page reload.
- **Status:** **SUCCESS**

## 3. Implementation Plan: Promotion Cap Enforcement
To fully meet the requirement "A cap for a promotion cannot be more than a cap for a promo for that particular country", the following steps are planned for the Promotion Wizard:

1.  **Context Integration:** Update `WizardContext` to read `settings_win_caps` from local storage on initialization.
2.  **Validation Logic:** In the Rewards step (e.g., `Step4Rewards`):
    - Retrieve the selected market/country from `Step1Basics` or `Step2Scope`.
    - Compare the input "Max Win" against the corresponding country cap from Settings.
    - Show an error if `input > cap`.
    - Disable "Next" or "Publish" until resolved.
