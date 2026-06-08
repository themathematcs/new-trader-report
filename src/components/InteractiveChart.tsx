import React, { useState, useMemo, useEffect } from "react";
import { Candle, PDArray, Position, Timeframe } from "../types";
import { Eye, EyeOff, Tag, Layers, ZoomIn, ZoomOut } from "lucide-react";
import { ASSET_PAIRS } from "../data";

interface InteractiveChartProps {
  candles: Candle[];
  revealedCount: number;
  pdArrays: PDArray[];
  activePosition: Position | null;
  closedPositions: Position[];
  weeklyDraw: number;
  showPDArrays: boolean;
  setShowPDArrays: (show: boolean) => void;
  predictedProfile: string;
  selectedPair?: string;
  timeframe: Timeframe;
  hideOrdersSetting?: boolean;
  hidePricesSetting?: boolean;
  smoothCandlesSetting?: boolean;
}

export default function InteractiveChart({
  candles,
  revealedCount,
  pdArrays,
  activePosition,
  closedPositions,
  weeklyDraw,
  showPDArrays,
  setShowPDArrays,
  predictedProfile,
  selectedPair,
  timeframe,
  hideOrdersSetting,
  hidePricesSetting,
  smoothCandlesSetting
}: InteractiveChartProps) {
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [showDrawLine, setShowDrawLine] = useState<boolean>(true);

  // Viewport states for Zoom and Scroll
  const [viewSize, setViewSize] = useState<number>(60);
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const symbol = useMemo(() => {
    return selectedPair || (candles[0]?.close > 20 ? "USDJPY" : "EURUSD");
  }, [selectedPair, candles]);

  const dec = useMemo(() => {
    if (selectedPair && ASSET_PAIRS[selectedPair]) {
      return ASSET_PAIRS[selectedPair].decimals;
    }
    return candles[0]?.close > 20 ? 3 : 5;
  }, [candles, selectedPair]);

  // Adjust default viewport size and scroll index depending on selected timeframe
  useEffect(() => {
    const sizeList: Record<Timeframe, number> = {
      M15: 60,
      H1: 40,
      H4: 24,
      D1: 5
    };
    const size = sizeList[timeframe] || 40;
    setViewSize(size);
    setAutoScroll(true);
    setScrollOffset(Math.max(0, candles.length - Math.round(size * 0.85)));
  }, [timeframe]);

  const totalWeekLength = useMemo(() => {
    return timeframe === "M15" ? 480 : timeframe === "H1" ? 120 : timeframe === "H4" ? 30 : 5;
  }, [timeframe]);

  const maxScroll = useMemo(() => {
    return Math.max(0, totalWeekLength - viewSize);
  }, [totalWeekLength, viewSize]);

  // Live scroll offset mapping
  const currentScrollOffset = useMemo(() => {
    if (autoScroll) {
      const calculated = Math.max(0, candles.length - Math.round(viewSize * 0.85));
      return Math.min(calculated, maxScroll);
    }
    return Math.min(scrollOffset, maxScroll);
  }, [autoScroll, scrollOffset, candles.length, viewSize, maxScroll]);

  // Revealed candles that are active inside the horizontal display viewport
  const viewportCandles = useMemo(() => {
    const res: { candle: Candle; index: number }[] = [];
    const endBound = Math.min(candles.length, currentScrollOffset + viewSize);
    for (let i = currentScrollOffset; i < endBound; i++) {
      if (candles[i]) {
        res.push({ candle: candles[i], index: i });
      }
    }
    return res;
  }, [candles, currentScrollOffset, viewSize]);

  // Dynamic vertical scaling bounds based on high/low extremes of revealed candles in viewport
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (viewportCandles.length === 0) {
      if (candles[0]) {
        const start = candles[0].open;
        const pad = start > 10000 ? 150.0 : start > 1000 ? 25.0 : start > 20 ? 1.0 : 0.0100;
        return { minPrice: start - pad, maxPrice: start + pad, priceRange: pad * 2 };
      }
      return { minPrice: 1.0800, maxPrice: 1.0900, priceRange: 0.0100 };
    }

    let min = Infinity;
    let max = -Infinity;

    viewportCandles.forEach(({ candle: c }) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });

    // Capture active trade boundaries to prevent visual clip off
    if (activePosition) {
      const groupSize = timeframe === "M15" ? 1 : timeframe === "H1" ? 4 : timeframe === "H4" ? 16 : 96;
      const entryTfIdx = Math.round(activePosition.openedAtM15Index / groupSize);
      if (entryTfIdx >= currentScrollOffset && entryTfIdx <= currentScrollOffset + viewSize) {
        min = Math.min(min, activePosition.stopLoss, activePosition.entryPrice);
        max = Math.max(max, activePosition.takeProfit, activePosition.entryPrice);
      }
    }

    // Capture Weekly Draw boundary if active and relevant
    if (showDrawLine) {
      min = Math.min(min, weeklyDraw);
      max = Math.max(max, weeklyDraw);
    }

    // Padding
    const priceValue = candles[0]?.close || 1.0;
    const padding = priceValue > 10000 ? 120.0 : priceValue > 1000 ? 15.0 : priceValue > 50 ? 0.20 : 0.0015;
    min -= padding;
    max += padding;

    return {
      minPrice: min,
      maxPrice: max,
      priceRange: max - min <= 0 ? 0.0100 : max - min
    };
  }, [viewportCandles, candles, activePosition, weeklyDraw, showDrawLine, timeframe, currentScrollOffset, viewSize]);

  // SVG Dimension defaults
  const width = 800;
  const height = 380;
  const paddingLeft = 10;
  const paddingRight = 65;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Viewport-aware horizontal coordinates mapping
  const getX = (index: number) => {
    return paddingLeft + ((index - currentScrollOffset) / viewSize) * chartWidth;
  };

  const getY = (price: number) => {
    const ratio = (price - minPrice) / priceRange;
    return paddingTop + chartHeight - ratio * chartHeight;
  };

  // Horizontal Grid pricing lines (clean intervals relative to price range)
  const yLines = useMemo(() => {
    const lines = [];
    const priceVal = candles[0]?.close || 1.0;
    let step = 0.0020;
    if (priceVal > 10000) step = 100.0;
    else if (priceVal > 1000) step = 10.0;
    else if (priceVal > 50) step = 0.20;
    else if (priceVal > 1) step = 0.0050;

    const start = Math.ceil(minPrice / step) * step;
    for (let priceLevel = start; priceLevel <= maxPrice; priceLevel += step) {
      lines.push(priceLevel);
    }
    return lines;
  }, [minPrice, maxPrice, candles]);

  // Segment columns for Days calculated cleanly spanning the viewport dimensions
  const dayColumns = useMemo(() => {
    const perDay = totalWeekLength / 5;
    return [
      { name: "MON", start: 0, end: perDay - 1 },
      { name: "TUE", start: perDay, end: perDay * 2 - 1 },
      { name: "WED", start: perDay * 2, end: perDay * 3 - 1 },
      { name: "THU", start: perDay * 3, end: perDay * 4 - 1 },
      { name: "FRI", start: perDay * 4, end: totalWeekLength - 1 }
    ];
  }, [totalWeekLength]);

  return (
    <div className="bg-[#0F121E] border border-slate-800/80 rounded-2xl p-4 shadow-xl select-none relative" id="interactive-chart-panel">
      {/* Chart Top Metadata Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-cyan-400 font-extrabold font-plus bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800/40 uppercase tracking-wider">
            {symbol} : {timeframe}
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline uppercase tracking-widest">
            Backtesting Sandbox Mode
          </span>
        </div>

        {/* OHLC Interactive Info */}
        <div className="flex items-center gap-3 font-mono text-[10px] bg-[#080A10]/90 px-3 py-1.5 rounded-lg border border-slate-800/60 shadow-inner">
          {hoveredCandle || viewportCandles[viewportCandles.length - 1] ? (
            (() => {
              const c = hoveredCandle || viewportCandles[viewportCandles.length - 1].candle;
              const isBull = c.close >= c.open;
              return (
                <>
                  <span className="text-slate-400 font-mono tracking-wide font-semibold">{c.day}</span>
                  <span>O: <span className="text-slate-300 font-bold">{c.open.toFixed(dec)}</span></span>
                  <span>H: <span className="text-emerald-400 font-bold">{c.high.toFixed(dec)}</span></span>
                  <span>L: <span className="text-rose-400 font-bold">{c.low.toFixed(dec)}</span></span>
                  <span>C: <span className={isBull ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{c.close.toFixed(dec)}</span></span>
                </>
              );
            })()
          ) : (
            <span className="text-slate-500">Play replay or hover candles</span>
          )}
        </div>

        {/* Visibility Toggles */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-pd-arrays"
            onClick={() => setShowPDArrays(!showPDArrays)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-all border cursor-pointer ${
              showPDArrays
                ? "bg-indigo-500/10 text-emerald-400 border-emerald-500/30 font-bold shadow-sm shadow-emerald-500/5 animate-pulse"
                : "bg-[#080A10] text-[#556080] border-slate-800 hover:text-slate-200"
            }`}
            title="Toggle PD arrays highlighted from the playbook"
          >
            {showPDArrays ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="font-plus text-[10px] uppercase font-semibold tracking-wider">Playbook Zones</span>
          </button>

          <button
            id="toggle-draw-line"
            onClick={() => setShowDrawLine(!showDrawLine)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-all border cursor-pointer ${
              showDrawLine
                ? "bg-indigo-500/10 text-cyan-400 border-cyan-500/30 font-bold shadow-sm shadow-cyan-500/5"
                : "bg-[#080A10] text-[#556080] border-slate-800 hover:text-slate-200"
            }`}
            title="Toggle high timeframe weekly target (DOL)"
          >
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-plus text-[10px] uppercase font-semibold tracking-wider">Target (DOL)</span>
          </button>
        </div>
      </div>

      {/* Main SVG Chart Drawer */}
      <div className="relative overflow-hidden rounded-xl bg-[#080A10] p-1 border border-slate-800/40">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto overflow-visible select-none"
          id="svg-chart-root"
        >
          {/* Vertical Columns for Days with Elegant Dashed Borders */}
          {dayColumns.map((dayCol, colIdx) => {
            const startX = Math.max(paddingLeft, getX(dayCol.start));
            const endX = Math.min(paddingLeft + chartWidth, getX(dayCol.end + 1));
            const fontX = getX(dayCol.start);

            if (endX <= startX) return null; // Outside viewport

            const isRevealed = candles.length > dayCol.start;

            return (
              <g key={dayCol.name}>
                {/* Column Background Highlight */}
                {isRevealed && (
                  <rect
                    x={startX}
                    y={paddingTop}
                    width={endX - startX}
                    height={chartHeight}
                    fill={colIdx % 2 === 0 ? "rgba(30, 41, 59, 0.08)" : "rgba(15, 23, 42, 0.06)"}
                  />
                )}

                {/* Day Divider Vertical Line */}
                {fontX >= paddingLeft && fontX <= paddingLeft + chartWidth && (
                  <line
                    x1={fontX}
                    y1={paddingTop}
                    x2={fontX}
                    y2={paddingTop + chartHeight}
                    stroke="rgba(30, 41, 59, 0.4)"
                    strokeWidth={1}
                    strokeDasharray="4,4"
                  />
                )}

                {/* Day Label Centered on the visible region */}
                <text
                  x={startX + (endX - startX) / 2}
                  y={paddingTop - 8}
                  textAnchor="middle"
                  className="fill-slate-500 font-mono text-[9px] uppercase font-bold tracking-widest"
                >
                  {dayCol.name}
                </text>
              </g>
            );
          })}

          {/* Horizontal Grid price lines */}
          {yLines.map((price) => {
            const y = getY(price);
            if (y < paddingTop || y > paddingTop + chartHeight) return null;

            return (
              <g key={price}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + chartWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth={0.5}
                  opacity={0.6}
                />
                {!hidePricesSetting && (
                  <text
                    x={paddingLeft + chartWidth + 6}
                    y={y + 3}
                    className="fill-slate-500 font-mono text-[9px] text-right"
                    alignmentBaseline="middle"
                  >
                    {price.toFixed(dec)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Render Book PD Arrays if Toggled On and within Viewport */}
          {showPDArrays &&
            pdArrays.map((arr) => {
              const yStart = getY(arr.priceStart);
              const yEnd = getY(arr.priceEnd);

              const dayEnumStart = arr.timeStart.split(" ")[0];
              const dayEnumEnd = arr.timeEnd.split(" ")[0];

              const getDayIndexLimit = (dayStr: string, isEnd: boolean) => {
                const baseM15Map: Record<string, number> = { MON: 0, TUE: 96, WED: 192, THU: 288, FRI: 384 };
                const groupSize = timeframe === "M15" ? 1 : timeframe === "H1" ? 4 : timeframe === "H4" ? 16 : 96;
                const m15Idx = baseM15Map[dayStr] !== undefined ? baseM15Map[dayStr] + (isEnd ? 95 : 0) : 0;
                return Math.floor(m15Idx / groupSize);
              };

              const startCandleIdx = getDayIndexLimit(dayEnumStart, false);
              const endCandleIdx = Math.min(getDayIndexLimit(dayEnumEnd, true), candles.length - 1);

              if (endCandleIdx < startCandleIdx) return null; // Array not yet revealed in playback at all

              const xStart = Math.max(paddingLeft, getX(startCandleIdx));
              const xEnd = Math.min(paddingLeft + chartWidth, getX(endCandleIdx));

              if (xEnd <= xStart) return null; // Not visible in current scrolled viewport range

              const isPremium = arr.type === "premium" || arr.type === "liquidity_high";
              const bgColor = isPremium 
                ? "rgba(244, 63, 94, 0.05)"
                : "rgba(16, 185, 129, 0.05)";

              const strokeColor = isPremium
                ? "rgba(244, 63, 94, 0.25)"
                : "rgba(16, 185, 129, 0.25)";

              return (
                <g key={arr.id} className="opacity-95">
                  <rect
                    x={xStart}
                    y={Math.min(yStart, yEnd)}
                    width={xEnd - xStart}
                    height={Math.max(1.5, Math.abs(yStart - yEnd))}
                    fill={bgColor}
                    stroke={strokeColor}
                    strokeWidth={1}
                    strokeDasharray={arr.type.includes("liquidity") ? "3,3" : "none"}
                  />
                  <text
                    x={xStart + 6}
                    y={Math.min(yStart, yEnd) - 4}
                    className={`font-mono text-[8px] font-extrabold ${
                      isPremium ? "fill-rose-450" : "fill-emerald-450"
                    }`}
                  >
                    ⚡ {arr.name}
                  </text>
                </g>
              );
            })}

          {/* Render Weekly Draw On Liquidity Target if toggled and visible */}
          {showDrawLine && getY(weeklyDraw) >= paddingTop && getY(weeklyDraw) <= paddingTop + chartHeight && (
            <g id="draw-on-liquidity-group">
              <line
                id="weekly-draw-liquidity-line"
                x1={paddingLeft}
                y1={getY(weeklyDraw)}
                x2={paddingLeft + chartWidth}
                y2={getY(weeklyDraw)}
                stroke="#06b6d4"
                strokeWidth={1}
                strokeDasharray="5,3"
                opacity={0.8}
              />
              <rect
                x={paddingLeft + chartWidth - 110}
                y={getY(weeklyDraw) - 15}
                width={105}
                height={12}
                rx={2}
                fill="#083344"
                stroke="#0891b2"
                strokeWidth={0.5}
              />
              <text
                x={paddingLeft + chartWidth - 58}
                y={getY(weeklyDraw) - 8}
                textAnchor="middle"
                alignmentBaseline="middle"
                className="fill-cyan-300 font-mono text-[8px] tracking-wide font-extrabold"
              >
                🎯 Draw on Liquidity
              </text>
            </g>
          )}

          {/* Closed trade markers (Entry/Exits) mapped perfectly to TF coordinate scales */}
          {!hideOrdersSetting && closedPositions.map((pos) => {
            const groupSize = timeframe === "M15" ? 1 : timeframe === "H1" ? 4 : timeframe === "H4" ? 16 : 96;
            const entryTfIdx = Math.round(pos.openedAtM15Index / groupSize);
            const exitTfIdx = pos.closedAtM15Index !== undefined ? Math.round(pos.closedAtM15Index / groupSize) : candles.length - 1;

            const entryX = getX(entryTfIdx);
            const exitX = getX(exitTfIdx);
            const entryY = getY(pos.entryPrice);
            const exitY = getY(pos.closedPrice ?? pos.entryPrice);
            const isProfit = pos.pnl > 0;

            const showEntry = entryX >= paddingLeft && entryX <= paddingLeft + chartWidth;
            const showExit = exitX >= paddingLeft && exitX <= paddingLeft + chartWidth;

            if (!showEntry && !showExit) return null;

            return (
              <g key={pos.id} className="opacity-90">
                {/* Connector line scrolling cleanly */}
                <line
                  x1={entryX}
                  y1={entryY}
                  x2={exitX}
                  y2={exitY}
                  stroke={isProfit ? "#10b981" : "#f43f5e"}
                  strokeWidth={1}
                  strokeDasharray="3,3"
                />
                {showEntry && (
                  <circle cx={entryX} cy={entryY} r={4.5} fill="#1e293b" stroke="#e2e8f0" strokeWidth={1} />
                )}
                {showExit && (
                  <path
                    d={`M ${exitX} ${exitY} l 8 -5 l 0 10 z`}
                    fill={isProfit ? "#10b981" : "#f43f5e"}
                  />
                )}
              </g>
            );
          })}

          {/* Active Position Overlay Lines */}
          {activePosition && !hideOrdersSetting && (
            <g id="active-position-overlay-group">
              {/* Entry Level */}
              {getY(activePosition.entryPrice) >= paddingTop && getY(activePosition.entryPrice) <= paddingTop + chartHeight && (
                <g>
                   <line
                    x1={paddingLeft}
                    y1={getY(activePosition.entryPrice)}
                    x2={paddingLeft + chartWidth}
                    y2={getY(activePosition.entryPrice)}
                    stroke="#ffffff"
                    strokeWidth={1}
                    strokeDasharray="6,4"
                  />
                  <text
                    x={paddingLeft + 10}
                    y={getY(activePosition.entryPrice) - 4}
                    className="fill-slate-100 font-mono text-[8px] font-bold"
                  >
                    LIVE {activePosition.type} ENTRY @ {activePosition.entryPrice.toFixed(dec)}
                  </text>
                </g>
              )}

              {/* Stop Loss Level */}
              {getY(activePosition.stopLoss) >= paddingTop && getY(activePosition.stopLoss) <= paddingTop + chartHeight && (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={getY(activePosition.stopLoss)}
                    x2={paddingLeft + chartWidth}
                    y2={getY(activePosition.stopLoss)}
                    stroke="#f43f5e"
                    strokeWidth={1}
                    strokeDasharray="4,2"
                  />
                  <text
                    x={paddingLeft + 10}
                    y={getY(activePosition.stopLoss) - 4}
                    className="fill-rose-450 font-mono text-[8px] font-bold"
                  >
                    🛑 SL @ {activePosition.stopLoss.toFixed(dec)}
                  </text>
                </g>
              )}

              {/* Take Profit Level */}
              {getY(activePosition.takeProfit) >= paddingTop && getY(activePosition.takeProfit) <= paddingTop + chartHeight && (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={getY(activePosition.takeProfit)}
                    x2={paddingLeft + chartWidth}
                    y2={getY(activePosition.takeProfit)}
                    stroke="#10b981"
                    strokeWidth={1}
                    strokeDasharray="4,2"
                  />
                  <text
                    x={paddingLeft + 10}
                    y={getY(activePosition.takeProfit) - 4}
                    className="fill-green-400 font-mono text-[8px] font-bold"
                  >
                    ❇️ TP @ {activePosition.takeProfit.toFixed(dec)}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* CANDLESTICKS RENDERING */}
          {viewportCandles.map(({ candle: c, index }) => {
            const x = getX(index);
            const yOpen = getY(c.open);
            const yClose = getY(c.close);
            const yHigh = getY(c.high);
            const yLow = getY(c.low);

            const isBull = c.close >= c.open;
            
            // Width adapted strictly to viewSize in viewport
            const w = Math.max(3.5, (chartWidth / viewSize) * 0.65);

            return (
              <g
                key={c.id}
                onMouseEnter={() => setHoveredCandle(c)}
                onMouseLeave={() => setHoveredCandle(null)}
                className="cursor-crosshair transition-all duration-100"
              >
                {/* Hover Target Hotspot Box for responsive hovering */}
                <rect
                  x={x - w / 2 - 2}
                  y={paddingTop}
                  width={w + 4}
                  height={chartHeight}
                  fill="transparent"
                />

                {/* Vertical Wick Line */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={isBull ? "#10b981" : "#ef4444"}
                  strokeWidth={1.5}
                />

                {/* Solid candlestick body */}
                <rect
                  x={x - w / 2}
                  y={Math.min(yOpen, yClose)}
                  width={w}
                  height={Math.max(Math.abs(yOpen - yClose), 1.5)}
                  fill={smoothCandlesSetting ? (isBull ? "rgba(16, 185, 129, 0.22)" : "rgba(239, 68, 68, 0.22)") : (isBull ? "#064e3b" : "#7f1d1d")}
                  stroke={isBull ? "#10b981" : "#ef4444"}
                  strokeWidth={smoothCandlesSetting ? 0.8 : 1.25}
                  rx={smoothCandlesSetting ? 2 : 1}
                />
              </g>
            );
          })}

          {/* Current Live Replay Location Tracker Line */}
          {candles.length > 0 && getX(candles.length - 1) >= paddingLeft && getX(candles.length - 1) <= paddingLeft + chartWidth && (
            <line
              x1={getX(candles.length - 1)}
              y1={paddingTop}
              x2={getX(candles.length - 1)}
              y2={paddingTop + chartHeight}
              stroke="#cbd5e1"
              strokeWidth={1}
              strokeDasharray="2,2"
              opacity={0.8}
            />
          )}
        </svg>

        {/* Floating Watermark */}
        <div className="absolute top-[45%] left-[50%] -translate-x-[50%] -translate-y-[50%] pointer-events-none opacity-[0.02] select-none text-center">
          <Layers className="w-40 h-40 mx-auto text-slate-100" />
          <span className="text-3xl tracking-widest font-mono font-black text-slate-100 uppercase block mt-1">
            TRADEZELLA PRO
          </span>
          <span className="text-xs font-mono text-slate-400 block tracking-widest uppercase">
            BACKTESTING REPLAY
          </span>
        </div>
      </div>

      {/* Scroll and Zoom Viewport Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono select-none">
        <div className="flex items-center gap-2">
          {/* Zoom Buttons and Navigation */}
          <button
            onClick={() => {
              setAutoScroll(false);
              setScrollOffset(prev => Math.max(0, prev - 5));
            }}
            className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 active:scale-95 transition-all text-slate-450 hover:text-slate-200"
            title="Scroll Left"
          >
            ◀
          </button>
          
          <button
            onClick={() => {
              setAutoScroll(false);
              setScrollOffset(prev => Math.min(maxScroll, prev + 5));
            }}
            className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 active:scale-95 transition-all text-slate-450 hover:text-slate-200"
            title="Scroll Right"
          >
            ▶
          </button>
          
          <span className="text-[10px] text-slate-550 font-sans ml-2">Zoom:</span>
          
          <button
            onClick={() => setViewSize(prev => Math.max(10, prev - 5))}
            className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 active:scale-95 transition-all text-slate-350 hover:text-slate-100"
            title="Zoom In (Fewer Bars)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => {
              setViewSize(prev => Math.min(totalWeekLength, prev + 5));
            }}
            className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 active:scale-95 transition-all text-slate-350 hover:text-slate-100"
            title="Zoom Out (More Bars)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Viewport bar slider */}
        <div className="flex-1 max-w-[240px] flex items-center gap-2">
          <span className="text-[10px] text-slate-550">Bar View:</span>
          <input
            type="range"
            min="0"
            max={maxScroll}
            value={currentScrollOffset}
            onChange={(e) => {
              setAutoScroll(false);
              setScrollOffset(parseInt(e.target.value));
            }}
            disabled={maxScroll === 0}
            className="flex-1 accent-cyan-500 bg-slate-950 h-1 rounded cursor-pointer disabled:opacity-30"
          />
        </div>

        {/* Auto Scroll Toggle */}
        <button
          onClick={() => {
            setAutoScroll(prev => !prev);
            if (!autoScroll) {
              const defaultSize = timeframe === "M15" ? 60 : timeframe === "H1" ? 40 : timeframe === "H4" ? 24 : 5;
              setScrollOffset(Math.max(0, candles.length - Math.round(defaultSize * 0.85)));
            }
          }}
          className={`px-2.5 py-1.5 rounded-lg border text-[10px] flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
            autoScroll
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
              : "bg-slate-950 border-slate-800 text-slate-450 hover:text-slate-200"
          }`}
        >
          <span className={`w-1 h-1 rounded-full ${autoScroll ? "bg-cyan-400 animate-pulse" : "bg-slate-500"}`}></span>
          Auto-Fit Live
        </button>
      </div>
    </div>
  );
}
