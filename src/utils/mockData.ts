interface SymbolConfig {
  startPrice: number;
  volatility: number; // multiplier for step change
}

export const symbolConfigs: { [key: string]: SymbolConfig } = {
  "ES": { startPrice: 5430, volatility: 0.8 },
  "NQ": { startPrice: 18580, volatility: 1.1 },
  "AAPL": { startPrice: 194.20, volatility: 0.9 },
  "TSLA": { startPrice: 177.50, volatility: 2.5 },
  "BTC": { startPrice: 67390, volatility: 3.2 },
  "ETH": { startPrice: 3765, volatility: 3.5 },
  "SPY": { startPrice: 531.60, volatility: 0.7 },
  "QQQ": { startPrice: 462.40, volatility: 1.0 }
};

export function generateCandleData(
  numPoints: number, 
  startStr: string = '2024-01-01', 
  symbolOrPrice: string | number = 'ES', 
  timeframeString: string = '1m'
) {
  const data = [];
  const now = new Date().getTime();
  
  let startPrice = 5500;
  let volMultiplier = 1.0;

  if (typeof symbolOrPrice === 'number') {
    startPrice = symbolOrPrice;
    if (startPrice > 30000) volMultiplier = 3.0;
    else if (startPrice > 10000) volMultiplier = 1.1;
    else if (startPrice > 3000) volMultiplier = 1.5;
    else if (startPrice > 100) volMultiplier = 0.8;
    else volMultiplier = 1.0;
  } else if (typeof symbolOrPrice === 'string') {
    const config = symbolConfigs[symbolOrPrice] || { startPrice: 100, volatility: 1.0 };
    startPrice = config.startPrice;
    volMultiplier = config.volatility;
  }

  let currentPrice = startPrice;

  let timeScaleMultiplier = 1;
  switch (timeframeString) {
    case "1s": timeScaleMultiplier = 1/60; break;
    case "5s": timeScaleMultiplier = 5/60; break;
    case "30s": timeScaleMultiplier = 0.5; break;
    case "1m": timeScaleMultiplier = 1; break;
    case "5m": timeScaleMultiplier = 5; break;
    case "1h": timeScaleMultiplier = 60; break;
    case "1d": timeScaleMultiplier = 60 * 24; break;
    case "1W": timeScaleMultiplier = 60 * 24 * 7; break;
    case "1M": timeScaleMultiplier = 60 * 24 * 30; break;
  }

  const intervalInMs = 60 * 1000 * timeScaleMultiplier;
  const lastCandleTime = Math.floor(now / intervalInMs) * intervalInMs;

  let basePercentChange = 0.001;
  switch (timeframeString) {
    case "1s": basePercentChange = 0.00015; break;
    case "5s": basePercentChange = 0.0003; break;
    case "30s": basePercentChange = 0.0006; break;
    case "1m": basePercentChange = 0.0012; break;
    case "5m": basePercentChange = 0.0025; break;
    case "1h": basePercentChange = 0.009; break;
    case "1d": basePercentChange = 0.022; break;
    case "1W": basePercentChange = 0.055; break;
    case "1M": basePercentChange = 0.11; break;
  }

  const maxPercentChange = basePercentChange * volMultiplier;

  for (let i = 0; i < numPoints; i++) {
    const candleTimeMs = lastCandleTime - (numPoints - 1 - i) * intervalInMs;
    const time = candleTimeMs / 1000;
    
    // Add sinusoidal wave trends for support/resistance and market cycles
    const trendCycle = Math.sin(i / 150) * 0.0015;
    const miniCycle = Math.cos(i / 15) * 0.0005;
    const sessionCycle = Math.sin(i / 60) * 0.001;
    
    const randomTerm = (Math.random() - 0.5) * 2 * maxPercentChange;
    const drift = 0.00002;

    const changePercent = randomTerm + trendCycle + miniCycle + sessionCycle + drift;
    const nextPrice = Math.max(0.01, currentPrice * (1 + changePercent));
    
    // Scaled wick highs and lows
    const wickScale = maxPercentChange * 0.45;
    const high = Math.max(currentPrice, nextPrice) + Math.random() * currentPrice * wickScale;
    const low = Math.max(0.01, Math.min(currentPrice, nextPrice) - Math.random() * currentPrice * wickScale);
    
    data.push({
      time: time,
      open: parseFloat(currentPrice.toFixed(4)),
      high: parseFloat(high.toFixed(4)),
      low: parseFloat(low.toFixed(4)),
      close: parseFloat(nextPrice.toFixed(4))
    });
    
    currentPrice = nextPrice;
  }
  
  return data;
}
