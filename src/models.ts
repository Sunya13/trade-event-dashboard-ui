export interface TradeHistory {
    timestamp: string;
    action: string;
    user: string;
    note: string;
}

export interface Trade {
    tradeRef: string;
    status: 'LIVE' | 'VERIFIED' | 'CANCELLED';
    subject: string;
    source: string;
    counterparty: string;
    notional: number;
    updatedAt: string; // ISO Timestamp
    history: TradeHistory[]; // Audit trail
}