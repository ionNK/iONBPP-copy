# Plan: End-to-End Player Promotions & Predictions

## Objective
Implement the "Actual Predictions" feature where the system recommends specific promotional offers for individual players, utilizing the trained ML model and enforcing the Responsible Gambling (CRG) safeguards.

## 1. Backend: Inference & Recommendation Engine
We will create a new script `ml_pipeline/inference.py` to simulate the production serving layer.

**Logic Flow:**
1.  **Player Selection**: Select a sample of 50 players (representing diverse segments and risk profiles).
2.  **Candidate Generation**: For each player, generate 7 candidate offers (one for each Promo Type).
3.  **Model Scoring**: 
    -   Use the trained `HistGradientBoostingClassifier` to predict the `engagement_probability` for each (Player, Offer) pair.
    -   Input features: Player Demographics + Financials + Promo Type.
4.  **Risk Overlay (CRG Layer)**:
    -   Calculate the player's real-time risk metrics (Loss Ratio, Deposit Burst, etc.).
    -   Determine Risk Action: `ALLOW`, `DOWNGRADE`, or `BLOCK`.
    -   **Apply Constraints**:
        -   **BLOCK**: engagement_score = 0 (Suppress all).
        -   **DOWNGRADE**: engagement_score *= 0.5 (Deprioritize). Remove "High Risk" offer types (e.g., "DepositAndGet").
5.  **Ranking & Selection**: Sort by final score and select Top 3.
6.  **Explanation Generation**: Generate synthetic SHAP-style reasons based on feature contribution (e.g., "User prefers high-volatility offers").
7.  **Output**: Save `recommendations.json` to the frontend `src/data` folder.

## 2. Frontend: Player Recommendations Module
Create a new page module at `/predictions/player-recommendations`.

**UI Components:**
*   **Player Queue**: A sidebar/list of players to review.
*   **Player Profile Header**:
    *   Key Stats (LTV, Churn Risk).
    *   **CRG Risk Badge**: Prominent display of their safety status.
*   **Recommended Offers Grid**:
    *   Cards for the Top 3 Offers.
    *   **Match Score**: The model's confidence (e.g., "94% Match").
    *   **Risk Modification**: Visual indicator if an offer was modified/downgraded for safety.
*   **Context/Why**: A section explaining *why* these offers were chosen (e.g., "High affinity for Cashback").

## 3. Integration
*   Link this new page in the Sidebar under Predictions.
*   Ensure it reads directly from the generated JSON artifacts.

## Execution Steps
1.  [ ] Write `ml_pipeline/predict_next.py` (Inference script).
2.  [ ] Run the script to generate valid JSON data.
3.  [ ] Create the Next.js page and components.
4.  [ ] Verify the flow: Select Player -> See AI Recommendations + Risk Limits.
