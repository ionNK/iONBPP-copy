import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from .utils import DATA_DIR, RESULTS_DIR, PLOTS_DIR, get_logger

logger = get_logger("visualize")

def run_visualizations():
    logger.info("Generating visualizations...")
    
    # Load Data
    crg_df = pd.read_csv(f"{RESULTS_DIR}/crg_analysis.csv")
    players = pd.read_csv(f"{DATA_DIR}/players.csv")
    
    # Merge for segment info
    merged = crg_df.merge(players[['player_id', 'value_segment']], on='player_id', how='left')
    
    # 1. Risk Level Distribution
    plt.figure(figsize=(10, 6))
    sns.countplot(data=merged, x='action', palette={'ALLOW': 'green', 'DOWNGRADE': 'orange', 'BLOCK': 'red'})
    plt.title("CRG Risk Action Distribution")
    plt.savefig(f"{PLOTS_DIR}/risk_distribution.png")
    plt.close()
    
    # 2. Risk by Segment
    plt.figure(figsize=(12, 6))
    sns.countplot(data=merged, x='value_segment', hue='action', hue_order=['ALLOW', 'DOWNGRADE', 'BLOCK'])
    plt.title("Risk Distribution by Segment")
    plt.savefig(f"{PLOTS_DIR}/risk_by_segment.png")
    plt.close()
    
    # 3. CRG Score Histogram
    plt.figure(figsize=(10, 6))
    sns.histplot(merged['crg_score'], bins=20, kde=True)
    plt.axvline(x=40, color='orange', linestyle='--', label='Downgrade Threshold (40)')
    plt.axvline(x=60, color='red', linestyle='--', label='Block Threshold (60)')
    plt.legend()
    plt.title("CRG Score Distribution")
    plt.savefig(f"{PLOTS_DIR}/crg_score_histogram.png")
    plt.close()
    
    logger.info(f"Visualizations saved to {PLOTS_DIR}")

if __name__ == "__main__":
    run_visualizations()
