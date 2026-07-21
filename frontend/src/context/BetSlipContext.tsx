'use client';
import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { CombinationType, getAvailableCombinations, calculateCombinatoricsReturn } from '@/utils/combinatorics';
import { useRewards, TIERS } from './RewardsContext';

export interface BetSelection {
  id: string;
  matchId: string;
  matchName: string;
  marketName: string;
  selectionName: string;
  oddsDec: number;
  oddsFrac: string;
}

export type RewardType = 'cash' | 'free_bet' | 'bonus' | 'odds_boost' | 'insurance';

export interface FundingSource {
  id: string;
  type: RewardType;
  name: string;
  balance: number;
  minOdds?: number;
  maxStake?: number;
  description?: string;
  boostMultiplier?: number;
  rewardId?: string; // Link to active reward
}

export interface FinancialBreakdown {
  grossStake: number;
  exciseDuty: number;
  netStake: number;
  grossReturn: number;
  grossWinnings: number;
  whtDeduction: number;
  netPayout: number;
  netProfit: number;
  baseCombinedOdds: number;
  pointsEarned: number;
}

export interface PlacedBetRecord {
   id: string;
   datePlaced: string;
   selections: BetSelection[];
   combiDescs: string[]; 
   breakdown: FinancialBreakdown;
   totalStake: number; 
   fundingSource: string;
   status: 'open' | 'won' | 'lost' | 'cashed_out' | 'void';
   cashOutValue?: number;
}

const EXCISE_DUTY_RATE = 0.075; 
const WHT_RATE = 0.20; 

interface BetSlipContextType {
  selections: BetSelection[];
  stakes: Partial<Record<CombinationType, number>>;
  oddsFormat: 'decimal' | 'fractional';
  isSlipOpen: boolean;
  selectedFundingId: string;
  isEachWay: boolean;
  activeTab: 'betslip' | 'mybets' | 'settled';
  
  openBets: PlacedBetRecord[];
  settledBets: PlacedBetRecord[];

  addSelection: (selection: BetSelection) => void;
  removeSelection: (id: string) => void;
  clearSlip: () => void;
  updateStake: (type: CombinationType, amount: number) => void;
  toggleOddsFormat: () => void;
  setSlipOpen: (isOpen: boolean) => void;
  setSelectedFundingId: (id: string) => void;
  setIsEachWay: (val: boolean) => void;
  setActiveTab: (tab: 'betslip' | 'mybets' | 'settled') => void;
  
  getCombinedOdds: () => number;
  isFundingRestricted: (source: FundingSource) => { restricted: boolean; reason: string };
  getActiveFunding: () => FundingSource;
  getAvailableFundingSources: () => FundingSource[];
  
  getKRAFinancials: () => FinancialBreakdown;
  
  placeBet: () => void;
  cashOutBet: (id: string) => void;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const { currentTier, activeRewards, addPoints, useActiveReward } = useRewards();
  
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [stakes, setStakes] = useState<Partial<Record<CombinationType, number>>>({});
  const [oddsFormat, setOddsFormat] = useState<'decimal' | 'fractional'>('decimal');
  const [isSlipOpen, setSlipOpen] = useState<boolean>(false);
  const [selectedFundingId, setSelectedFundingId] = useState<string>('cash');
  const [isEachWay, setIsEachWay] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'betslip' | 'mybets' | 'settled'>('betslip');

  const [openBets, setOpenBets] = useState<PlacedBetRecord[]>([]);
  const [settledBets, setSettledBets] = useState<PlacedBetRecord[]>([]);
  
