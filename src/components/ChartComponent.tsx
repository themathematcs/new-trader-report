import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries, LineSeries } from 'lightweight-charts';

export type ChartOrder = {
  id: string;
  price: number;
  type: 'buy' | 'sell' | 'sl' | 'tp' | 'position';
  title: string;
  symbol?: string;
  qty?: number;
  isLong?: boolean;
  entryTime?: number;
};

export type ClosedTrade = {
  id: string;
  symbol: string;
  isLong: boolean;
  entryTime: number;
  entryPrice: number;
  exitTime: number;
  exitPrice: number;
};

export type Drawing = {
  id: string;
  type: 'trendline' | 'brush' | 'fib' | 'text' | 'shape';
  points: { time: number; price: number }[];
  text?: string;
  symbol: string;
};

export const ChartComponent = (props: {
  data: any[];
  liveUpdate?: boolean;
  orders?: ChartOrder[];
  closedTrades?: ClosedTrade[];
  onOrderDragEnd?: (id: string, newPrice: number) => void;
  onPriceUpdate?: (price: number) => void;
  activeDrawingTool?: string;
  onDrawingToolChange?: (tool: string) => void;
  magnetEnabled?: boolean;
  drawingsLocked?: boolean;
  drawingsHidden?: boolean;
  symbol?: string;
  drawings?: Drawing[];
  onAddDrawing?: (drawing: Drawing) => void;
  onDeleteDrawing?: (id: string) => void;
  onUpdateDrawing?: (drawing: Drawing) => void;
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
  };
}) => {
  const {
    data,
    liveUpdate = false,
    orders = [],
    closedTrades = [],
    onOrderDragEnd,
    onPriceUpdate,
    activeDrawingTool = "cursor",
    onDrawingToolChange,
    magnetEnabled = false,
    drawingsLocked = false,
    drawingsHidden = false,
    symbol = "",
    drawings = [],
    onAddDrawing,
    onDeleteDrawing,
    onUpdateDrawing,
    colors: {
      backgroundColor = '#0A0C14',
      lineColor = '#2962FF',
      textColor = '#7C88A8',
      areaTopColor = '#2962FF',
      areaBottomColor = 'rgba(41, 98, 255, 0.28)',
    } = {},
  } = props;

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const priceLinesRef = useRef<Record<string, any>>({});
  const closedTradeSeriesRef = useRef<Record<string, any>>({});
  const ordersRef = useRef<ChartOrder[]>(orders);

  // States for drawings
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [activePoints, setActivePoints] = useState<{ time: number; price: number }[]>([]);
  const [drawingInProgress, setDrawingInProgress] = useState(false);
  const [textInputState, setTextInputState] = useState<{ x: number; y: number; time: number; price: number } | null>(null);
  const [textInputValue, setTextInputValue] = useState("");

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    if (!seriesRef.current) return;

    // Clear old price lines
    Object.values(priceLinesRef.current).forEach((pl: any) => {
        try { seriesRef.current.removePriceLine(pl); } catch(e){}
    });
    priceLinesRef.current = {};

    orders.forEach(order => {
        const color = (order.type === 'buy' || order.type === 'position') ? '#18A265' : 
                      order.type === 'tp' ? '#2962FF' : '#D8363F';
        priceLinesRef.current[order.id] = seriesRef.current.createPriceLine({
            price: order.price,
            color,
            lineWidth: 2,
            lineStyle: order.type === 'sl' || order.type === 'tp' ? 2 : 1, // Dashed: 2, Dotted: 1
            axisLabelVisible: true,
            title: order.title,
        });
    });
  }, [orders]);

  const onPriceUpdateRef = useRef(onPriceUpdate);
  useEffect(() => {
    onPriceUpdateRef.current = onPriceUpdate;
  }, [onPriceUpdate]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
     
    const tradeIds = new Set(closedTrades.map(t => t.id));
    Object.keys(closedTradeSeriesRef.current).forEach(id => {
      if (!tradeIds.has(id)) {
          try { chart.removeSeries(closedTradeSeriesRef.current[id]); } catch(e){}
          delete closedTradeSeriesRef.current[id];
      }
    });

    closedTrades.forEach(trade => {
       if (!closedTradeSeriesRef.current[trade.id]) {
           const series = chart.addSeries(LineSeries, {
              color: trade.isLong ? 'rgba(24, 162, 101, 0.8)' : 'rgba(216, 54, 63, 0.8)',
              lineWidth: 2,
              lineStyle: 1, // Dotted
              lastVisiblePriceVisible: false,
              priceLineVisible: false,
              crosshairMarkerVisible: false,
           });
           
           try {
             const exitTime = trade.exitTime > trade.entryTime ? trade.exitTime : trade.entryTime + 1;
             series.setData([
                { time: trade.entryTime, value: trade.entryPrice },
                { time: exitTime, value: trade.exitPrice }
             ]);
             closedTradeSeriesRef.current[trade.id] = series;
           } catch(e) {
             console.error("Error setting closed trade series", e);
           }
       }
    });
  }, [closedTrades]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) {
        return;
      }
      const newRect = entries[0].contentRect;
      chartRef.current?.applyOptions({ width: newRect.width, height: newRect.height });
      setRenderTrigger(prev => prev + 1);
    });

    resizeObserver.observe(chartContainerRef.current);

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.3)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.3)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      }
    });

    chartRef.current.timeScale().fitContent();

    // Trigger update on zoom/scroll so drawing overlays shift perfectly matching chart data
    const handleScrollOrZoom = () => {
      setRenderTrigger(prev => prev + 1);
    };
    chartRef.current.timeScale().subscribeVisibleTimeRangeChange(handleScrollOrZoom);

    seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
      upColor: '#18A265',
      downColor: '#D8363F',
      borderDownColor: '#D8363F',
      borderUpColor: '#18A265',
      wickDownColor: '#D8363F',
      wickUpColor: '#18A265',
    });

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        try { chartRef.current.timeScale().unsubscribeVisibleTimeRangeChange(handleScrollOrZoom); } catch(e){}
        chartRef.current.remove();
      }
    };
  }, [backgroundColor, textColor]);

  const prevDataRef = useRef(data);
  useEffect(() => {
    if (seriesRef.current && data) {
        if (prevDataRef.current && data.length === prevDataRef.current.length + 1 && prevDataRef.current.length > 0) {
            seriesRef.current.update(data[data.length - 1]);
        } else {
            seriesRef.current.setData(data);
        }
        prevDataRef.current = data;
        setRenderTrigger(prev => prev + 1);
    }
  }, [data]);

  const onOrderDragEndRef = useRef(onOrderDragEnd);
  useEffect(() => {
    onOrderDragEndRef.current = onOrderDragEnd;
  }, [onOrderDragEnd]);

  // Order drag mouse listener setup
  useEffect(() => {
    let draggingOrderId: string | null = null;
    const container = chartContainerRef.current;
    if (!container) return;

    const onMouseDown = (e: MouseEvent) => {
        if (activeDrawingTool && activeDrawingTool !== 'cursor') return; // Bypass if drawing tools active
        if (!chartRef.current || !seriesRef.current || !ordersRef.current) return;
        const rect = container.getBoundingClientRect();
        const y = e.clientY - rect.top;
        
        for (const order of ordersRef.current) {
            if (['sl', 'tp'].includes(order.type)) {
                const orderY = seriesRef.current.priceToCoordinate(order.price);
                if (orderY !== null && Math.abs(orderY - y) < 20) {
                    draggingOrderId = order.id;
                    chartRef.current?.applyOptions({ handleScroll: false, handleScale: false });
                    break;
                }
            }
        }
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!draggingOrderId || !seriesRef.current || !priceLinesRef.current[draggingOrderId]) return;
        const rect = container.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const price = seriesRef.current.coordinateToPrice(y);
        if (price !== null) {
            priceLinesRef.current[draggingOrderId].applyOptions({ price });
        }
    };

    const onMouseUp = (e: MouseEvent) => {
        if (draggingOrderId && seriesRef.current) {
            chartRef.current?.applyOptions({ handleScroll: true, handleScale: true });
            const rect = container.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const finalPrice = seriesRef.current.coordinateToPrice(y);
            if (finalPrice !== null && onOrderDragEndRef.current) {
                onOrderDragEndRef.current(draggingOrderId, finalPrice);
            }
            draggingOrderId = null;
        }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
        container.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };
  }, [activeDrawingTool]);

  // Helper coordinate conversions
  const getCoords = (time: number, price: number) => {
    if (!chartRef.current || !seriesRef.current) return null;
    const x = chartRef.current.timeScale().timeToCoordinate(time as any);
    const y = seriesRef.current.priceToCoordinate(price);
    if (x === null || y === null) return null;
    return { x, y };
  };

  const handleMagnetSnap = (mouseX: number, currentPrice: number) => {
    if (!chartRef.current || !seriesRef.current || !magnetEnabled || !data.length) {
      return currentPrice;
    }
    const time = chartRef.current.timeScale().coordinateToTime(mouseX);
    if (!time) return currentPrice;

    const candle = data.find(c => c.time === time);
    if (!candle) return currentPrice;

    const options = [candle.open, candle.high, candle.low, candle.close];
    let closestVal = currentPrice;
    let minDistance = Infinity;

    options.forEach(val => {
      const coordY = seriesRef.current.priceToCoordinate(val);
      if (coordY !== null) {
        const yForCurrent = seriesRef.current.priceToCoordinate(currentPrice);
        if (yForCurrent !== null) {
          const dist = Math.abs(coordY - yForCurrent);
          if (dist < minDistance) {
            minDistance = dist;
            closestVal = val;
          }
        }
      }
    });

    return minDistance < 40 ? closestVal : currentPrice;
  };

  // States for interactive drawing selection and manipulation
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    drawingId: string;
    type: 'point' | 'body';
    pointIndex?: number;
    startPoints: { time: number; price: number }[];
    startMouseX: number;
    startMouseY: number;
  } | null>(null);

  // Helper functions to initialize dragging
  const startDragPoint = (e: React.MouseEvent, drawingId: string, pointIndex: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    const targetDrawing = drawings.find(d => d.id === drawingId);
    if (!targetDrawing) return;

    setDragState({
      drawingId,
      type: 'point',
      pointIndex,
      startPoints: JSON.parse(JSON.stringify(targetDrawing.points)),
      startMouseX: startX,
      startMouseY: startY,
    });
    setSelectedDrawingId(drawingId);

    chartRef.current?.applyOptions({ handleScroll: false, handleScale: false });
  };

  const startDragBody = (e: React.MouseEvent, drawingId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (activeDrawingTool && activeDrawingTool !== 'cursor') return; 
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    const targetDrawing = drawings.find(d => d.id === drawingId);
    if (!targetDrawing) return;

    setDragState({
      drawingId,
      type: 'body',
      startPoints: JSON.parse(JSON.stringify(targetDrawing.points)),
      startMouseX: startX,
      startMouseY: startY,
    });
    setSelectedDrawingId(drawingId);

    chartRef.current?.applyOptions({ handleScroll: false, handleScale: false });
  };

  // Drag and Move Handler: translates/stretches points dynamically on window mouse moves
  useEffect(() => {
    if (!dragState || !chartRef.current || !seriesRef.current) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const deltaX = currentX - dragState.startMouseX;
      const deltaY = currentY - dragState.startMouseY;

      const targetDrawing = drawings.find(d => d.id === dragState.drawingId);
      if (!targetDrawing) return;

      const updatedPoints = dragState.startPoints.map((pt, idx) => {
        if (dragState.type === 'point' && dragState.pointIndex !== idx) {
          return pt;
        }

        const startCoord = getCoords(pt.time, pt.price);
        if (!startCoord) return pt;

        let newX = startCoord.x + deltaX;
        let newY = startCoord.y + deltaY;

        if (dragState.type === 'point' && magnetEnabled) {
          const rawPrice = seriesRef.current.coordinateToPrice(newY);
          if (rawPrice !== null) {
            const snappedPrice = handleMagnetSnap(newX, rawPrice);
            const snappedY = seriesRef.current.priceToCoordinate(snappedPrice);
            if (snappedY !== null) {
              newY = snappedY;
            }
          }
        }

        const newTime = chartRef.current.timeScale().coordinateToTime(newX);
        const newPrice = seriesRef.current.coordinateToPrice(newY);

        return {
          time: newTime !== null && newTime !== undefined ? (newTime as any) : pt.time,
          price: newPrice !== null && newPrice !== undefined ? newPrice : pt.price,
        };
      });

      if (onUpdateDrawing) {
        onUpdateDrawing({
          ...targetDrawing,
          points: updatedPoints,
        });
      }
    };

    const handleWindowMouseUp = () => {
      setDragState(null);
      chartRef.current?.applyOptions({ handleScroll: true, handleScale: true });
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [dragState, drawings, magnetEnabled, onUpdateDrawing]);

  // Click outside chart area handler for deselecting active selection
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (svgRef.current && svgRef.current.contains(target)) {
        return;
      }
      setSelectedDrawingId(null);
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Deletion keypress (Delete / Backspace) hotkeys handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedDrawingId && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          onDeleteDrawing?.(selectedDrawingId);
          setSelectedDrawingId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedDrawingId, onDeleteDrawing]);

  // SVG Drawing Handlers
  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (drawingsLocked || !activeDrawingTool || activeDrawingTool === 'cursor') return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || !chartRef.current || !seriesRef.current) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const timeScale = chartRef.current.timeScale();
    const time = timeScale.coordinateToTime(x);
    let rawPrice = seriesRef.current.coordinateToPrice(y);

    if (!time || rawPrice === null) return;
    rawPrice = handleMagnetSnap(x, rawPrice);

    // Disable LWC native panning while drawing inside SVG
    chartRef.current.applyOptions({ handleScroll: false, handleScale: false });

    if (activeDrawingTool === 'text') {
      setTextInputState({ x, y, time, price: rawPrice });
      setTextInputValue("");
      return;
    }

    setDrawingInProgress(true);
    if (activeDrawingTool === 'brush') {
      setActivePoints([{ time: time as any, price: rawPrice }]);
    } else {
      setActivePoints([
        { time: time as any, price: rawPrice },
        { time: time as any, price: rawPrice }
      ]);
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawingInProgress || !chartRef.current || !seriesRef.current || activePoints.length === 0) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = chartRef.current.timeScale().coordinateToTime(x);
    let rawPrice = seriesRef.current.coordinateToPrice(y);

    if (!time || rawPrice === null) return;
    rawPrice = handleMagnetSnap(x, rawPrice);

    if (activeDrawingTool === 'brush') {
      setActivePoints(prev => [...prev, { time: time as any, price: rawPrice }]);
    } else {
      setActivePoints(prev => [prev[0], { time: time as any, price: rawPrice }]);
    }
  };

  const handleSvgMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawingInProgress || !chartRef.current || !seriesRef.current || activePoints.length === 0) return;
    
    // Enable scale back
    chartRef.current.applyOptions({ handleScroll: true, handleScale: true });
    setDrawingInProgress(false);

    if (activeDrawingTool === 'zoom') {
      const t1 = activePoints[0].time;
      const t2 = activePoints[1]?.time || t1;
      if (t1 !== t2) {
        chartRef.current.timeScale().setVisibleRange({
          from: Math.min(t1, t2),
          to: Math.max(t1, t2)
        });
      }
      if (onDrawingToolChange) onDrawingToolChange("cursor");
      setActivePoints([]);
      return;
    }

    if (onAddDrawing) {
      onAddDrawing({
        id: `${activeDrawingTool}_${Date.now()}`,
        type: activeDrawingTool as any,
        points: [...activePoints],
        symbol: symbol,
      });
    }

    setActivePoints([]);
    // Do not auto change tool for drawing multiple, unless it's text/zoom
  };

  const confirmAddText = () => {
    if (textInputState && textInputValue.trim() && onAddDrawing) {
      onAddDrawing({
        id: `text_${Date.now()}`,
        type: 'text',
        points: [{ time: textInputState.time, price: textInputState.price }],
        text: textInputValue,
        symbol: symbol
      });
    }
    setTextInputState(null);
    setTextInputValue("");
    if (onDrawingToolChange) onDrawingToolChange("cursor");
    if (chartRef.current) {
      chartRef.current.applyOptions({ handleScroll: true, handleScale: true });
    }
  };

  // SVGs render methods
  const renderDrawings = () => {
    const activeDrawings = drawings.filter(d => d.symbol === symbol);
    const w = svgRef.current?.clientWidth || 800;

    return activeDrawings.map(d => {
      if (d.points.length === 0) return null;
      const isSelected = selectedDrawingId === d.id;

      if (d.type === 'trendline') {
        const c1 = getCoords(d.points[0].time, d.points[0].price);
        const c2 = d.points[1] ? getCoords(d.points[1].time, d.points[1].price) : null;
        if (!c1 || !c2) return null;

        return (
          <g key={d.id} className="group/draw" style={{ pointerEvents: 'auto' }}>
            {/* Invisible thick line for easy selection/clicking */}
            <line 
              x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} 
              stroke="transparent" strokeWidth="16" className="cursor-pointer pointer-events-auto"
              onMouseDown={(e) => startDragBody(e, d.id)}
            />
            {/* Main visible line */}
            <line 
              x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} 
              stroke={isSelected ? "#22d3ee" : "#22d3ee"} 
              strokeWidth={isSelected ? "3" : "2.5"} 
              strokeDasharray={isSelected ? "4,2" : undefined}
              className="pointer-events-none"
            />
            {isSelected ? (
              <>
                {/* Active resizing handle circles */}
                <circle cx={c1.x} cy={c1.y} r="7" fill="#1e293b" stroke="#22d3ee" strokeWidth="2.5" className="pointer-events-auto cursor-move" onMouseDown={(e) => startDragPoint(e, d.id, 0)} />
                <circle cx={c2.x} cy={c2.y} r="7" fill="#1e293b" stroke="#22d3ee" strokeWidth="2.5" className="pointer-events-auto cursor-move" onMouseDown={(e) => startDragPoint(e, d.id, 1)} />
                {/* Mid deletion helper button */}
                <circle cx={(c1.x + c2.x)/2} cy={(c1.y + c2.y)/2 - 20} r="11" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" className="pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); onDeleteDrawing?.(d.id); setSelectedDrawingId(null); }} />
                <path d={`M ${(c1.x + c2.x)/2 - 3.5} ${(c1.y + c2.y)/2 - 23.5} L ${(c1.x + c2.x)/2 + 3.5} ${(c1.y + c2.y)/2 - 16.5} M ${(c1.x + c2.x)/2 + 3.5} ${(c1.y + c2.y)/2 - 23.5} L ${(c1.x + c2.x)/2 - 3.5} ${(c1.y + c2.y)/2 - 16.5}`} stroke="white" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none" />
              </>
            ) : (
              <>
                <circle cx={c1.x} cy={c1.y} r="5" fill="#0A0C14" stroke="#22d3ee" strokeWidth="2" className="pointer-events-auto cursor-pointer" onMouseDown={(e) => startDragBody(e, d.id)} />
                <circle cx={c2.x} cy={c2.y} r="5" fill="#0A0C14" stroke="#22d3ee" strokeWidth="2" className="pointer-events-auto cursor-pointer" onMouseDown={(e) => startDragBody(e, d.id)} />
              </>
            )}
          </g>
        );
      }

      if (d.type === 'brush') {
        const pointsString = d.points
          .map(p => {
            const cc = getCoords(p.time, p.price);
            return cc ? `${cc.x},${cc.y}` : null;
          })
          .filter(Boolean)
          .join(' ');
        if (!pointsString) return null;

        const midIdx = Math.floor(d.points.length / 2);
        const midC = getCoords(d.points[midIdx].time, d.points[midIdx].price);

        return (
          <g key={d.id} className="group/draw" style={{ pointerEvents: 'auto' }}>
            {/* Invisible thick path for click selection */}
            <polyline 
              points={pointsString} stroke="transparent" strokeWidth="16" fill="none" className="cursor-pointer pointer-events-auto"
              onMouseDown={(e) => startDragBody(e, d.id)}
            />
            <polyline points={pointsString} stroke="#10b981" strokeWidth={isSelected ? "3.5" : "2.5"} strokeDasharray={isSelected ? "4,2" : undefined} fill="none" className="pointer-events-none" />
            {isSelected && midC && (
              <>
                <circle cx={midC.x} cy={midC.y - 20} r="11" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" className="pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); onDeleteDrawing?.(d.id); setSelectedDrawingId(null); }} />
                <path d={`M ${midC.x - 3.5} ${midC.y - 23.5} L ${midC.x + 3.5} ${midC.y - 16.5} M ${midC.x + 3.5} ${midC.y - 23.5} L ${midC.x - 3.5} ${midC.y - 16.5}`} stroke="white" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none" />
              </>
            )}
          </g>
        );
      }

      if (d.type === 'shape') {
        const c1 = getCoords(d.points[0].time, d.points[0].price);
        const c2 = d.points[1] ? getCoords(d.points[1].time, d.points[1].price) : null;
        if (!c1 || !c2) return null;

        const x = Math.min(c1.x, c2.x);
        const y = Math.min(c1.y, c2.y);
        const width = Math.max(10, Math.abs(c1.x - c2.x));
        const height = Math.max(10, Math.abs(c1.y - c2.y));

        return (
          <g key={d.id} className="group/draw" style={{ pointerEvents: 'auto' }}>
            {/* Click hit block */}
            <rect 
              x={x - 4} y={y - 4} width={width + 8} height={height + 8} 
              fill="rgba(99, 102, 241, 0.05)" stroke="transparent" strokeWidth="10" 
              className="cursor-pointer pointer-events-auto"
              onMouseDown={(e) => startDragBody(e, d.id)}
            />
            {/* Main visually rendered rect */}
            <rect 
              x={x} y={y} width={width} height={height} 
              fill="rgba(99, 102, 241, 0.15)" stroke="#6366f1" strokeWidth={isSelected ? "2.5" : "1.5"} 
              strokeDasharray={isSelected ? "4,2" : undefined}
              className="pointer-events-none"
            />
            {isSelected ? (
              <>
                <circle cx={c1.x} cy={c1.y} r="7" fill="#1e293b" stroke="#6366f1" strokeWidth="2.5" className="pointer-events-auto cursor-move" onMouseDown={(e) => startDragPoint(e, d.id, 0)} />
                <circle cx={c2.x} cy={c2.y} r="7" fill="#1e293b" stroke="#6366f1" strokeWidth="2.5" className="pointer-events-auto cursor-move" onMouseDown={(e) => startDragPoint(e, d.id, 1)} />
                <circle cx={x + width/2} cy={y + height/2} r="11" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" className="pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); onDeleteDrawing?.(d.id); setSelectedDrawingId(null); }} />
                <path d={`M ${x + width/2 - 3.5} ${y + height/2 - 3.5} L ${x + width/2 + 3.5} ${y + height/2 + 3.5} M ${x + width/2 + 3.5} ${y + height/2 - 3.5} L ${x + width/2 - 3.5} ${y + height/2 + 3.5}`} stroke="white" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none" />
              </>
            ) : null}
          </g>
        );
      }

      if (d.type === 'text') {
        const c = getCoords(d.points[0].time, d.points[0].price);
        if (!c) return null;

        const charWidth = 6.2;
        const width = (d.text?.length || 0) * charWidth + 12;

        return (
          <g key={d.id} className="group/draw" style={{ pointerEvents: 'auto' }}>
            <rect 
              rx="4" ry="4" x={c.x} y={c.y - 22} width={width} height={22} 
              fill="#1e1b4b" stroke={isSelected ? "#22d3ee" : "#4f46e5"} strokeWidth="1.5"
              className="cursor-pointer pointer-events-auto"
              onMouseDown={(e) => startDragBody(e, d.id)}
            />
            <text x={c.x + 6} y={c.y - 7} fill="#e0e7ff" fontSize="10" fontWeight="bold" fontFamily="sans-serif" className="pointer-events-none select-none">{d.text}</text>
            {isSelected && (
              <>
                <circle cx={c.x + width + 8} cy={c.y - 11} r="9" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" className="pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); onDeleteDrawing?.(d.id); setSelectedDrawingId(null); }} />
                <path d={`M ${c.x + width + 8 - 3} ${c.y - 11 - 3} L ${c.x + width + 8 + 3} ${c.y - 11 + 3} M ${c.x + width + 8 + 3} ${c.y - 11 - 3} L ${c.x + width + 8 - 3} ${c.y - 11 + 3}`} stroke="white" strokeWidth="2" strokeLinecap="round" className="pointer-events-none" />
              </>
            )}
          </g>
        );
      }

      if (d.type === 'fib') {
        const c1 = getCoords(d.points[0].time, d.points[0].price);
        const c2 = d.points[1] ? getCoords(d.points[1].time, d.points[1].price) : null;
        if (!c1 || !c2) return null;

        const p1 = d.points[0].price;
        const p2 = d.points[1].price;
        const diff = p1 - p2;

        const xMin = Math.min(c1.x, c2.x);
        const xMax = Math.max(c1.x, c2.x);
        const width = Math.max(10, xMax - xMin);

        const ratios = [
          { value: 1.0, label: '100.0% (High)', color: 'rgba(239, 68, 68, 0.08)' },
          { value: 0.786, label: '78.6%', color: 'rgba(249, 115, 22, 0.08)' },
          { value: 0.618, label: '61.8% (Golden)', color: 'rgba(234, 179, 8, 0.08)' },
          { value: 0.5, label: '50.0%', color: 'rgba(59, 130, 246, 0.08)' },
          { value: 0.382, label: '38.2%', color: 'rgba(16, 185, 129, 0.08)' },
          { value: 0.236, label: '23.6%', color: 'rgba(139, 92, 246, 0.08)' },
          { value: 0.0, label: '0.0% (Low)', color: 'rgba(107, 114, 128, 0.08)' }
        ];

        return (
          <g key={d.id} className="group/draw" style={{ pointerEvents: 'auto' }}>
            {/* Click hit block */}
            <rect 
              x={xMin} y={Math.min(c1.y, c2.y)} width={width} height={Math.abs(c1.y - c2.y)} 
              fill="transparent" className="cursor-pointer pointer-events-auto"
              onMouseDown={(e) => startDragBody(e, d.id)}
            />
            {ratios.map((r, i) => {
              const levelPrice = p2 + diff * r.value;
              const levelY = seriesRef.current?.priceToCoordinate(levelPrice);
              if (levelY === null || levelY === undefined) return null;

              let shading = null;
              if (i < ratios.length - 1) {
                const nextPrice = p2 + diff * ratios[i + 1].value;
                const nextY = seriesRef.current?.priceToCoordinate(nextPrice);
                if (nextY !== null && nextY !== undefined) {
                  shading = (
                    <rect 
                      x={xMin} 
                      y={Math.min(levelY, nextY)} 
                      width={width} 
                      height={Math.abs(levelY - nextY)} 
                      fill={r.color} 
                      className="pointer-events-none" 
                    />
                  );
                }
              }

              return (
                <g key={r.value}>
                  {shading}
                  <line 
                    x1={xMin} y1={levelY} x2={xMax} y2={levelY} 
                    stroke={isSelected ? "#22d3ee" : "#71717a"} strokeWidth={isSelected ? "1.5" : "1"} 
                    strokeDasharray="3,3" className="pointer-events-none" 
                  />
                  <text x={xMin + 5} y={levelY - 3} fill={isSelected ? "#22d3ee" : "#a1a1aa"} fontSize="8" fontFamily="monospace" className="pointer-events-none select-none">
                    {r.label} - {levelPrice.toFixed(2)}
                  </text>
                </g>
              );
            })}
            {isSelected ? (
              <>
                <circle cx={c1.x} cy={c1.y} r="7" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2.5" className="pointer-events-auto cursor-move" onMouseDown={(e) => startDragPoint(e, d.id, 0)} />
                <circle cx={c2.x} cy={c2.y} r="7" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2.5" className="pointer-events-auto cursor-move" onMouseDown={(e) => startDragPoint(e, d.id, 1)} />
                <circle cx={xMin + width/2} cy={Math.min(c1.y, c2.y) - 20} r="11" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" className="pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); onDeleteDrawing?.(d.id); setSelectedDrawingId(null); }} />
                <path d={`M ${xMin + width/2 - 3.5} ${Math.min(c1.y, c2.y) - 23.5} L ${xMin + width/2 + 3.5} ${Math.min(c1.y, c2.y) - 16.5} M ${xMin + width/2 + 3.5} ${Math.min(c1.y, c2.y) - 23.5} L ${xMin + width/2 - 3.5} ${Math.min(c1.y, c2.y) - 16.5}`} stroke="white" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none" />
              </>
            ) : null}
          </g>
        );
      }

      return null;
    });
  };

  const renderActivePreview = () => {
    if (activePoints.length === 0) return null;
    const c1 = getCoords(activePoints[0].time, activePoints[0].price);
    const c2 = activePoints[1] ? getCoords(activePoints[1].time, activePoints[1].price) : null;
    if (!c1) return null;

    if (activeDrawingTool === 'brush') {
      const pointsString = activePoints
        .map(p => {
          const cc = getCoords(p.time, p.price);
          return cc ? `${cc.x},${cc.y}` : null;
        })
        .filter(Boolean)
        .join(' ');
      return <polyline points={pointsString} stroke="#10b981" strokeWidth="2" strokeDasharray="3,3" fill="none" opacity="0.7" />;
    }

    if (!c2) return null;

    if (activeDrawingTool === 'trendline') {
      return (
        <g>
          <line x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke="#22d3ee" strokeWidth="2" strokeDasharray="4,4" />
          <circle cx={c1.x} cy={c1.y} r="3" fill="#22d3ee" />
          <circle cx={c2.x} cy={c2.y} r="3" fill="#22d3ee" />
        </g>
      );
    }

    if (activeDrawingTool === 'shape') {
      return (
        <rect 
          x={Math.min(c1.x, c2.x)} 
          y={Math.min(c1.y, c2.y)} 
          width={Math.abs(c1.x - c2.x)} 
          height={Math.abs(c1.y - c2.y)} 
          fill="rgba(99, 102, 241, 0.08)" 
          stroke="#6366f1" 
          strokeWidth="1.5" 
          strokeDasharray="4,4" 
        />
      );
    }

    if (activeDrawingTool === 'zoom') {
      const height = svgRef.current?.clientHeight || 500;
      return (
        <rect 
          x={Math.min(c1.x, c2.x)} 
          y={0} 
          width={Math.abs(c1.x - c2.x)} 
          height={height} 
          fill="rgba(34, 211, 238, 0.08)" 
          stroke="#22d3ee" 
          strokeWidth="1.5" 
          strokeDasharray="3,3" 
        />
      );
    }

    if (activeDrawingTool === 'fib') {
      const p1 = activePoints[0].price;
      const p2 = activePoints[1].price;
      const diff = p1 - p2;
      const ratios = [1.0, 0.786, 0.618, 0.5, 0.382, 0.236, 0.0];
      const xMin = Math.min(c1.x, c2.x);
      const xMax = Math.max(c1.x, c2.x);

      return (
        <g>
          {ratios.map(r => {
            const priceVal = p2 + diff * r;
            const levelY = seriesRef.current?.priceToCoordinate(priceVal);
            if (levelY === null || levelY === undefined) return null;

            return (
              <g key={r}>
                <line x1={xMin} y1={levelY} x2={xMax} y2={levelY} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
                <text x={xMin + 4} y={levelY - 2} fill="#94a3b8" fontSize="8" fontFamily="monospace">
                  {(r * 100).toFixed(1)}% ({priceVal.toFixed(1)})
                </text>
              </g>
            );
          })}
        </g>
      );
    }

    return null;
  };

  return (
    <div className="flex-1 relative w-full h-full select-none" style={{ touchAction: 'none' }}>
      <div
        ref={chartContainerRef}
        className="absolute inset-0 z-0"
      />
      {/* Absolute Transparent SVG Drawing Layer */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full z-20 pointer-events-none"
        style={{ pointerEvents: activeDrawingTool && activeDrawingTool !== 'cursor' ? 'all' : 'none' }}
        onMouseDown={handleSvgMouseDown}
        onMouseMove={handleSvgMouseMove}
        onMouseUp={handleSvgMouseUp}
      >
        {!drawingsHidden && renderDrawings()}
        {renderActivePreview()}
      </svg>

      {/* Dynamic Text Dialog Modal */}
      {textInputState && (
        <div 
          className="absolute z-50 bg-[#131722] border border-slate-700/80 p-3 rounded-lg shadow-2xl flex flex-col gap-2.5 w-60"
          style={{ 
            left: Math.min(textInputState.x, (svgRef.current?.clientWidth || 800) - 250), 
            top: Math.min(textInputState.y, (svgRef.current?.clientHeight || 500) - 150) 
          }}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-cyan-400">Add Text Annotation</span>
          <input 
            type="text"
            autoFocus
            value={textInputValue}
            onChange={(e) => setTextInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmAddText();
              if (e.key === 'Escape') setTextInputState(null);
            }}
            placeholder="Annotation label..."
            className="bg-[#0A0C14] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
          />
          <div className="flex justify-end gap-2 text-[10px] font-bold">
            <button className="text-slate-500 hover:text-white px-2 py-1" onClick={() => { setTextInputState(null); if (chartRef.current) chartRef.current.applyOptions({ handleScroll: true, handleScale: true }); }}>Cancel</button>
            <button className="bg-cyan-600 hover:bg-cyan-500 text-white rounded px-3 py-1" onClick={confirmAddText}>Add</button>
          </div>
        </div>
      )}
    </div>
  );
};
