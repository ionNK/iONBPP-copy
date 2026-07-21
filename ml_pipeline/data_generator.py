import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import argparse
from tqdm import tqdm
import os
from .utils import DATA_DIR, get_logger

logger = get_logger("data_gen")

# --- Constants ---
SEGMENTS = ["Casual", "Core", "HighRoller", "VIP"]
SEGMENT_PROBS = [0.45, 0.35, 0.15, 0.05]

AGE_GROUPS = ["18-24", "25-34", "35-44", "45-54", "55+"]
AGE_PROBS = [0.25, 0.35, 0.22, 0.12, 0.06]

GENDER = ["M", "F"]
GENDER_PROBS = [0.72, 0.28]

PROMO_TYPES = [
    "AccaInsurance", "Mission", "Activation", "Cashback", 
    "ReloadBonus", "DepositAndGet", "ReAcquisition"
]
PROMO_BASE_RATES = {
    "AccaInsurance": 0.28, "Mission": 0.30, "Activation": 0.25,
    "Cashback": 0.32, "ReloadBonus": 0.35, "DepositAndGet": 0.33,
    "ReAcquisition": 0.22
}

SEGMENT_MULTIPLIERS = {
    "Casual": 0.8, "Core": 1.0, "HighRoller": 1.2, "VIP": 1.4
}

# Activity Params (Avg Deposits, Avg Bets, Avg Stake)
ACTIVITY_PARAMS = {
    "Casual":     {"dep_freq": 8,  "bet_freq": 35,   "stake": 100},
    "Core":       {"dep_freq": 15, "bet_freq": 55,   "stake": 300},
    "HighRoller": {"dep_freq": 25, "bet_freq": 90,   "stake": 1000},
    "VIP":        {"dep_freq": 40, "bet_freq": 150,  "stake": 3000},
}

def generate_players(n=100000):
    logger.info(f"Generating {n} players...")
    
    ids = [f"P{i:06d}" for i in range(n)]
    segments = np.random.choice(SEGMENTS, size=n, p=SEGMENT_PROBS)
    ages = np.random.choice(AGE_GROUPS, size=n, p=AGE_PROBS)
    genders = np.random.choice(GENDER, size=n, p=GENDER_PROBS)
    latent = np.random.beta(2, 5, size=n) # Skewed towards lower engagement
    
    df = pd.DataFrame({
        "player_id": ids,
        "country": "KE",
        "currency": "KSh",
        "value_segment": segments,
        "age_group": ages,
        "gender": genders,
        "region": np.random.choice(["Nairobi", "Mombasa", "Kisumu", "Nakuru"], size=n),
        "latent_propensity": latent
    })
    
    df.to_csv(f"{DATA_DIR}/players.csv", index=False)
    logger.info("Players saved.")
    return df

