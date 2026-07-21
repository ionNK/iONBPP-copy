
export interface EventParam {
    name: string;
    type: 'string' | 'integer' | 'float' | 'boolean' | 'enum' | 'array';
    options?: string[];
    // For arrays, define the item structure
    itemSchema?: EventParam[];
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
                id: 'bet_placed', label: 'Bet Placed',
                params: [
                    { name: 'betId', type: 'string' }, // e.g. ticket ID
                    { name: 'stake', type: 'float' },
                    { name: 'country', type: 'enum', options: ['KE', 'GH', 'TZ', 'UG', 'ET', 'NG', 'ZM'] },
                    { name: 'totalOdds', type: 'float' },
                    { name: 'potentialWin', type: 'float' },
                    { name: 'isLive', type: 'boolean' },
                    // Complex Array Type for Selections
                    {
                        name: 'selections',
                        type: 'array',
                        itemSchema: [
                            { name: 'selectionId', type: 'string' },
                            { name: 'sport', type: 'enum', options: ['Football', 'Basketball', 'Tennis'] },
                            { name: 'league', type: 'string' },
                            { name: 'market', type: 'string' },
                            { name: 'odds', type: 'float' },
                            { name: 'outcome', type: 'string' }
                        ]
                    }
                ]
            },
            {
                id: 'bet_settled', label: 'Bet Settled',
                params: [
                    { name: 'ticketId', type: 'string' },
                    { name: 'status', type: 'enum', options: ['Won', 'Lost', 'Void', 'Cashout'] },
                    { name: 'payout', type: 'float' }
                ]
            }
        ]
    },
    wallet: {
        label: 'Wallet',
        events: [
            {
                id: 'deposit', label: 'Deposit',
                params: [
                    { name: 'amount', type: 'float' },
                    { name: 'country', type: 'enum', options: ['KE', 'GH', 'TZ', 'UG', 'ET', 'NG', 'ZM'] },
                    { name: 'method', type: 'enum', options: ['Mpesa', 'Card', 'Bank'] }
                ]
            }
        ]
    }
};
