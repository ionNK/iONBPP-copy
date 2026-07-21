# Wizard Refactor Summary

## Changes Made
1.  **Split 'Eligibility' Step**:
    - The original "Step 2: Eligibility" was monolithic, handling both audience scope (Markets, Platforms, Segments) and technical triggers.
    - **Refactored into**:
        - **Step 2: Scope**: Focuses strictly on Audience (Markets, Platforms, Segments).
        - **Step 3: Triggers**: Focuses on Event-Driven Logic and Rules.

2.  **Step 2: Scope Enhancements**:
    - **CSV Upload**: Implemented a functional "Upload CSV" modal for Custom Segments.
    - **Success State**: Added a success badge when a CSV is simulated as uploaded.
    - **UI Polish**: Updated styles and structure.

3.  **Step 3: Triggers Implementation**:
    - Ported the robust trigger logic (Rules, Events, Advanced Mode) from the old `Step2Eligibility.tsx` to `Step3Triggers.tsx`.
    - Preserved all functionality including the Event Catalog and Rule Builder.

4.  **Wizard Orchestration**:
    - Updated `CreatePromotionWizard.tsx` to handle the new 7-step flow.
    - Updated `WizardStepper.tsx` to display the new steps:
        1. Basics
        2. Scope
        3. Triggers
        4. Rewards
        5. Schedule
        6. Display
        7. Review

## Next Steps
- Verify the CSV upload simulation meets requirements (currently mocks upload).
- Test the new flow end-to-end.
