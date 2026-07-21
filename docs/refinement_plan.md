# Refinement Plan: Promotion Flow, Analytics & Settings

## 1. Promotion Wizard Enhancements

### A. Step 1: Promotion Type Selection
- **Issue**: "Cashback" is currently auto-selected.
- **Fix**: 
  - Update `Step1Basics.tsx` (or Context) to initialize `type` as `null` or empty.
  - Require user selection to proceed.

### B. Step 2: Segments Selection
- **Issue**: User wants to "remove actions" and "create new segment from dropdown lists".
- **Fix**:
  - In `Step2Scope.tsx`, modify the Segment Dropdown.
  - Remove the `<optgroup label="Actions">` wrapper.
  - Keep "+ Create New Segment" as a direct option in the list (visually distinct if possible).
  - Ensure selecting it triggers the creation flow (modal or navigation) as it currently does.

### C. Display/Preview (Channels)
- **Issue**: Web should be first and auto-selected.
- **Fix**:
  - In `Step6Display.tsx` (Preview Section):
    - Swap button order: **[Web]** | [Mobile].
    - Set default state `previewDevice = 'web'`.

## 2. Analytics Dashboard: Custom Report Builder

- **Requirement**: "User should have a way to define their report... similar to Tableau".
- **Implementation plan**:
  - Update `src/app/reports/page.tsx`.
  - Introduce **Tabs**: "Overview" (Current Dashboard) vs "Custom Report".
  - **Build "Custom Report" Interface**:
    - **Sidebar (Builder Controls)**:
      - **Metrics**: Checkboxes for GGR, NGR, Bonus Cost, Claims, etc.
      - **Dimensions**: Group by Country, Campaign Type, Platform.
      - **Filters**: Date Range, specific Countries.
    - **Main Area (Preview)**:
      - Dynamic Table/Chart area that reflects selected columns/metrics.
      - "Generate" and "Export" buttons.

## 3. Settings: Save Functionality

- **User Question**: "Do we need Save Changes in all the tabs?"
- **Assessment**: 
  - The Settings page currently has a **Global Save Button** at the bottom footer.
  - **Decision**: 
    - **Keep the Global Save**. It is cleaner and prevents UI clutter in every tab.
    - I will ensure the Global Save button is sticky or clearly visible so users don't miss it.
    - No changes needed to add buttons to individual tabs.

## 4. Execution Order
1.  **Wizard Refinements**: `Step1Basics`, `Step2Scope`, `Step6Display`.
2.  **Analytics Upgrade**: Refactor `ReportsPage` to add the Builder.
3.  **Settings Review**: Verify Global Save visibility.
