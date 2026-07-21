import numpy as np
import pandas as pd

class CRGScorer:
    def __init__(self):
        self.thresholds = {
            'loss_ratio_7d': {'low': 0.3, 'moderate': 0.6},
            'deposit_burst': {'low': 2, 'moderate': 4},
            'session_duration': {'low': 30, 'moderate': 60},
            'cooling_off': {'high': 24, 'moderate': 48} # Reversed: lower hours = higher risk
        }
    
    def calculate_s_score(self, value, metric):
        th = self.thresholds[metric]
        
        if metric == 'cooling_off':
            if value < th['high']: return 100
            elif value < th['moderate']: return 50
            return 0
        else:
            if value >= th['moderate']: return 100
            elif value >= th['low']: return 50
            return 0

    def score_player(self, player_stats):
        """
        Calculates weighted CRG score.
        player_stats: dict or Series with risk metrics
        """
        s_loss = self.calculate_s_score(player_stats.get('loss_ratio_7d', 0), 'loss_ratio_7d')
        s_burst = self.calculate_s_score(player_stats.get('deposit_burst_flag', 0), 'deposit_burst')
        s_session = self.calculate_s_score(player_stats.get('avg_session_duration_30d', 0), 'session_duration')
        s_cool = self.calculate_s_score(player_stats.get('hours_since_major_loss', 999), 'cooling_off')
        
        score = (s_loss * 0.40) + (s_burst * 0.30) + (s_session * 0.15) + (s_cool * 0.15)
        return score

    def determine_action(self, crg_score):
        if crg_score >= 60:
            return "BLOCK", 0.0
        elif crg_score >= 40:
            return "DOWNGRADE", 0.5
        else:
            return "ALLOW", 1.0

    def apply_crg_layer(self, predictions_df):
        """
        Applies CRG logic to a DataFrame of model predictions.
        Must contain risk feature columns.
        """
        results = []
        for _, row in predictions_df.iterrows():
            score = self.score_player(row)
            action, multiplier = self.determine_action(score)
            
            final_prob = row['pred_prob'] * multiplier
            
            results.append({
                'player_id': row.get('player_id'),
                'raw_score': row['pred_prob'],
                'crg_score': score,
                'risk_action': action,
                'final_score': final_prob
            })
            
        return pd.DataFrame(results)
