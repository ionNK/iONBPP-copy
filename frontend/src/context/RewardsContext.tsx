'use client';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'VIP';

export interface RewardItem {
    id: string;
    name: string;
    type: 'free_bet' | 'bonus' | 'odds_boost' | 'exclusive' | 'insurance';
    description: string;
    value: number;
    pointPrice: number; // consistent with store naming
    minTier: Tier;
    expiryDays: number;
    constraints?: string;
}

export interface PointsTransaction {
    id: string;
    date: string;
    description: string;
    points: number;
    type: 'earn' | 'redeem' | 'expire';
}

export interface ActiveReward extends RewardItem {
    redeemedDate: string;
    expiryDate: string;
    isUsed: boolean;
}

interface RewardsContextType {
    points: number;
    currentTier: Tier;
    tierProgress: number; 
    pointsToNextTier: number;
    transactionHistory: PointsTransaction[];
    activeRewards: ActiveReward[];
    redeemReward: (id: string) => { success: boolean; message: string };
    addPoints: (amount: number, description: string) => void;
    useActiveReward: (id: string) => void;
}

const RewardsContext = createContext<RewardsContextType | undefined>(undefined);

export const TIERS: { name: Tier; minPoints: number; multiplier: number; benefits: string[] }[] = [
    { name: 'Bronze', minPoints: 0, multiplier: 1.0, benefits: ['Standard support', 'Daily wheel spin'] },
    { name: 'Silver', minPoints: 1000, multiplier: 1.5, benefits: ['10% Weekly cashback', 'Faster withdrawals'] },
    { name: 'Gold', minPoints: 5000, multiplier: 2.0, benefits: ['Dedicated host', 'Gold exclusive free bets'] },
    { name: 'Platinum', minPoints: 15000, multiplier: 3.0, benefits: ['VIP event access', 'Express withdrawals'] },
    { name: 'VIP', minPoints: 50000, multiplier: 5.0, benefits: ['Personal manager', 'Customized bonuses'] },
];

export const AVAILABLE_REWARDS: RewardItem[] = [
    { id: 'fb-200', name: 'KES 200 Free Bet', type: 'free_bet', description: 'Standard sportsbook free bet', value: 200, pointPrice: 500, minTier: 'Bronze', expiryDays: 7, constraints: 'Min odds 1.5' },
    { id: 'fb-500', name: 'KES 500 Free Bet', type: 'free_bet', description: 'Silver tier free bet', value: 500, pointPrice: 1000, minTier: 'Silver', expiryDays: 7, constraints: 'Min odds 2.0' },
    { id: 'fb-1000', name: 'KES 1,000 Free Bet', type: 'free_bet', description: 'Premium gold tier free bet', value: 1000, pointPrice: 2000, minTier: 'Gold', expiryDays: 14, constraints: 'Min odds 1.8' },
    { id: 'fb-2500', name: 'KES 2,500 Free Bet', type: 'free_bet', description: 'Elite reward for platinum members', value: 2500, pointPrice: 4500, minTier: 'Platinum', expiryDays: 14, constraints: 'Min odds 2.0' },
    { id: 'fb-5000', name: 'KES 5,000 Free Bet', type: 'free_bet', description: 'VIP exclusive high roller bet', value: 5000, pointPrice: 8000, minTier: 'VIP', expiryDays: 30, constraints: 'Min odds 2.5' },
    
    { id: 'bn-500', name: 'KES 500 Bonus', type: 'bonus', description: 'General bonus balance credit', value: 500, pointPrice: 800, minTier: 'Bronze', expiryDays: 30, constraints: '5x wagering, min odds 1.8' },
    { id: 'bn-1500', name: 'KES 1,500 Bonus', type: 'bonus', description: 'Standard bonus credit', value: 1500, pointPrice: 2500, minTier: 'Silver', expiryDays: 30, constraints: '5x wagering, min odds 1.8' },
    { id: 'bn-3000', name: 'KES 3,000 Bonus', type: 'bonus', description: 'High value reward credit', value: 3000, pointPrice: 5000, minTier: 'Gold', expiryDays: 30, constraints: '4x wagering, min odds 1.5' },
    
    { id: 'ob-10', name: '10% Odds Boost', type: 'odds_boost', description: 'Profit boost on single match', value: 0.1, pointPrice: 300, minTier: 'Bronze', expiryDays: 5, constraints: 'Max KES 1,000 stake' },
    { id: 'ob-25', name: '25% Odds Boost', type: 'odds_boost', description: 'Medium profit boost', value: 0.25, pointPrice: 700, minTier: 'Silver', expiryDays: 5, constraints: 'Max KES 2,000 stake' },
    { id: 'ob-50', name: '50% Odds Boost', type: 'odds_boost', description: 'Large accumulator boost', value: 0.5, pointPrice: 1500, minTier: 'Platinum', expiryDays: 7, constraints: 'Max KES 5,000 stake' },
    { id: 'ob-100', name: '100% Odds Boost', type: 'odds_boost', description: 'VIP Profit Doubler', value: 1.0, pointPrice: 3000, minTier: 'VIP', expiryDays: 7, constraints: 'Max KES 10,000 stake' },
    
    { id: 'ai-3', name: '3-Leg Acca Insurance', type: 'insurance', description: 'Safety net for multi-bets', value: 0, pointPrice: 600, minTier: 'Bronze', expiryDays: 7, constraints: 'Refund as free bet if one loses' },
    { id: 'ai-5', name: '5-Leg Acca Insurance', type: 'insurance', description: 'Premium multi-bet net', value: 0, pointPrice: 1200, minTier: 'Gold', expiryDays: 7, constraints: 'Refund as free bet if one loses' },
];

