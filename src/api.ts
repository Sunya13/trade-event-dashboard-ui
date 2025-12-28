import type { Trade, TradeHistory } from './models';

// Helper to generate mock history
const generateHistory = (ref: string): TradeHistory[] => [
    {
        timestamp: new Date(Date.now() - 100000).toISOString(),
        action: 'BOOK',
        user: 'system',
        note: `Trade ${ref} booked via API`  // <--- Used 'ref' here
    },
    {
        timestamp: new Date(Date.now() - 50000).toISOString(),
        action: 'UPDATE',
        user: 'trader_1',
        note: 'Updated notional'
    }
];

// Initial Mock Data
let MOCK_TRADES: Trade[] = [
    {
        tradeRef: "SWAPTION:UI:99a8b1",
        status: "LIVE",
        subject: "VANILLA_SWAPTION",
        source: "INTERNAL_UI",
        counterparty: "GOLDMAN_SACHS",
        notional: 1000000,
        updatedAt: new Date().toISOString(),
        history: generateHistory("SWAPTION:UI:99a8b1")
    },
    {
        tradeRef: "FX:BLOOMBERG:22c4d5",
        status: "VERIFIED",
        subject: "FX_OPTION",
        source: "BLOOMBERG",
        counterparty: "JPMORGAN",
        notional: 5500000,
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        history: generateHistory("FX:BLOOMBERG:22c4d5")
    },
    {
        tradeRef: "SWAPTION:UI:11f2e3",
        status: "CANCELLED",
        subject: "BERMUDAN_SWAPTION",
        source: "INTERNAL_UI",
        counterparty: "CITI",
        notional: 2000000,
        updatedAt: new Date(Date.now() - 7200000).toISOString(),
        history: generateHistory("SWAPTION:UI:11f2e3")
    }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchTrades = async (): Promise<Trade[]> => {
    await delay(800); // Increased delay to show off Skeleton Loader
    return JSON.parse(JSON.stringify(MOCK_TRADES)); // Return deep copy
};

export const bookTrade = async (newTrade: Partial<Trade>): Promise<Trade> => {
    await delay(500);
    const ref = `NEW:UI:${Math.floor(Math.random() * 10000)}`;
    const trade: Trade = {
        tradeRef: ref,
        status: 'LIVE',
        subject: newTrade.subject || 'VANILLA_SWAPTION',
        source: newTrade.source || 'INTERNAL_UI',
        counterparty: newTrade.counterparty || 'UNKNOWN',
        notional: newTrade.notional || 0,
        updatedAt: new Date().toISOString(),
        history: [{ timestamp: new Date().toISOString(), action: 'BOOK', user: 'user_ui', note: 'Manual Booking' }]
    };
    MOCK_TRADES.unshift(trade);
    return trade;
};

export const amendTrade = async (tradeRef: string, updatedData: Partial<Trade>): Promise<void> => {
    await delay(500);
    const index = MOCK_TRADES.findIndex(t => t.tradeRef === tradeRef);
    if (index !== -1) {
        MOCK_TRADES[index] = { ...MOCK_TRADES[index], ...updatedData, updatedAt: new Date().toISOString() };
        MOCK_TRADES[index].history.unshift({
            timestamp: new Date().toISOString(), action: 'AMEND', user: 'user_ui', note: 'Amended details'
        });
    }
};

export const updateTradeStatus = async (tradeRef: string, status: 'VERIFIED' | 'CANCELLED'): Promise<void> => {
    await delay(300);
    const trade = MOCK_TRADES.find(t => t.tradeRef === tradeRef);
    if (trade) {
        trade.status = status;
        trade.updatedAt = new Date().toISOString();
        trade.history.unshift({
            timestamp: new Date().toISOString(), action: status, user: 'user_ui', note: `Status changed to ${status}`
        });
    }
};