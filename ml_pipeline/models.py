import pandas as pd
import numpy as np
# import xgboost as xgb # Use sklearn fallback due to libomp issue on Mac
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.preprocessing import OrdinalEncoder
from sklearn.model_selection import GroupKFold
from sklearn.metrics import roc_auc_score, f1_score, precision_recall_curve, auc
import shap
import json
import pickle
import joblib
from .utils import DATA_DIR, MODELS_DIR, PLOTS_DIR, RESULTS_DIR, get_logger
from .crg_layer import CRGScorer
import matplotlib
matplotlib.use('Agg') # Non-interactive backend
import matplotlib.pyplot as plt

logger = get_logger("train_models")

def train_and_eval():
    logger.info("Loading training data...")
    df = pd.read_csv(f"{DATA_DIR}/train_data.csv")
    
    # Feature columns
    exclude_cols = ['player_id', 'promo_timestamp', 'engaged', 'event_id']
    # 'promo_type' is kept as feature but must be encoded
    
    # Identify categoricals
    cat_cols = ['promo_type', 'country', 'currency', 'age_group']
    # Check what columns exist
    existing_cats = [c for c in cat_cols if c in df.columns]
    
    # Encode categorical columns for sklearn
    if existing_cats:
        enc = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
        df[existing_cats] = enc.fit_transform(df[existing_cats])
        # Save encoder
        joblib.dump(enc, f"{MODELS_DIR}/encoder.pkl")
    
    features = [c for c in df.columns if c not in exclude_cols]
    target = 'engaged'
    group_col = 'player_id'
    
    X = df[features]
    y = df[target]
    groups = df[group_col]
    
    # K-Fold Split
    gkf = GroupKFold(n_splits=5)
    
    fold = 0
    metrics = []
    
    # Train only on first fold
    for train_idx, val_idx in gkf.split(X, y, groups):
        fold += 1
        logger.info(f"Training Fold {fold} (using HistGradientBoosting)...")
        
        X_train, y_train = X.iloc[train_idx], y.iloc[train_idx]
        X_val, y_val = X.iloc[val_idx], y.iloc[val_idx]
        
        model = HistGradientBoostingClassifier(
            loss='log_loss', max_iter=100, learning_rate=0.1,
            max_depth=6, l2_regularization=0.1,
            early_stopping=True
        )
        
        model.fit(X_train, y_train)
        
        # Eval
        y_pred = model.predict_proba(X_val)[:, 1]
        auc_score = roc_auc_score(y_val, y_pred)
        precision, recall, _ = precision_recall_curve(y_val, y_pred)
        pr_auc = auc(recall, precision)
        
        logger.info(f"Fold {fold} - AUC: {auc_score:.4f}, PR-AUC: {pr_auc:.4f}")
        metrics.append({'fold': fold, 'auc': auc_score, 'pr_auc': pr_auc})
        
        # Save Model Artifacts
        if fold == 1:
            joblib.dump(model, f"{MODELS_DIR}/xgboost_model.pkl") # Kept name for consistency
            joblib.dump(features, f"{MODELS_DIR}/features.pkl")
            
            # Feature Importance
            try:
                # Validation perm importance or SHAP
                explainer = shap.Explainer(model.predict, X_val.sample(100))
                # shap_values = explainer(X_val.sample(100))
                # Just saving explainer if needed, skipping heavy plot generation
            except Exception as e:
                logger.warning(f"SHAP calculation skipped: {e}")
            
            # Save metrics
            with open(f"{RESULTS_DIR}/metrics.json", 'w') as f:
                json.dump(metrics, f)
            
            # CRG Layer Validation
            logger.info("Running CRG Validation on Fold 1...")
            val_df = X_val.copy()
            val_df['pred_prob'] = y_pred
            val_df['player_id'] = df.iloc[val_idx]['player_id'] 
            
            scorer = CRGScorer()
            results = []
            for idx, row in val_df.iterrows():
                stats = {
                    'loss_ratio_7d': row.get('loss_ratio_7d', 0),
                    'deposit_burst_flag': row.get('deposit_burst_flag', 0),
                    'avg_session_duration_30d': row.get('avg_session_duration_30d', 0),
                    'hours_since_major_loss': row.get('hours_since_major_loss', 999)
                }
                score = scorer.score_player(stats)
                action, _ = scorer.determine_action(score)
                results.append({'player_id': row['player_id'], 'crg_score': score, 'action': action})
            
            res_df = pd.DataFrame(results)
            logger.info(f"CRG Blocked: {len(res_df[res_df['action']=='BLOCK'])} players")
            res_df.to_csv(f"{RESULTS_DIR}/crg_analysis.csv", index=False)

            break

if __name__ == "__main__":
    train_and_eval()
