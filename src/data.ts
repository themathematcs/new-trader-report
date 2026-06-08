import { ProfileType, DayOfWeek, Candle, PDArray, AssetPair, Timeframe } from "./types";

export interface ProfileExhibit {
  type: ProfileType;
  title: string;
  summary: string;
  idealEntryDay: string;
  keyTriggers: string[];
  protocol: string;
  avoidConditions: string[];
  visualChecklist: string[];
}

export const PROFILE_EXHIBITS: Record<ProfileType, ProfileExhibit> = {
  [ProfileType.CLASSIC_EXPANSION_BULLISH]: {
    type: ProfileType.CLASSIC_EXPANSION_BULLISH,
    title: "Bullish Classic Expansion",
    summary: "Monday accumulates inside a consolidative range, and Tuesday manipulates below Monday's low to tap a discount H1/H4 PD array (OB, FVG, or Breaker). Once engaged, price expands aggressively on Wednesday and Thursday towards the Draw on Liquidity. Friday sees the 'TGIF Setup' where price retraces 20% to 30% of the weekly range.",
    idealEntryDay: "Tuesday (Manipulation/OB tap) or Wednesday (Expansion pullback/continuation)",
    keyTriggers: [
      "Tuesday sweeps Monday's low (Judas Swing) into a discount array",
      "H1 or H4 candle Close above prior breaker (Bullish CISD)",
      "Targeting Friday's 0.20 - 0.30 Fibonacci retracement zone from the high of the week"
    ],
    protocol: "Monitor Monday's range to define premium/discount bounds. Avoid participating on Monday. Wait for Tuesday's London or New York AM session to probe below Monday's low into discount.",
    avoidConditions: [
      "Tuesday expands immediately without drawing down into discount first",
      "High impact news already passed and Monday expanded aggressively (Negative Condition)"
    ],
    visualChecklist: [
      "[MON] Accumulation / Range building",
      "[TUE] Judas Swing low, taps H4 Discount array, reverses",
      "[WED - THU] High displacement expansion candles upward",
      "[FRI] Target met, 20-30% range profit-taking retracement"
    ]
  },
  [ProfileType.CLASSIC_EXPANSION_BEARISH]: {
    type: ProfileType.CLASSIC_EXPANSION_BEARISH,
    title: "Bearish Classic Expansion",
    summary: "The mirror of the bullish expansion. Monday consolidates, and Tuesday's manipulation pushes price up to tap a premium key array, forming the high of the week. Price slides heavily on Wednesday and Thursday. Friday retraces back into range.",
    idealEntryDay: "Tuesday (premium raid swap) or Wednesday (NYC/London trend continuation)",
    keyTriggers: [
      "Tuesday probes above Monday's high (Judas Swing) into premium array",
      "Hourly close below bearish breaker block",
      "Trade downwards toward weekly Draw on Liquidity (DOL)"
    ],
    protocol: "Look for Tuesday to expand up, raid buyside liquidity / Monday's high, and show a clear shift in structure (candle close below a breaker). Sell the pullback.",
    avoidConditions: [
      "Monday is a wide range and Tuesday pushes lower without reading the premium first"
    ],
    visualChecklist: [
      "[MON] Range accumulation",
      "[TUE] Push up above opening level, tag premium OB, reverse downward",
      "[WED – THU] Continuous heavy selling",
      "[FRI] 20-30% pullback upward as shorts cover"
    ]
  },
  [ProfileType.CONSOLIDATION_REVERSAL_BULLISH]: {
    type: ProfileType.CONSOLIDATION_REVERSAL_BULLISH,
    title: "Consolidation Bullish Reversal",
    summary: "Monday to Wednesday price is trapped in a tight, horizontal consolidation (highly corrective range) that engineers liquidity on both sides. On Thursday, there is a manipulative sweep below the consolidated range low (hitting a discount array). Once liquidity is cleared and the state of delivery shifts, Friday expands upward aggressively.",
    idealEntryDay: "Thursday (favorable stop sweep and reverse) or Friday morning (expansion continuation)",
    keyTriggers: [
      "Price consolidates tightly from Monday to Wednesday",
      "Thursday NY/London sweeps the horizontal range floor into a discount FVG/breaker",
      "H4 or H1 candle Close back inside the range, initiating a Bullish order flow"
    ],
    protocol: "When Monday and Tuesday fail to expand or tap key arrays, do NOT trade. Wait patiently for Thursday. Watch for price to raid the range low, fail to sustain, and close with high displacement back higher.",
    avoidConditions: [
      "If MON-WED high-impact news already expanded price out of range, the profile is void",
      "No manipulation beneath the range high/low occurs on Thursday"
    ],
    visualChecklist: [
      "[MON - WED] Sideways range building (Tight consolidation)",
      "[THU] Sharp manipulative dive below range low to sweep Sellside Liquidity",
      "[THU PM] Strong rejection, closes above Monday-Wednesday lows",
      "[FRI] Powerful expansion upward to target range high and beyond"
    ]
  },
  [ProfileType.CONSOLIDATION_REVERSAL_BEARISH]: {
    type: ProfileType.CONSOLIDATION_REVERSAL_BEARISH,
    title: "Consolidation Bearish Reversal",
    summary: "Monday to Wednesday marks corrective sideways range-bound action. On Thursday, price makes a explosive raid above the consolidation ceiling to hook into a premium array and clear Buyside Liquidity. Thursday afternoon and Friday see a massive, high-velocity expansion downward.",
    idealEntryDay: "Thursday (Manipulation raid) or Friday (Heavy selloff continuation)",
    keyTriggers: [
      "MON - WED price holds inside a tight resistance-laden channel",
      "Thursday sweeps the engineered Buyside Liquidity (prior range highs)",
      "Hourly close beneath a bearish breaker, initiating premium-to-discount delivery"
    ],
    protocol: "Stand aside Mon-Wed. On Thursday, wait for the sweep of the range high into premium arrays, wait for a structural shift on the H1/M15 timeframe, and execute a short targeting the range low.",
    avoidConditions: [
      "Price breaks consolidation high and trend-runs without returning, voiding the reversal"
    ],
    visualChecklist: [
      "[MON - WED] Flat consolidation compressing orders",
      "[THU] Bullet spike above prior highs to trap breakout buyers",
      "[THU PM] Heavy drop back inside range",
      "[FRI] Large bearish expansion breaking the range low"
    ]
  },
  [ProfileType.MIDWEEK_REVERSAL_BULLISH]: {
    type: ProfileType.MIDWEEK_REVERSAL_BULLISH,
    title: "Midweek Bullish Reversal",
    summary: "Monday and Tuesday price slow-bleeds or creeps lower without any clean manipulation, sometimes creating two consecutive down-close daily wicks. On Wednesday, a high-impact news event (such as CPI, FOMC, or Retail Sales) sweeps price into a major discount H1/H4 PD array, forming the Low of the Week. Price reverses violently on Wednesday afternoon, expanding into Thursday and Friday.",
    idealEntryDay: "Wednesday (CPI News reaction / Discount array tap) or Thursday (retrace-and-go)",
    keyTriggers: [
      "Monday & Tuesday retracement down without setting low of the week or sweeping major arrays",
      "Wednesday High-Impact News releases (typically 08:30 USD) injects high-speed volatility",
      "News drives price deep into H1/H4 discount array, followed by extreme buying pressure"
    ],
    protocol: "Recognize that Monday and Tuesday did not manipulate. Look closely at the economic calendar: is there high-impact news on Wednesday? Set alert at key HTF discount arrays, wait for the news spike, buy when a clear lower-timeframe structure shift is confirmed after tapping the array.",
    avoidConditions: [
      "Monday and Tuesday are already highly expansionary wicks without correction",
      "Wednesday news passes, but price remains weak or consolidates instead of reversing"
    ],
    visualChecklist: [
      "[MON - TUE] Slow, orderly retracement downward (no sharp sweeps)",
      "[WED AM] Aggressive news-driven spike down into premium/discount flip",
      "[WED PM] Extreme upside displacement, long tail, massive bullish body",
      "[THU - FRI] Impulsive daily trend run higher towards weekly draw"
    ]
  },
  [ProfileType.MIDWEEK_REVERSAL_BEARISH]: {
    type: ProfileType.MIDWEEK_REVERSAL_BEARISH,
    title: "Midweek Bearish Reversal",
    summary: "Monday and Tuesday price drifts higher in a corrective retracement. On Wednesday, high-impact news triggers a powerful high-velocity sweep upward to raid buyside liquidity and tag a premium array (high of the week). Wednesday close is heavily bearish, and Thursday/Friday deliver massive downside expansion.",
    idealEntryDay: "Wednesday (News sweep entry) or Thursday (bearish pullback continuation)",
    keyTriggers: [
      "Slow upward drift Monday and Tuesday (forming a low-probability premium range)",
      "Wednesday inflation/rates news spikes price high into premium H1/H4 array",
      "Immediate fast rejection, candle Close back below news open, starting bearish delivery"
    ],
    protocol: "Wait for Wednesday news. Avoid FOMO on Tuesday. When Wednesday spikes high and then crashes below key levels, short on lower-timeframe pullbacks with safety stop above news high.",
    avoidConditions: [
      "Wednesday news is ignored and price goes into absolute seek-and-destroy chop"
    ],
    visualChecklist: [
      "[MON - TUE] Quiet corrective climb upwards",
      "[WED AM] Dramatic news-driven high spike",
      "[WED PM] Heavy displacement selloff closing near lows",
      "[THU - FRI] Straight-line drop breaking multiple daily support levels"
    ]
  }
};


