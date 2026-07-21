export interface MarketSelection {
  id: string;
  name: string;
  oddsDec: number;
  oddsFrac: string;
}

export interface MatchMarket {
  name: string;
  type: string;
  selections: MarketSelection[];
}

export interface SportsMatch {
  id: string;
  sport: 'Football' | 'Basketball' | 'Tennis' | 'Esports';
  league: string;
  homeTeam: string;
  awayTeam: string;
  isLive: boolean;
  score?: { home: number; away: number };
  gameClock?: string; // '65:32', 'HT'
  markets: MatchMarket[];
}

export const DUMMY_SPORTS_DATA: SportsMatch[] = [
  {
    id: 'm1',
    sport: 'Football',
    league: 'UEFA Champions League',
    homeTeam: 'Real Madrid',
    awayTeam: 'Manchester City',
    isLive: true,
    score: { home: 1, away: 1 },
    gameClock: '68:14',
    markets: [
      {
        name: 'Match Winner', type: '1x2', selections: [
          { id: 'm1_1', name: 'Real Madrid', oddsDec: 2.80, oddsFrac: '9/5' },
          { id: 'm1_X', name: 'Draw', oddsDec: 1.95, oddsFrac: '19/20' },
          { id: 'm1_2', name: 'Manchester City', oddsDec: 3.10, oddsFrac: '21/10' },
        ]
      },
      {
        name: 'Next Goal', type: 'next_goal', selections: [
          { id: 'm1_ng1', name: 'Real Madrid', oddsDec: 2.45, oddsFrac: '29/20' },
          { id: 'm1_ngX', name: 'No Goal', oddsDec: 2.10, oddsFrac: '11/10' },
          { id: 'm1_ng2', name: 'Manchester City', oddsDec: 2.60, oddsFrac: '8/5' },
        ]
      }
    ]
  },
  {
    id: 'm2',
    sport: 'Football',
    league: 'English Premier League',
    homeTeam: 'Arsenal',
    awayTeam: 'Liverpool',
    isLive: false,
    gameClock: 'Tomorrow, 17:30',
    markets: [
      {
        name: 'Match Winner', type: '1x2', selections: [
          { id: 'm2_1', name: 'Arsenal', oddsDec: 2.50, oddsFrac: '6/4' },
          { id: 'm2_X', name: 'Draw', oddsDec: 3.40, oddsFrac: '12/5' },
          { id: 'm2_2', name: 'Liverpool', oddsDec: 2.70, oddsFrac: '17/10' },
        ]
      },
      {
        name: 'Total Goals - Over/Under 2.5', type: 'ou', selections: [
          { id: 'm2_o25', name: 'Over 2.5', oddsDec: 1.85, oddsFrac: '17/20' },
          { id: 'm2_u25', name: 'Under 2.5', oddsDec: 1.95, oddsFrac: '19/20' },
        ]
      }
    ]
  },
  {
    id: 'm3',
    sport: 'Basketball',
    league: 'NBA',
    homeTeam: 'Boston Celtics',
    awayTeam: 'Denver Nuggets',
    isLive: true,
    score: { home: 102, away: 98 },
    gameClock: 'Q4 02:45',
    markets: [
      {
        name: 'Moneyline', type: '12', selections: [
          { id: 'm3_1', name: 'Boston Celtics', oddsDec: 1.35, oddsFrac: '7/20' },
          { id: 'm3_2', name: 'Denver Nuggets', oddsDec: 3.20, oddsFrac: '11/5' },
        ]
      },
      {
        name: 'Total Points', type: 'ou', selections: [
          { id: 'm3_o215', name: 'Over 215.5', oddsDec: 1.90, oddsFrac: '9/10' },
          { id: 'm3_u215', name: 'Under 215.5', oddsDec: 1.90, oddsFrac: '9/10' },
        ]
      }
    ]
  },
  {
    id: 'm4',
    sport: 'Tennis',
    league: 'ATP Masters 1000',
    homeTeam: 'C. Alcaraz',
    awayTeam: 'J. Sinner',
    isLive: false,
    gameClock: 'Today, 20:00',
    markets: [
      {
        name: 'Match Winner', type: '12', selections: [
          { id: 'm4_1', name: 'C. Alcaraz', oddsDec: 1.80, oddsFrac: '4/5' },
          { id: 'm4_2', name: 'J. Sinner', oddsDec: 2.05, oddsFrac: '21/20' },
        ]
      }
    ]
  },
  {
    id: 'm5',
    sport: 'Football',
    league: 'La Liga',
    homeTeam: 'Barcelona',
    awayTeam: 'Girona',
    isLive: true,
    score: { home: 2, away: 0 },
    gameClock: 'HT',
    markets: [
      {
        name: 'Match Winner', type: '1x2', selections: [
          { id: 'm5_1', name: 'Barcelona', oddsDec: 1.10, oddsFrac: '1/10' },
          { id: 'm5_X', name: 'Draw', oddsDec: 8.50, oddsFrac: '15/2' },
          { id: 'm5_2', name: 'Girona', oddsDec: 18.00, oddsFrac: '17/1' },
        ]
      }
    ]
  }
];
