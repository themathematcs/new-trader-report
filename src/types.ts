export enum ProfileType {
  CLASSIC_EXPANSION_BULLISH = "Classic Expansion (Bullish)",
  CLASSIC_EXPANSION_BEARISH = "Classic Expansion (Bearish)",
  CONSOLIDATION_REVERSAL_BULLISH = "Consolidation Reversal (Bullish)",
  CONSOLIDATION_REVERSAL_BEARISH = "Consolidation Reversal (Bearish)",
  MIDWEEK_REVERSAL_BULLISH = "Midweek Reversal (Bullish)",
  MIDWEEK_REVERSAL_BEARISH = "Midweek Reversal (Bearish)",
}

export enum DayOfWeek {
  MONDAY = "MON",
  TUESDAY = "TUE",
  WEDNESDAY = "WED",
  THURSDAY = "THU",
  FRIDAY = "FRI",
}

export type Timeframe = "M15" | "H1" | "H4" | "D1";

export interface AssetPair {
  symbol: string;
  name: string;
  startPrice: number;
  pipSize: number;
  decimals: number;
}

export interface Candle {
  id: string;
  time: string; // "MON 08:00", etc.
  day: DayOfWeek;
  hour: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isDailyClose?: boolean;
}

export interface PDArray {
  id: string;
  name: string; // e.g. "H4 Discount OB", "+FVG", "Buyside Liquidity"
  type: "discount" | "premium" | "liquidity_high" | "liquidity_low";
  priceStart: number;
  priceEnd: number;
  timeStart: string; // DayOfWeek or specific candle index
  timeEnd: string;
}

export interface Position {
  id: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  size: number; // lots or units
  stopLoss: number;
  takeProfit: number;
  openedAtTime: string;
  openedAtM15Index: number;
  pnl: number; // in cash
  rMultiple: number;
  status: "OPEN" | "TP_HIT" | "SL_HIT" | "CLOSED_MANUALLY";
  closedPrice?: number;
  closedAtTime?: string;
  closedAtM15Index?: number;
}

export interface ProfileGuess {
  guess?: ProfileType;
  isCorrect?: boolean;
  scoreGained?: number;
}

export interface BacktestSession {
  id: string;
  date: string;
  pair: string;
  profileType: ProfileType;
  initialBalance: number;
  finalBalance: number;
  tradesCount: number;
  winRate: number;
  netProfit: number;
  pnlPercentage: number;
  profileGuessedCorrectly: boolean;
  grade: string; // "A+", "B", etc.
}

export interface TradeLog {
  id: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  exitPrice: number;
  rMultiple: number;
  pnl: number;
  outcome: "TP" | "SL" | "MANUAL";
  time: string;
}
