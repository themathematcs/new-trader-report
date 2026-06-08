export function generateCandleData(numPoints: number, startStr: string = '2024-01-01', startPrice: number = 5500, timeframeString: string = '1m') {
  const data = [];
  const start = new Date(startStr).getTime();
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

  for (let i = 0; i < numPoints; i++) {
    const time = (start + i * 60 * 1000 * timeScaleMultiplier) / 1000; // minutes
    const nextPrice = currentPrice + (Math.random() - 0.5) * 10;
    
    // Create random OHLC
    const high = Math.max(currentPrice, nextPrice) + Math.random() * 5;
    const low = Math.min(currentPrice, nextPrice) - Math.random() * 5;
    
    data.push({
      time: time,
      open: currentPrice,
      high,
      low,
      close: nextPrice
    });
    
    currentPrice = nextPrice;
  }
  
  return data;
}