export const ASSET_PAIRS: Record<string, AssetPair> = {
  EURUSD: { symbol: "EURUSD", name: "EUR/USD", startPrice: 1.0850, pipSize: 0.0001, decimals: 5 },
  GBPUSD: { symbol: "GBPUSD", name: "GBP/USD", startPrice: 1.2620, pipSize: 0.0001, decimals: 5 },
  AUDUSD: { symbol: "AUDUSD", name: "AUD/USD", startPrice: 0.6580, pipSize: 0.0001, decimals: 5 },
  USDJPY: { symbol: "USDJPY", name: "USD/JPY", startPrice: 153.50, pipSize: 0.01, decimals: 3 },
  BTCUSD: { symbol: "BTCUSD", name: "BTC/USD", startPrice: 64500.0, pipSize: 1.0, decimals: 1 },
  NQ100: { symbol: "NQ100", name: "NQ NDX Futures", startPrice: 11600.0, pipSize: 1.0, decimals: 2 },
  ES500: { symbol: "ES500", name: "ES S&P Futures", startPrice: 4010.0, pipSize: 0.25, decimals: 2 },
  YM30: { symbol: "YM30", name: "YM Dow Futures", startPrice: 34050.0, pipSize: 1.0, decimals: 1 },
  DXY: { symbol: "DXY", name: "US Dollar Index", startPrice: 104.20, pipSize: 0.01, decimals: 3 },
  ETHUSD: { symbol: "ETHUSD", name: "ETH/USD", startPrice: 3450.0, pipSize: 0.1, decimals: 2 },
  SOLUSD: { symbol: "SOLUSD", name: "SOL/USD", startPrice: 145.0, pipSize: 0.01, decimals: 3 },
};