export const REWARD_ITEMS = AVAILABLE_REWARDS;

export function RewardsProvider({ children }: { children: ReactNode }) {
    const [points, setPoints] = useState(6240);
    const [activeRewards, setActiveRewards] = useState<ActiveReward[]>([
        {
            id: 'fb-active-1',
            name: 'KES 500 Free Bet',
            type: 'free_bet',
            description: 'Silver tier free bet',
            value: 500,
            pointPrice: 1000,
            minTier: 'Silver',
            expiryDays: 7,
            constraints: 'Min odds 2.0',
            redeemedDate: '2026-04-16',
            expiryDate: '2026-04-23',
            isUsed: false
        },
        {
            id: 'ob-active-1',
            name: '10% Odds Boost',
            type: 'odds_boost',
            description: 'Profit boost on single match',
            value: 0.1,
            pointPrice: 300,
            minTier: 'Bronze',
            expiryDays: 5,
            constraints: 'Max KES 1,000 stake',
            redeemedDate: '2026-04-17',
            expiryDate: '2026-04-22',
            isUsed: false
        }
    ]);
    
    const [transactionHistory, setTransactionHistory] = useState<PointsTransaction[]>([
        { id: 'h1', date: '2026-04-18', description: 'Bet settled — Real Madrid vs Man City', points: 45, type: 'earn' },
        { id: 'h2', date: '2026-04-17', description: 'Daily login streak bonus', points: 10, type: 'earn' },
        { id: 'h3', date: '2026-04-16', description: 'KES 500 Free Bet redemption', points: -1000, type: 'redeem' },
        { id: 'h4', date: '2026-04-15', description: 'Bet settled — Arsenal vs Bayern', points: 120, type: 'earn' },
        { id: 'h5', date: '2026-04-14', description: '10% Odds Boost redemption', points: -300, type: 'redeem' },
        { id: 'h6', date: '2026-04-13', description: 'First deposit bonus', points: 50, type: 'earn' },
        { id: 'h7', date: '2026-04-12', description: 'Referral bonus awarded', points: 200, type: 'earn' },
        { id: 'h8', date: '2026-04-11', description: 'Birthday gift points', points: 500, type: 'earn' },
        { id: 'h9', date: '2026-04-10', description: 'Bet settled — Liverpool vs Atalanta', points: 85, type: 'earn' },
        { id: 'h10', date: '2026-04-09', description: 'High value deposit bonus', points: 100, type: 'earn' },
    ]);

    const getCurrentTierState = () => {
        let current = TIERS[0];
        let nextIndex = 1;
        for (let i = 0; i < TIERS.length; i++) {
            if (points >= TIERS[i].minPoints) {
                current = TIERS[i];
                nextIndex = i + 1;
            } else {
                break;
            }
        }
        const next = TIERS[nextIndex] || TIERS[TIERS.length - 1];
        const range = next.minPoints - current.minPoints;
        const progressInTier = points - current.minPoints;
        const percent = nextIndex >= TIERS.length ? 100 : Math.min(100, (progressInTier / range) * 100);

        return {
            tier: current.name,
            progress: percent,
            toNext: nextIndex >= TIERS.length ? 0 : next.minPoints - points
        };
    };

    const tierState = getCurrentTierState();

    const redeemReward = (id: string) => {
        const reward = AVAILABLE_REWARDS.find(r => r.id === id);
        if (!reward) return { success: false, message: 'Reward not found' };
        if (points < reward.pointPrice) return { success: false, message: 'Insufficient points' };

        const tierLevels: Record<Tier, number> = { Bronze: 0, Silver: 1, Gold: 2, Platinum: 3, VIP: 4 };
        if (tierLevels[tierState.tier] < tierLevels[reward.minTier]) {
            return { success: false, message: `Redemption requires ${reward.minTier} tier` };
        }

        const now = new Date();
        const expiry = new Date();
        expiry.setDate(now.getDate() + reward.expiryDays);

        const newActiveReward: ActiveReward = {
            ...reward,
            id: `ar-${Date.now()}`,
            redeemedDate: now.toISOString().split('T')[0],
            expiryDate: expiry.toISOString().split('T')[0],
            isUsed: false
        };

        setPoints(prev => prev - reward.pointPrice);
        setActiveRewards(prev => [newActiveReward, ...prev]);
        setTransactionHistory(prev => [{
            id: 'tx-' + Date.now(),
            date: now.toISOString().split('T')[0],
            description: `${reward.name} redemption`,
            points: -reward.pointPrice,
            type: 'redeem'
        }, ...prev]);

        return { success: true, message: 'Success' };
    };

    const addPoints = (amount: number, description: string) => {
        const rounded = Math.floor(amount);
        if (rounded <= 0) return;
        
        setPoints(prev => prev + rounded);
        setTransactionHistory(prev => [{
            id: 'tx-' + Date.now(),
            date: new Date().toISOString().split('T')[0],
            description,
            points: rounded,
            type: 'earn'
        }, ...prev]);
    };

    const useActiveReward = (id: string) => {
        setActiveRewards(prev => prev.map(r => r.id === id ? { ...r, isUsed: true } : r));
    };

    return (
        <RewardsContext.Provider value={{
            points,
            currentTier: tierState.tier,
            tierProgress: tierState.progress,
            pointsToNextTier: tierState.toNext,
            transactionHistory,
            activeRewards: activeRewards.filter(r => !r.isUsed),
            redeemReward,
            addPoints,
            useActiveReward
        }}>
            {children}
        </RewardsContext.Provider>
    );
}

export const useRewards = () => {
    const context = useContext(RewardsContext);
    if (!context) throw new Error('useRewards must be used within a RewardsProvider');
    return context;
};
