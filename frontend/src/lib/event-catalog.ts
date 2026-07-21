
export interface EventParam {
    name: string;
    type: string;
    options?: string[];
}

export interface EventDef {
    id: string;
    label: string;
    params: EventParam[];
}

export interface CatalogCategory {
    label: string;
    events: EventDef[];
}

export const EVENT_CATALOG: Record<string, CatalogCategory> = {
    sports: {
        label: 'Sportsbook',
        events: [
            {
                id: 'bet_placed', label: 'Bet Placed (Prematch)',
                params: [
                    { name: 'Stake', type: 'float' },
                    { name: 'Odds', type: 'float' },
                    { name: 'Sport', type: 'enum', options: ['Football', 'Basketball', 'Tennis', 'Ice Hockey', 'Rugby', 'Cricket', 'Any'] },
                    { name: 'League', type: 'string' },
                    { name: 'Market', type: 'string' },
                    { name: 'Selections Count', type: 'integer' },
                    { name: 'Potential Win', type: 'float' }
                ]
            },
            {
                id: 'live_bet_placed', label: 'Live Bet Placed',
                params: [
                    { name: 'Stake', type: 'float' },
                    { name: 'Current Score', type: 'string' },
                    { name: 'Match Minute', type: 'integer' },
                    { name: 'Sport', type: 'enum', options: ['Football', 'Tennis', 'Basketball', 'Table Tennis'] }
                ]
            },
            {
                id: 'bet_settled', label: 'Bet Settled (General)',
                params: [
                    { name: 'Outcome', type: 'enum', options: ['Win', 'Loss', 'Void', 'Cashout', 'Half-Win', 'Half-Loss'] },
                    { name: 'Losing Selections Count', type: 'integer' },
                    { name: 'Winning Selections Count', type: 'integer' },
                    { name: 'Voided Selections Count', type: 'integer' },
                    { name: 'Payout', type: 'float' },
                    { name: 'Profit', type: 'float' },
                    { name: 'Total Odds', type: 'float' }
                ]
            },
            {
                id: 'acca_settled', label: 'Accumulator Settled',
                params: [
                    { name: 'Total Legs', type: 'integer' },
                    { name: 'Losing Legs', type: 'integer' },
                    { name: 'Min Odds per Leg', type: 'float' },
                    { name: 'Outcome', type: 'enum', options: ['Win', 'Loss', 'One-Cut'] }
                ]
            }
        ]
    },
    aviator: {
        label: 'Aviator & Crash Games',
        events: [
            {
                id: 'aviator_bet', label: 'Aviator Bet Placed',
                params: [
                    { name: 'Stake', type: 'float' },
                    { name: 'Auto Cashout Enabled', type: 'boolean' },
                    { name: 'Auto Cashout Target', type: 'float' }
                ]
            },
            {
                id: 'aviator_cashout', label: 'Aviator Cashout',
                params: [
                    { name: 'Multiplier', type: 'float' },
                    { name: 'Win Amount', type: 'float' },
                    { name: 'Burst Multiplier', type: 'float' }
                ]
            },
            {
                id: 'aviator_crash', label: 'Round Crashed (Loss)',
                params: [
                    { name: 'Stake Lost', type: 'float' },
                    { name: 'Crash Point', type: 'float' }
                ]
            }
        ]
    },
    wallet: {
        label: 'Wallet & Transactions',
        events: [
            {
                id: 'deposit', label: 'Deposit (General)',
                params: [
                    { name: 'Amount', type: 'float' },
                    { name: 'Method', type: 'enum', options: ['Mpesa', 'AirtelMoney', 'Cashia', 'Card', 'BankTransfer', 'Voucher'] },
                    { name: 'Currency', type: 'enum', options: ['KES', 'GHS', 'NGN', 'UGX', 'ETB', 'TZS', 'MWK'] },
                    { name: 'Is First Deposit', type: 'boolean' },
                    { name: 'Promo Code', type: 'string' }
                ]
            },
            {
                id: 'withdrawal', label: 'Withdrawal Request',
                params: [{ name: 'Amount', type: 'float' }, { name: 'Method', type: 'string' }]
            }
        ]
    },
    casino: {
        label: 'Casino & Slots',
        events: [
            { id: 'spin', label: 'Spin / Round', params: [{ name: 'Bet Amount', type: 'float' }, { name: 'Game Type', type: 'enum', options: ['Slots', 'Table', 'Live Casino'] }] },
            { id: 'game_win', label: 'Big Win', params: [{ name: 'Win Amount', type: 'float' }, { name: 'Multiplier', type: 'float' }] }
        ]
    },
    engagement: {
        label: 'Engagement',
        events: [
            { id: 'registration', label: 'New Registration', params: [{ name: 'Reg Method', type: 'enum', options: ['SMS', 'Web', 'App'] }] },
            { id: 'login', label: 'User Login', params: [{ name: 'Days Inactive', type: 'integer' }, { name: 'Platform', type: 'string' }] }
        ]
    }
};

export const SCENARIOS = [
    {
        label: 'Winning Accumulator',
        eventId: 'acca_settled',
        payload: {
            'Total Legs': 5,
            'Losing Legs': 0,
            'Min Odds per Leg': 1.5,
            'Outcome': 'Win'
        }
    },
    {
        label: 'Aviator 10x Win',
        eventId: 'aviator_cashout',
        payload: {
            'Multiplier': 10.5,
            'Win Amount': 5000,
            'Burst Multiplier': 12.0
        }
    },
    {
        label: 'First Deposit',
        eventId: 'deposit',
        payload: {
            'Amount': 1000,
            'Method': 'Mpesa',
            'Currency': 'KES',
            'Is First Deposit': true,
            'Promo Code': 'WELCOME2026'
        }
    },
    {
        label: 'One-Cut Acca Loss',
        eventId: 'acca_settled',
        payload: {
            'Total Legs': 8,
            'Losing Legs': 1,
            'Min Odds per Leg': 1.2,
            'Outcome': 'One-Cut'
        }
    }
];