  const availableFunding = useMemo(() => {
     const base: FundingSource[] = [
        { id: 'cash', type: 'cash', name: 'Cash Balance', balance: 1250.00 },
        { id: 'bonus', type: 'bonus', name: 'Bonus Balance', balance: 1500.00, minOdds: 1.8, description: '4x wagering required.'}
     ];

     const rewards: FundingSource[] = activeRewards.map(r => ({
        id: r.id,
        type: r.type as any,
        name: r.name,
        balance: r.value,
        minOdds: Number(r.constraints?.match(/min odds (\d+\.\d+)/i)?.[1]) || undefined,
        description: r.constraints,
        boostMultiplier: r.type === 'odds_boost' ? (1 + r.value) : undefined,
        rewardId: r.id
     }));

     return [...base, ...rewards];
  }, [activeRewards]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('betika_betslip_rewards_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selections) setSelections(parsed.selections);
        if (parsed.stakes) setStakes(parsed.stakes);
        if (parsed.openBets) setOpenBets(parsed.openBets);
        if (parsed.settledBets) setSettledBets(parsed.settledBets);
      }
    } catch(e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem('betika_betslip_rewards_v1', JSON.stringify({ selections, stakes, openBets, settledBets }));
  }, [selections, stakes, openBets, settledBets]);

  const addSelection = (selection: BetSelection) => {
    setSelections((prev) => {
      const filtered = prev.filter(p => !(p.matchId === selection.matchId && p.marketName === selection.marketName));
      return [...filtered, selection];
    });
    setSlipOpen(true);
    setActiveTab('betslip');
  };

  const removeSelection = (id: string) => {
      setSelections((prev) => prev.filter(s => s.id !== id));
      setStakes({});
  };
  const clearSlip = () => {
     setSelections([]);
     setStakes({});
  };
  const updateStake = (type: CombinationType, amount: number) => {
      setStakes(prev => ({ ...prev, [type]: amount }));
  };

  const toggleOddsFormat = () => setOddsFormat(prev => prev === 'decimal' ? 'fractional' : 'decimal');
  const getCombinedOdds = () => selections.length === 0 ? 0 : selections.reduce((acc, curr) => acc * curr.oddsDec, 1);
  const getActiveFunding = () => availableFunding.find(f => f.id === selectedFundingId) || availableFunding[0];
  const getAvailableFundingSources = () => availableFunding;

  const isFundingRestricted = (source: FundingSource) => {
      if (selections.length === 0) return { restricted: false, reason: '' };
      const minOddsAcrossBoard = Math.min(...selections.map(s => s.oddsDec));
      if (source.minOdds && minOddsAcrossBoard < source.minOdds) {
          return { restricted: true, reason: `Min odds ${source.minOdds} required` };
      }
      return { restricted: false, reason: '' };
  };

  const getKRAFinancials = (): FinancialBreakdown => {
      const activeFunding = getActiveFunding();
      const oddsArray = selections.map(s => s.oddsDec);
      const isFreeBet = activeFunding.type === 'free_bet';
      const isBoost = activeFunding.type === 'odds_boost';
      
      let rawGrossStakeInput = 0;
      const combs = getAvailableCombinations(selections.length);
      combs.forEach(c => {
          if (stakes[c.type]) {
              const ewMultiplier = isEachWay ? 2 : 1;
              rawGrossStakeInput += (stakes[c.type]! * c.lines) * ewMultiplier;
          }
      });

      const grossStake = isFreeBet ? activeFunding.balance : rawGrossStakeInput;
      const exciseDuty = isFreeBet ? 0 : grossStake * EXCISE_DUTY_RATE;
      const netStake = grossStake - exciseDuty;

      let rawGrossReturn = 0;
      const ewMultiplierFactor = isEachWay ? 1.25 : 1; 
      
      if (isFreeBet) {
          rawGrossReturn = netStake * getCombinedOdds();
      } else {
         const stakePerUnit = grossStake > 0 ? (netStake / grossStake) : 0; 
         combs.forEach(c => {
            if (stakes[c.type]) {
               rawGrossReturn += calculateCombinatoricsReturn(oddsArray, c.type, stakes[c.type]! * stakePerUnit) * ewMultiplierFactor;
            }
         });
      }

      if (isBoost && activeFunding.boostMultiplier) {
          const originalProfit = Math.max(0, rawGrossReturn - netStake);
          rawGrossReturn = netStake + (originalProfit * activeFunding.boostMultiplier);
      }

      let grossWinnings = rawGrossReturn - netStake;
      if (grossWinnings < 0) grossWinnings = 0;
      const whtDeduction = grossWinnings * WHT_RATE;
      
      const netPayout = isFreeBet ? (grossWinnings - whtDeduction) : (rawGrossReturn - whtDeduction);
      
      // Calculate Potential Points
      const tierConfig = TIERS.find(t => t.name === currentTier) || TIERS[0];
      const pointsEarned = Math.floor((grossStake / 100) * tierConfig.multiplier);

      return {
          grossStake,
          exciseDuty,
          netStake,
          grossReturn: rawGrossReturn,
          grossWinnings,
          whtDeduction,
          netPayout,
          netProfit: netPayout - grossStake,
          baseCombinedOdds: getCombinedOdds(),
          pointsEarned
      };
  };

  const placeBet = () => {
      const financials = getKRAFinancials();
      const funding = getActiveFunding();
      
      const descs: string[] = [];
      const combs = getAvailableCombinations(selections.length);
      combs.forEach(c => {
          if (stakes[c.type]) descs.push(`${c.label} @ KES ${stakes[c.type]!.toLocaleString()}`);
      });

      const newBet: PlacedBetRecord = {
          id: 'BK' + Math.floor(Math.random() * 900000 + 100000),
          datePlaced: new Date().toISOString(),
          selections: [...selections],
          combiDescs: descs,
          breakdown: financials,
          totalStake: financials.grossStake,
          fundingSource: funding.name,
          status: 'open',
          cashOutValue: financials.grossStake * 0.9 
      };

      if (funding.rewardId) {
          useActiveReward(funding.rewardId);
          setSelectedFundingId('cash');
      }

      // Add points
      addPoints(financials.pointsEarned, `Bet placed — ${descs[0] || 'Sportsbook'}`);

      setOpenBets([newBet, ...openBets]);
      clearSlip();
  };

  const cashOutBet = (id: string) => {
      setOpenBets(prev => {
          const b = prev.find(x => x.id === id);
          if (b) {
              setSettledBets([{...b, status: 'cashed_out', breakdown: { ...b.breakdown, netPayout: b.cashOutValue || 0 }}, ...settledBets]);
          }
          return prev.filter(x => x.id !== id);
      });
  };

  return (
    <BetSlipContext.Provider value={{
      selections, stakes, oddsFormat, isSlipOpen, selectedFundingId, isEachWay, activeTab,
      openBets, settledBets,
      addSelection, removeSelection, clearSlip, updateStake, toggleOddsFormat, setSlipOpen, setSelectedFundingId, setIsEachWay, setActiveTab,
      getCombinedOdds, isFundingRestricted, getActiveFunding, getAvailableFundingSources, getKRAFinancials,
      placeBet, cashOutBet
    }}>
      {children}
    </BetSlipContext.Provider>
  );
}

export const useBetSlip = () => {
  const context = useContext(BetSlipContext);
  if (!context) throw new Error('useBetSlip must be used within a BetSlipProvider');
  return context;
};
