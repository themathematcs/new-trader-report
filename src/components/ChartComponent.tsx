import React, { useEffect, useRef } from 'react';
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

export const ChartComponent = (props: {
  data: any[];
  liveUpdate?: boolean;
  orders?: ChartOrder[];
  closedTrades?: ClosedTrade[];
  onOrderDragEnd?: (id: string, newPrice: number) => void;
  onPriceUpdate?: (price: number) => void;
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
    colors: {
      backgroundColor = '#0A0C14',
      lineColor = '#2962FF',
      textColor = '#7C88A8',
      areaTopColor = '#2962FF',
      areaBottomColor = 'rgba(41, 98, 255, 0.28)',
    } = {},
  } = props;

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const priceLinesRef = useRef<Record<string, any>>({});
  const closedTradeSeriesRef = useRef<Record<string, any>>({});
  const ordersRef = useRef<ChartOrder[]>(orders);
  
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
             // LWC requires times to be distinct and strictly monotonically increasing
             // Ensure entryTime and exitTime are slightly different if they somehow match
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
    });

    resizeObserver.observe(chartContainerRef.current);

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
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
      chartRef.current?.remove();
    };
  }, [backgroundColor, textColor]);

  const prevDataRef = useRef(data);
  useEffect(() => {
    if (seriesRef.current && data) {
        if (prevDataRef.current && data.length === prevDataRef.current.length + 1 && prevDataRef.current.length > 0) {
            // Incremental update
            seriesRef.current.update(data[data.length - 1]);
        } else {
            // Full reset
            seriesRef.current.setData(data);
        }
        prevDataRef.current = data;
    }
  }, [data]);

  const onOrderDragEndRef = useRef(onOrderDragEnd);
  useEffect(() => {
    onOrderDragEndRef.current = onOrderDragEnd;
  }, [onOrderDragEnd]);

  useEffect(() => {
    let draggingOrderId: string | null = null;
    const container = chartContainerRef.current;
    if (!container) return;

    const onMouseDown = (e: MouseEvent) => {
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
  }, []);

  return (
    <div className="flex-1 relative w-full h-full">
      <div
        ref={chartContainerRef}
        className="absolute inset-0"
      />
    </div>
  );
};
