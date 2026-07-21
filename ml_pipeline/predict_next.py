import pandas as pd
import numpy as np
import joblib
import json
import random
from .utils import DATA_DIR, MODELS_DIR, get_logger
from .crg_layer import CRGScorer

logger = get_logger("inference")

PROMO_TYPES = [
    "AccaInsurance", "Mission", "Activation", "Cashback", 
    "ReloadBonus", "DepositAndGet", "ReAcquisition"
]

def generate_recommendations(n_players=50):
    logger.info(f"Generating recommendations for {n_players} players...")
    
    # 1. Load Artifacts
    model = joblib.load(f"{MODELS_DIR}/xgboost_model.pkl")
    features = joblib.load(f"{MODELS_DIR}/features.pkl")
    enc = joblib.load(f"{MODELS_DIR}/encoder.pkl")
    
    # 2. Load Players & Recent Data (simulate reading from DB)
    # We'll pick random players from the generated training data
    # Ideally we use 'players.csv' and compute fresh features, 
    # but for this demo effective re-using training set rows is easier to guarantee feature alignment.
    train_df = pd.read_csv(f"{DATA_DIR}/train_data.csv")
    
    # Get unique players from train_df
    unique_players = train_df['player_id'].unique()
    sampled_ids = np.random.choice(unique_players, size=n_players, replace=False)
    
    # Get their profiles (take specific rows to get their feature values)
    # We need one row per player to get their static/financial features
    # Then we replicate for each promo type.
    
    recommendations_list = []
    
    scorer = CRGScorer()
    
    for pid in sampled_ids:
        # Get player's base features (take the first occurrence)
        p_row = train_df[train_df['player_id'] == pid].iloc[0].copy()
        
        # Calculate Risk Score
        risk_stats = {
            'loss_ratio_7d': p_row.get('loss_ratio_7d', 0),
            'deposit_burst_flag': p_row.get('deposit_burst_flag', 0),
            'avg_session_duration_30d': p_row.get('avg_session_duration_30d', 0),
            'hours_since_major_loss': p_row.get('hours_since_major_loss', 999)
        }
        crg_score = scorer.score_player(risk_stats)
        risk_action, risk_multiplier = scorer.determine_action(crg_score)
        
        # Prepare Candidates (Cross-Product with Promo Types)
        candidates = []
        for p_type in PROMO_TYPES:
            row = p_row.copy()
            row['promo_type'] = p_type
            candidates.append(row)
            
        cand_df = pd.DataFrame(candidates)
        
        # Encode Categoricals
        cat_cols = ['promo_type', 'country', 'currency', 'age_group']
        cand_df[cat_cols] = enc.transform(cand_df[cat_cols])
        
        # Predict
        X = cand_df[features]
        probs = model.predict_proba(X)[:, 1]
        
        # Apply Logic & Rank
        player_recs = []
        for i, p_type in enumerate(PROMO_TYPES):
            base_prob = probs[i]
            final_prob = base_prob * risk_multiplier
            
            # Additional logic: If DOWNGRADE, remove high-risk offers
            # Example: DepositAndGet is "High Risk"
            is_high_risk_offer = p_type in ["DepositAndGet", "ReloadBonus"]
            risk_flag = ""
            
            if risk_action == "DOWNGRADE" and is_high_risk_offer:
                final_prob = 0 # strict filtering
                risk_flag = "Suppressed (Safety)"
            elif risk_action == "DOWNGRADE":
                risk_flag = "Downgraded"
                
            if risk_action == "BLOCK":
                risk_flag = "Blocked"
            
            player_recs.append({
                "promo_type": p_type,
                "model_score": float(base_prob),
                "final_score": float(final_prob),
                "risk_flag": risk_flag,
                "model_name": "HistGradientBoosting",
                "risk_penalty": f"{risk_multiplier}x" if risk_multiplier < 1 else "None"
            })
            
        # Sort by Final Score
        player_recs.sort(key=lambda x: x['final_score'], reverse=True)
        top_3 = player_recs[:3]
        
        # Explainability (Synthetic)
        # In real world, use SHAP. Here, heuristic text.
        reason_map = {
            "Cashback": "High recent activity volume",
            "AccaInsurance": "Frequent multi-leg bets",
            "Mission": "High engagement propensity",
            "ReloadBonus": "Deposit frequency trend",
            "Activation": "Dormancy risk mitigation",
            "DepositAndGet": "High LTV potential",
            "ReAcquisition": "Win-back strategy"
        }
        
        # Construct Final JSON Object for this player
        # Need some raw stats for the UI
        p_profile = {
            "player_id": str(pid),
            "segment": p_row['value_segment_HighRoller'] == 1 and 'HighRoller' or 
                       (p_row['value_segment_VIP'] == 1 and 'VIP' or 
                       (p_row['value_segment_Core'] == 1 and 'Core' or 'Casual')), 
            
            "churn_risk": f"{random.randint(5, 85)}%", # Mock
            "ltv": f"€{int(p_row.get('net_deposits', 0))}",
            "crg_score": int(crg_score),
            "risk_action": risk_action,
            "risk_metrics": risk_stats,
            "recommendations": [
                {
                    "type": r['promo_type'],
                    "match_score": f"{int(r['model_score']*100)}%",
                    "raw_score": r['model_score'],
                    "model_used": r['model_name'],
                    "risk_penalty": r['risk_penalty'],
                    "risk_status": r['risk_flag'],
                    "reason": reason_map.get(r['promo_type'], "Best fit for profile")
                } for r in top_3
            ]
        }
        
        # Segment fix
        if p_row.get('value_segment_VIP', 0) == 1: p_profile['segment'] = 'VIP'
        elif p_row.get('value_segment_HighRoller', 0) == 1: p_profile['segment'] = 'HighRoller'
        elif p_row.get('value_segment_Core', 0) == 1: p_profile['segment'] = 'Core'
        else: p_profile['segment'] = 'Casual'

        recommendations_list.append(p_profile)
        
    # Save to Frontend - Handle NaNs
    output_path = "src/data/recommendations.json"
    import os
    import math
    os.makedirs("src/data", exist_ok=True)
    
    def sanitize(obj):
        if isinstance(obj, dict):
            return {k: sanitize(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [sanitize(v) for v in obj]
        elif isinstance(obj, float):
            return 0.0 if math.isnan(obj) or math.isinf(obj) else obj
        elif isinstance(obj, (np.floating, np.integer)):
            return sanitize(obj.item()) # Convert numpy to python scalar
        return obj

    clean_data = sanitize(recommendations_list)
    
    with open(output_path, 'w') as f:
        json.dump(clean_data, f, indent=2)
        
    logger.info(f"Saved recommendations for {n_players} players to {output_path}")

if __name__ == "__main__":
    generate_recommendations()