def generate_events(players_df, limit_events=6000000):
    logger.info("Generating events...")
    
    all_events = []
    
    # Process in chunks to manage memory
    chunk_size = 10000
    total_players = len(players_df)
    
    # We want approx 6M total events.
    # Scale activity params to match requested total if needed, or just let it flow.
    # 100k players * avg ~60 events = 6M. The params above (8+35=43 for casual, 150+40=190 for VIP)
    # Weighted avg is ~43*0.45 + 70*0.35 + 115*0.15 + 190*0.05 ~= 19 + 24 + 17 + 9 = 69 events/player.
    # That fits well with ~6-7M events.
    
    for i in tqdm(range(0, total_players, chunk_size)):
        chunk = players_df.iloc[i:i+chunk_size]
        
        chunk_events = []
        for _, row in chunk.iterrows():
            seg = row['value_segment']
            pid = row['player_id']
            params = ACTIVITY_PARAMS[seg]
            
            # Number of events for this player (Poisson)
            n_deps = np.random.poisson(params['dep_freq'])
            n_bets = np.random.poisson(params['bet_freq'])
            n_with = np.random.poisson(params['dep_freq'] * 0.2) # Withdrawals rarer
            
            # Deposits
            for _ in range(n_deps):
                amt = np.random.lognormal(mean=np.log(params['stake']*5), sigma=0.5)
                chunk_events.append({
                    "player_id": pid,
                    "event_type": "deposit",
                    "amount": round(amt, 2),
                    "stake": 0, "payout": 0,
                    "timestamp": None # To be filled
                })
                
            # Bets
            for _ in range(n_bets):
                stake = np.random.lognormal(mean=np.log(params['stake']), sigma=0.6)
                # Win prob ~ 90% RTP implies losses. Let's say 20% win rate but wins are larger?
                # Actually, typically hit frequency is 15-30%.
                is_win = np.random.random() < 0.25
                payout = stake * np.random.uniform(1.1, 10.0) if is_win else 0
                
                chunk_events.append({
                    "player_id": pid,
                    "event_type": "bet",
                    "amount": 0,
                    "stake": round(stake, 2),
                    "payout": round(payout, 2),
                    "timestamp": None
                })

            # Withdrawals
            for _ in range(n_with):
                amt = np.random.lognormal(mean=np.log(params['stake']*10), sigma=0.5)
                chunk_events.append({
                    "player_id": pid,
                    "event_type": "withdrawal",
                    "amount": round(amt, 2),
                    "stake": 0, "payout": 0,
                    "timestamp": None
                })
        
        # Vectorized timestamp generation for the chunk
        # Easier: Assign random day of year 2023
        start_date = datetime(2023, 1, 1).timestamp()
        end_date = datetime(2023, 12, 31).timestamp()
        
        # Convert to DF
        events_df = pd.DataFrame(chunk_events)
        if not events_df.empty:
            events_df['ts_raw'] = np.random.uniform(start_date, end_date, size=len(events_df))
            events_df['event_timestamp'] = pd.to_datetime(events_df['ts_raw'], unit='s')
            events_df.sort_values(['player_id', 'event_timestamp'], inplace=True)
            events_df.drop(columns=['ts_raw'], inplace=True)
            
            all_events.append(events_df)
            
    final_events = pd.concat(all_events, ignore_index=True)
    
    # Rename columns to match spec
    final_events.rename(columns={'amount': 'deposit_amount'}, inplace=True) # Withdrawal logic needs adjustment
    
    # Fix withdrawal/deposit amounts
    final_events['withdrawal_amount'] = np.where(final_events['event_type'] == 'withdrawal', final_events['deposit_amount'], 0)
    final_events['deposit_amount'] = np.where(final_events['event_type'] == 'deposit', final_events['deposit_amount'], 0)
    
    final_events['stake_amount'] = final_events['stake']
    final_events['payout_amount'] = final_events['payout']
    final_events.drop(columns=['stake', 'payout'], inplace=True)
    
    # Add IDs
    final_events['event_id'] = [f"E{i:08d}" for i in range(len(final_events))]
    
    logger.info(f"Generated {len(final_events)} events.")
    final_events.to_csv(f"{DATA_DIR}/events.csv", index=False)
    return final_events

def generate_promos(players_df, n_promos=750000):
    logger.info("Generating promo interactions...")
    
    # Each player gets ~7-8 promos
    promos = []
    
    # Vectorized approach
    # We need player_id, promo_type, timestamp, engaging probability
    
    # Sample players with replacement
    sampled_players = players_df.sample(n=n_promos, replace=True)
    
    # Assign types
    types = np.random.choice(PROMO_TYPES, size=n_promos)
    
    # Assign timestamps
    start_date = datetime(2023, 1, 1).timestamp()
    end_date = datetime(2023, 12, 31).timestamp()
    timestamps = pd.to_datetime(np.random.uniform(start_date, end_date, size=n_promos), unit='s')
    
    # Calculate Engagement
    # engagement_prob = base_rate × latent_propensity × segment_multiplier
    base_rates = np.array([PROMO_BASE_RATES[t] for t in types])
    latents = sampled_players['latent_propensity'].values
    segments = sampled_players['value_segment'].values
    multipliers = np.array([SEGMENT_MULTIPLIERS[s] for s in segments])
    
    probs = base_rates * latents * multipliers
    probs = np.clip(probs, 0, 1) # Ensure valid probability
    
    engaged = np.random.binomial(1, probs)
    
    promo_df = pd.DataFrame({
        "player_id": sampled_players['player_id'].values,
        "promo_type": types,
        "promo_timestamp": timestamps,
        "engaged": engaged
    })
    
    promo_df.to_csv(f"{DATA_DIR}/promo_events.csv", index=False)
    logger.info("Promo events saved.")
    return promo_df

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--players", type=int, default=10000) # Default to 10k for speed
    args = parser.parse_args()
    
    from .utils import setup_directories
    setup_directories()
    
    p_df = generate_players(args.players)
    e_df = generate_events(p_df)
    pr_df = generate_promos(p_df, n_promos=args.players * 8)