// Generates high-resolution M15 candles for the weekly profile
export function generateWeeklyProfileCandles(
  profileType: ProfileType,
  pairSymbol: string = "EURUSD"
): { candles: Candle[]; pdArrays: PDArray[]; weeklyDrawOnLiquidity: number } {
  const asset = ASSET_PAIRS[pairSymbol] || ASSET_PAIRS.EURUSD;
  const startPrice = asset.startPrice;
  const pip = asset.pipSize;
  const decimals = asset.decimals;
  
  const candles: Candle[] = [];
  const days: DayOfWeek[] = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY
  ];

  // We generate 480 candles of 15-minutes each (96 per day)
  const totalCandlesCount = 480;
  
  let lowOfWeek = startPrice;
  let highOfWeek = startPrice;
  let weeklyDrawOnLiquidity = startPrice;

  // Inverse mapping for DXY to simulate true dollar inverse correlation
  let effectiveProfileType = profileType;
  if (pairSymbol === "DXY") {
    if (profileType === ProfileType.CLASSIC_EXPANSION_BULLISH) effectiveProfileType = ProfileType.CLASSIC_EXPANSION_BEARISH;
    else if (profileType === ProfileType.CLASSIC_EXPANSION_BEARISH) effectiveProfileType = ProfileType.CLASSIC_EXPANSION_BULLISH;
    else if (profileType === ProfileType.CONSOLIDATION_REVERSAL_BULLISH) effectiveProfileType = ProfileType.CONSOLIDATION_REVERSAL_BEARISH;
    else if (profileType === ProfileType.CONSOLIDATION_REVERSAL_BEARISH) effectiveProfileType = ProfileType.CONSOLIDATION_REVERSAL_BULLISH;
    else if (profileType === ProfileType.MIDWEEK_REVERSAL_BULLISH) effectiveProfileType = ProfileType.MIDWEEK_REVERSAL_BEARISH;
    else if (profileType === ProfileType.MIDWEEK_REVERSAL_BEARISH) effectiveProfileType = ProfileType.MIDWEEK_REVERSAL_BULLISH;
  }

  // Create an SMT (smart money tool) divergence offsets in manipulation phases
  // GBPUSD, ES500 and SOLUSD will hold shallow extremes (failing to sweep previous low/high)
  // EURUSD, NQ100, ETHUSD and DXY will clear deep extremes (deep sweep)
  const isNoSweepPair = pairSymbol === "GBPUSD" || pairSymbol === "ES500" || pairSymbol === "SOLUSD";
  const isDeepSweepPair = pairSymbol === "EURUSD" || pairSymbol === "NQ100" || pairSymbol === "ETHUSD" || pairSymbol === "DXY";

  // Setup profile targets scaled with pip values
  if (effectiveProfileType === ProfileType.CLASSIC_EXPANSION_BULLISH) {
    const pipsSweep = isDeepSweepPair ? 75 : isNoSweepPair ? 30 : 55;
    lowOfWeek = startPrice - pipsSweep * pip;
    highOfWeek = startPrice + 160 * pip;
    weeklyDrawOnLiquidity = startPrice + 145 * pip;
  } else if (effectiveProfileType === ProfileType.CLASSIC_EXPANSION_BEARISH) {
    const pipsSweep = isDeepSweepPair ? 75 : isNoSweepPair ? 30 : 55;
    highOfWeek = startPrice + pipsSweep * pip;
    lowOfWeek = startPrice - 160 * pip;
    weeklyDrawOnLiquidity = startPrice - 145 * pip;
  } else if (effectiveProfileType === ProfileType.CONSOLIDATION_REVERSAL_BULLISH) {
    const pipsSweep = isDeepSweepPair ? 105 : isNoSweepPair ? 50 : 80;
    lowOfWeek = startPrice - pipsSweep * pip;
    highOfWeek = startPrice + 120 * pip;
    weeklyDrawOnLiquidity = startPrice + 100 * pip;
  } else if (effectiveProfileType === ProfileType.CONSOLIDATION_REVERSAL_BEARISH) {
    const pipsSweep = isDeepSweepPair ? 105 : isNoSweepPair ? 50 : 80;
    highOfWeek = startPrice + pipsSweep * pip;
    lowOfWeek = startPrice - 120 * pip;
    weeklyDrawOnLiquidity = startPrice - 100 * pip;
  } else if (effectiveProfileType === ProfileType.MIDWEEK_REVERSAL_BULLISH) {
    const pipsSweep = isDeepSweepPair ? 120 : isNoSweepPair ? 60 : 100;
    lowOfWeek = startPrice - pipsSweep * pip;
    highOfWeek = startPrice + 140 * pip;
    weeklyDrawOnLiquidity = startPrice + 125 * pip;
  } else if (effectiveProfileType === ProfileType.MIDWEEK_REVERSAL_BEARISH) {
    const pipsSweep = isDeepSweepPair ? 120 : isNoSweepPair ? 60 : 100;
    highOfWeek = startPrice + pipsSweep * pip;
    lowOfWeek = startPrice - 140 * pip;
    weeklyDrawOnLiquidity = startPrice - 125 * pip;
  }

  const pricePath: number[] = new Array(totalCandlesCount);
  pricePath[0] = startPrice;

  for (let idx = 1; idx < totalCandlesCount; idx++) {
    const h4FractionalIdx = idx / 16;
    const dayIdx = Math.floor(h4FractionalIdx / 6);
    const day = days[dayIdx] || DayOfWeek.FRIDAY;
    const hourIdxFractional = h4FractionalIdx % 6;

    if (effectiveProfileType === ProfileType.CLASSIC_EXPANSION_BULLISH) {
      if (day === DayOfWeek.MONDAY) {
        const wave = Math.sin(h4FractionalIdx * 1.5) * 12 * pip;
        pricePath[idx] = startPrice + wave;
      } else if (day === DayOfWeek.TUESDAY) {
        if (hourIdxFractional <= 2) {
          const t = hourIdxFractional / 2;
          pricePath[idx] = startPrice - 10 * pip - (lowOfWeek - (startPrice - 10 * pip)) * -t;
          if (idx === Math.floor(2 * 16 + 96)) pricePath[idx] = lowOfWeek;
        } else {
          const t = (hourIdxFractional - 2) / 3;
          pricePath[idx] = lowOfWeek + (startPrice - lowOfWeek) * 0.8 * t;
        }
      } else if (day === DayOfWeek.WEDNESDAY) {
        const t = hourIdxFractional / 5;
        const wedStart = pricePath[11 * 16];
        const wedEnd = startPrice + 70 * pip;
        pricePath[idx] = wedStart + (wedEnd - wedStart) * t;
      } else if (day === DayOfWeek.THURSDAY) {
        const t = hourIdxFractional / 5;
        const thuStart = pricePath[17 * 16];
        const thuEnd = highOfWeek;
        pricePath[idx] = thuStart + (thuEnd - thuStart) * t;
      } else if (day === DayOfWeek.FRIDAY) {
        if (hourIdxFractional <= 1) {
          pricePath[idx] = highOfWeek;
        } else {
          const t = (hourIdxFractional - 1) / 4;
          const retracementAmount = (highOfWeek - lowOfWeek) * 0.25;
          pricePath[idx] = highOfWeek - retracementAmount * t;
        }
      }
    } 
    
    else if (effectiveProfileType === ProfileType.CLASSIC_EXPANSION_BEARISH) {
      if (day === DayOfWeek.MONDAY) {
        const wave = Math.sin(h4FractionalIdx * 1.5) * 12 * pip;
        pricePath[idx] = startPrice - wave;
      } else if (day === DayOfWeek.TUESDAY) {
        if (hourIdxFractional <= 2) {
          const t = hourIdxFractional / 2;
          pricePath[idx] = startPrice + 10 * pip + (highOfWeek - (startPrice + 10 * pip)) * t;
          if (idx === Math.floor(2 * 16 + 96)) pricePath[idx] = highOfWeek;
        } else {
          const t = (hourIdxFractional - 2) / 3;
          pricePath[idx] = highOfWeek - (highOfWeek - startPrice) * 0.8 * t;
        }
      } else if (day === DayOfWeek.WEDNESDAY) {
        const t = hourIdxFractional / 5;
        const wedStart = pricePath[11 * 16];
        const wedEnd = startPrice - 70 * pip;
        pricePath[idx] = wedStart + (wedEnd - wedStart) * t;
      } else if (day === DayOfWeek.THURSDAY) {
        const t = hourIdxFractional / 5;
        const thuStart = pricePath[17 * 16];
        const thuEnd = lowOfWeek;
        pricePath[idx] = thuStart + (thuEnd - thuStart) * t;
      } else if (day === DayOfWeek.FRIDAY) {
        if (hourIdxFractional <= 1) {
          pricePath[idx] = lowOfWeek;
        } else {
          const t = (hourIdxFractional - 1) / 4;
          const retracementAmount = (highOfWeek - lowOfWeek) * 0.25;
          pricePath[idx] = lowOfWeek + retracementAmount * t;
        }
      }
    }

    else if (effectiveProfileType === ProfileType.CONSOLIDATION_REVERSAL_BULLISH) {
      if (dayIdx <= 2) {
        const bounce = Math.sin(h4FractionalIdx * 2) * 15 * pip;
        pricePath[idx] = startPrice + bounce;
      } else if (day === DayOfWeek.THURSDAY) {
        if (hourIdxFractional <= 2) {
          const t = hourIdxFractional / 2;
          const midConsol = startPrice;
          pricePath[idx] = midConsol - 10 * pip - (midConsol - 10 * pip - lowOfWeek) * t;
          if (idx === Math.floor(2 * 16 + 288)) pricePath[idx] = lowOfWeek;
        } else {
          const t = (hourIdxFractional - 2) / 3;
          pricePath[idx] = lowOfWeek + (startPrice - lowOfWeek) * 1.1 * t;
        }
      } else if (day === DayOfWeek.FRIDAY) {
        const t = hourIdxFractional / 5;
        const friStart = pricePath[23 * 16];
        pricePath[idx] = friStart + (highOfWeek - friStart) * t;
      }
    }

    else if (effectiveProfileType === ProfileType.CONSOLIDATION_REVERSAL_BEARISH) {
      if (dayIdx <= 2) {
        const bounce = Math.sin(h4FractionalIdx * 2) * 15 * pip;
        pricePath[idx] = startPrice - bounce;
      } else if (day === DayOfWeek.THURSDAY) {
        if (hourIdxFractional <= 2) {
          const t = hourIdxFractional / 2;
          const midConsol = startPrice;
          pricePath[idx] = midConsol + 10 * pip + (highOfWeek - (midConsol + 10 * pip)) * t;
          if (idx === Math.floor(2 * 16 + 288)) pricePath[idx] = highOfWeek;
        } else {
          const t = (hourIdxFractional - 2) / 3;
          pricePath[idx] = highOfWeek - (highOfWeek - startPrice) * 1.1 * t;
        }
      } else if (day === DayOfWeek.FRIDAY) {
        const t = hourIdxFractional / 5;
        const friStart = pricePath[23 * 16];
        pricePath[idx] = friStart - (friStart - lowOfWeek) * t;
      }
    }

    else if (effectiveProfileType === ProfileType.MIDWEEK_REVERSAL_BULLISH) {
      if (day === DayOfWeek.MONDAY) {
        const t = hourIdxFractional / 5;
        pricePath[idx] = startPrice - 20 * pip * t;
      } else if (day === DayOfWeek.TUESDAY) {
        const t = hourIdxFractional / 5;
        pricePath[idx] = (startPrice - 20 * pip) - 25 * pip * t;
      } else if (day === DayOfWeek.WEDNESDAY) {
        if (hourIdxFractional <= 2) {
          const t = hourIdxFractional / 2;
          const wedOpen = pricePath[11 * 16];
          pricePath[idx] = wedOpen - (wedOpen - lowOfWeek) * t;
          if (idx === Math.floor(2 * 16 + 192)) pricePath[idx] = lowOfWeek;
        } else {
          const t = (hourIdxFractional - 2) / 3;
          pricePath[idx] = lowOfWeek + (startPrice + 30 * pip - lowOfWeek) * t;
        }
      } else if (day === DayOfWeek.THURSDAY) {
        const t = hourIdxFractional / 5;
        const thuStart = pricePath[17 * 16];
        pricePath[idx] = thuStart + (startPrice + 100 * pip - thuStart) * t;
      } else if (day === DayOfWeek.FRIDAY) {
        const t = hourIdxFractional / 5;
        const friStart = pricePath[23 * 16];
        pricePath[idx] = friStart + (highOfWeek - friStart) * t;
      }
    }

    else if (effectiveProfileType === ProfileType.MIDWEEK_REVERSAL_BEARISH) {
      if (day === DayOfWeek.MONDAY) {
        const t = hourIdxFractional / 5;
        pricePath[idx] = startPrice + 20 * pip * t;
      } else if (day === DayOfWeek.TUESDAY) {
        const t = hourIdxFractional / 5;
        pricePath[idx] = (startPrice + 20 * pip) + 25 * pip * t;
      } else if (day === DayOfWeek.WEDNESDAY) {
        if (hourIdxFractional <= 2) {
          const t = hourIdxFractional / 2;
          const wedOpen = pricePath[11 * 16];
          pricePath[idx] = wedOpen + (highOfWeek - wedOpen) * t;
          if (idx === Math.floor(2 * 16 + 192)) pricePath[idx] = highOfWeek;
        } else {
          const t = (hourIdxFractional - 2) / 3;
          pricePath[idx] = highOfWeek - (highOfWeek - (startPrice - 30 * pip)) * t;
        }
      } else if (day === DayOfWeek.THURSDAY) {
        const t = hourIdxFractional / 5;
        const thuStart = pricePath[17 * 16];
        pricePath[idx] = thuStart - (thuStart - (startPrice - 100 * pip)) * t;
      } else if (day === DayOfWeek.FRIDAY) {
        const t = hourIdxFractional / 5;
        const friStart = pricePath[23 * 16];
        pricePath[idx] = friStart - (friStart - lowOfWeek) * t;
      }
    }
  }

  for (let idx = 0; idx < totalCandlesCount; idx++) {
    if (isNaN(pricePath[idx]) || pricePath[idx] === undefined) {
      pricePath[idx] = startPrice;
    }
  }

  // Construct standard M15 OHLC candlesticks based on the generated path nodes
  for (let idx = 0; idx < totalCandlesCount; idx++) {
    const dayIdx = Math.floor(idx / 96);
    const day = days[dayIdx] || DayOfWeek.FRIDAY;
    const minuteOffset = (idx % 96) * 15;
    const hour = Math.floor(minuteOffset / 60);
    const minute = minuteOffset % 60;
    const timeString = `${day} ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

    const basePrice = pricePath[idx];
    const open = idx === 0 ? startPrice : candles[idx - 1].close;
    const close = basePrice;

    // Add noise for realistic peaks & shadows (proportional to pip Size)
    let noiseRange = 10 * pip; 
    const h4FractionalIdx = idx / 16;
    const hourIdxFractional = h4FractionalIdx % 6;

    if (day === DayOfWeek.TUESDAY && effectiveProfileType.includes("Classic") && hourIdxFractional <= 2) {
      noiseRange = 22 * pip;
    } else if (day === DayOfWeek.THURSDAY && effectiveProfileType.includes("Consolidation") && hourIdxFractional <= 2) {
      noiseRange = 25 * pip;
    } else if (day === DayOfWeek.WEDNESDAY && effectiveProfileType.includes("Midweek") && hourIdxFractional <= 2) {
      noiseRange = 35 * pip;
    }

    const randomUpNoise = Math.random() * noiseRange * 0.4;
    const randomDownNoise = Math.random() * noiseRange * 0.4;

    const high = Math.max(open, close) + randomUpNoise;
    const low = Math.min(open, close) - randomDownNoise;

    let finalHigh = high;
    let finalLow = low;
    if (close === lowOfWeek || open === lowOfWeek) finalLow = lowOfWeek;
    if (close === highOfWeek || open === highOfWeek) finalHigh = highOfWeek;

    if (finalLow > Math.min(open, close)) finalLow = Math.min(open, close) - 1 * pip;
    if (finalHigh < Math.max(open, close)) finalHigh = Math.max(open, close) + 1 * pip;

    candles.push({
      id: `${effectiveProfileType}_m15_${idx}`,
      time: timeString,
      day,
      hour,
      open: parseFloat(open.toFixed(decimals)),
      high: parseFloat(finalHigh.toFixed(decimals)),
      low: parseFloat(finalLow.toFixed(decimals)),
      close: parseFloat(close.toFixed(decimals)),
      volume: Math.floor(1000 + Math.random() * 2000 + (day === DayOfWeek.WEDNESDAY || day === DayOfWeek.THURSDAY ? 1000 : 0))
    });
  }

  // Construct PD Arrays nicely scaled
  const pdArrays: PDArray[] = [];

  if (effectiveProfileType === ProfileType.CLASSIC_EXPANSION_BULLISH) {
    pdArrays.push({
      id: "pd1",
      name: `H4 Discount Order Block (+OB)`,
      type: "discount",
      priceStart: lowOfWeek,
      priceEnd: lowOfWeek + 15 * pip,
      timeStart: "MON 12:00",
      timeEnd: "TUE 16:00"
    });
    pdArrays.push({
      id: "pd2",
      name: "Bullish Fair Value Gap (+FVG)",
      type: "discount",
      priceStart: lowOfWeek + 25 * pip,
      priceEnd: lowOfWeek + 35 * pip,
      timeStart: "TUE 20:00",
      timeEnd: "WED 16:00"
    });
    pdArrays.push({
      id: "pd3",
      name: "Equal Highs - Buyside Liquidity (BSL)",
      type: "liquidity_high",
      priceStart: startPrice + 30 * pip,
      priceEnd: startPrice + 30 * pip,
      timeStart: "MON 04:00",
      timeEnd: "WED 08:00"
    });
  } 
  
  else if (profileType === ProfileType.CLASSIC_EXPANSION_BEARISH) {
    pdArrays.push({
      id: "pd1",
      name: "H4 Premium Order Block (-OB)",
      type: "premium",
      priceStart: highOfWeek - 15 * pip,
      priceEnd: highOfWeek,
      timeStart: "MON 12:00",
      timeEnd: "TUE 16:00"
    });
    pdArrays.push({
      id: "pd2",
      name: "Bearish Fair Value Gap (-FVG)",
      type: "premium",
      priceStart: highOfWeek - 35 * pip,
      priceEnd: highOfWeek - 25 * pip,
      timeStart: "TUE 20:00",
      timeEnd: "WED 16:00"
    });
    pdArrays.push({
      id: "pd3",
      name: "Equal Lows - Sellside Liquidity (SSL)",
      type: "liquidity_low",
      priceStart: startPrice - 30 * pip,
      priceEnd: startPrice - 30 * pip,
      timeStart: "MON 04:00",
      timeEnd: "WED 08:00"
    });
  }

  else if (profileType === ProfileType.CONSOLIDATION_REVERSAL_BULLISH) {
    const rangeLow = startPrice - 20 * pip;
    const rangeHigh = startPrice + 25 * pip;

    pdArrays.push({
      id: "pd1",
      name: "Engineered Sellside Liquidity (SSL Floor)",
      type: "liquidity_low",
      priceStart: rangeLow,
      priceEnd: rangeLow,
      timeStart: "MON 00:00",
      timeEnd: "THU 08:00"
    });
    pdArrays.push({
      id: "pd2",
      name: "H4 Bullish Breaker Block (+BRK)",
      type: "discount",
      priceStart: lowOfWeek,
      priceEnd: lowOfWeek + 20 * pip,
      timeStart: "THU 04:00",
      timeEnd: "THU 20:00"
    });
    pdArrays.push({
      id: "pd3",
      name: "Engineered Buyside Liquidity (BSL Ceiling)",
      type: "liquidity_high",
      priceStart: rangeHigh,
      priceEnd: rangeHigh,
      timeStart: "MON 00:00",
      timeEnd: "FRI 12:00"
    });
  }

  else if (profileType === ProfileType.CONSOLIDATION_REVERSAL_BEARISH) {
    const rangeLow = startPrice - 25 * pip;
    const rangeHigh = startPrice + 20 * pip;

    pdArrays.push({
      id: "pd1",
      name: "Engineered Buyside Liquidity (BSL Ceiling)",
      type: "liquidity_high",
      priceStart: rangeHigh,
      priceEnd: rangeHigh,
      timeStart: "MON 00:00",
      timeEnd: "THU 08:00"
    });
    pdArrays.push({
      id: "pd2",
      name: "H4 Bearish Breaker Block (-BRK)",
      type: "premium",
      priceStart: highOfWeek - 20 * pip,
      priceEnd: highOfWeek,
      timeStart: "THU 04:00",
      timeEnd: "THU 20:00"
    });
    pdArrays.push({
      id: "pd3",
      name: "Engineered Sellside Liquidity (SSL Floor)",
      type: "liquidity_low",
      priceStart: rangeLow,
      priceEnd: rangeLow,
      timeStart: "MON 00:00",
      timeEnd: "FRI 12:00"
    });
  }

  else if (profileType === ProfileType.MIDWEEK_REVERSAL_BULLISH) {
    pdArrays.push({
      id: "pd1",
      name: "HTF H4 Demand / Order Block",
      type: "discount",
      priceStart: lowOfWeek,
      priceEnd: lowOfWeek + 18 * pip,
      timeStart: "MON 00:00",
      timeEnd: "WED 12:00"
    });
    pdArrays.push({
      id: "pd2",
      name: "Wednesday News Trigger Raid Zone",
      type: "liquidity_low",
      priceStart: lowOfWeek + 10 * pip,
      priceEnd: lowOfWeek + 10 * pip,
      timeStart: "WED 04:00",
      timeEnd: "WED 16:00"
    });
  }

  else if (profileType === ProfileType.MIDWEEK_REVERSAL_BEARISH) {
    pdArrays.push({
      id: "pd1",
      name: "HTF H4 Supply / Shaded Reversion OB",
      type: "premium",
      priceStart: highOfWeek - 18 * pip,
      priceEnd: highOfWeek,
      timeStart: "MON 00:00",
      timeEnd: "WED 12:00"
    });
    pdArrays.push({
      id: "pd2",
      name: "Wednesday News Trigger Spike Zone",
      type: "liquidity_high",
      priceStart: highOfWeek - 10 * pip,
      priceEnd: highOfWeek - 10 * pip,
      timeStart: "WED 04:00",
      timeEnd: "WED 16:00"
    });
  }

  return {
    candles,
    pdArrays,
    weeklyDrawOnLiquidity: parseFloat(weeklyDrawOnLiquidity.toFixed(decimals))
  };
}

// Aggregates M15 candles under specified timeframe
export function aggregateCandles(
  m15Candles: Candle[],
  timeframe: Timeframe,
  limitIndex: number, // current elapsed M15 candles index
  decimals: number = 5
): Candle[] {
  let groupSize = 1; // M15
  if (timeframe === "H1") groupSize = 4;
  if (timeframe === "H4") groupSize = 16;
  if (timeframe === "D1") groupSize = 96;

  const aggregated: Candle[] = [];
  const maxIdx = Math.min(limitIndex, m15Candles.length);

  for (let i = 0; i < m15Candles.length; i += groupSize) {
    // The candles in this block are slice from [i, i + groupSize]
    // But we only aggregate up to the currently revealed index maxIdx
    const blockEnd = i + groupSize;
    
    // Check if this time block is unrevealed
    if (i >= maxIdx) {
      break;
    }

    const revealedInBlock = m15Candles.slice(i, Math.min(blockEnd, maxIdx));
    if (revealedInBlock.length === 0) {
      continue;
    }

    const first = revealedInBlock[0];
    const last = revealedInBlock[revealedInBlock.length - 1];

    let maxPrice = -Infinity;
    let minPrice = Infinity;
    let volumeSum = 0;

    revealedInBlock.forEach((c) => {
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.low < minPrice) minPrice = c.low;
      volumeSum += c.volume;
    });

    let timeString = first.time;
    if (timeframe === "D1") {
      timeString = first.day;
    } else if (timeframe === "H4" || timeframe === "H1") {
      timeString = `${first.day} ${first.hour.toString().padStart(2, "0")}:00`;
    }

    aggregated.push({
      id: `${timeframe}_c_${i / groupSize}`,
      time: timeString,
      day: first.day,
      hour: first.hour,
      open: first.open,
      high: parseFloat(maxPrice.toFixed(decimals)),
      low: parseFloat(minPrice.toFixed(decimals)),
      close: last.close,
      volume: volumeSum,
      isDailyClose: timeframe === "D1" || (timeframe === "H4" && (i / groupSize) % 6 === 5)
    });
  }

  return aggregated;
}

