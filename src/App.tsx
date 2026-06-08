import React, { useState, useMemo, useEffect } from "react";
import { 
  ChevronDown, ChevronUp, Search, Plus, Sparkles, LayoutGrid, 
  Settings, Maximize, Play, SkipBack, SkipForward, ArrowDownRight, ArrowUpRight,
  MousePointer2, PenLine, Divide, Type, SquareMenu, ZoomIn, Magnet, Lock, EyeOff, Trash2, Expand, X, BookOpen, Calendar, Settings2
} from "lucide-react";
import { ChartComponent, ChartOrder, ClosedTrade } from "./components/ChartComponent";
import { generateCandleData } from "./utils/mockData";

export default function App() {
  const [activeTab, setActiveTab] = useState("open");
  const [splitScreen, setSplitScreen] = useState(true);
  const [tableCollapsed, setTableCollapsed] = useState(false);
  
  const [balance, setBalance] = useState(100000);
  const [leverage, setLeverage] = useState(10);
  const [realizedPnl, setRealizedPnl] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showGoTo, setShowGoTo] = useState(false);
  const [goToDate, setGoToDate] = useState("2019-01-01");

  const [activeChart, setActiveChart] = useState<1 | 2>(1);
  const [symbol1, setSymbol1] = useState("ES");
  const [symbol2, setSymbol2] = useState("NQ");
  const [showSymbolSelector, setShowSymbolSelector] = useState(false);

  const [tf1, setTf1] = useState("5m");
  const [tf2, setTf2] = useState("1m");

  const [orders, setOrders] = useState<ChartOrder[]>([]);
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>([]);

  const [replayIndex, setReplayIndex] = useState(500);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(10);

  const availableSymbols = ["ES", "NQ", "AAPL", "TSLA", "BTC", "ETH", "SPY", "QQQ"];
  const timeframes = ["1s", "5s", "30s", "1m", "5m", "1h", "1d", "1W", "1M"];

  const handleSymbolSelect = (sym: string) => {
    if (activeChart === 1) { setSymbol1(sym); }
    if (activeChart === 2) { setSymbol2(sym); }
    setShowSymbolSelector(false);
  };

  const handleTimeframeSelect = (tf: string) => {
    if (activeChart === 1) { setTf1(tf); }
    if (activeChart === 2) { setTf2(tf); }
  };

  useEffect(() => {
    let interval: any;
    if (isReplaying) {
      interval = setInterval(() => {
        setReplayIndex(prev => {
          if (prev >= 10000) {
             setIsReplaying(false);
             return 10000;
          }
          return prev + 1;
        });
      }, 1000 / replaySpeed);
    }
    return () => clearInterval(interval);
  }, [isReplaying, replaySpeed]);

  const currentSymbol = activeChart === 1 ? symbol1 : symbol2;
  const currentTf = activeChart === 1 ? tf1 : tf2;

  const masterEsData = useMemo(() => generateCandleData(10000, '2019-01-01', symbol1 === "NQ" ? 19800 : symbol1 === "ES" ? 5600 : 100, tf1), [symbol1, tf1]);
  const masterNqData = useMemo(() => generateCandleData(10000, '2019-01-01', symbol2 === "NQ" ? 19800 : symbol2 === "ES" ? 5600 : 100, tf2), [symbol2, tf2]);

  const esData = useMemo(() => {
    return masterEsData.slice(0, replayIndex);
  }, [masterEsData, replayIndex]);
  
  const currentReplayTime = esData[esData.length - 1]?.time || 0;

  const nqData = useMemo(() => {
    let idx = masterNqData.findIndex(d => d.time > currentReplayTime);
    if (idx === -1) return masterNqData;
    return masterNqData.slice(0, Math.max(1, idx));
  }, [masterNqData, currentReplayTime]);

  const currentPrice1 = esData[esData.length - 1]?.close || 0;
  const currentPrice2 = nqData[nqData.length - 1]?.close || 0;

  useEffect(() => {
    // Check SL/TP hits
    orders.forEach(order => {
        const p = order.symbol === symbol1 ? currentPrice1 : order.symbol === symbol2 ? currentPrice2 : 0;
        if (p === 0) return;

        if (order.type === 'sl' || order.type === 'tp') {
            const posId = order.id.replace(order.type + '_', 'pos_');
            const pos = orders.find(o => o.id === posId);
            if (!pos) return;
            
            let isHit = false;
            // logic for checking if hit
            if (pos.isLong) {
                if (order.type === 'sl' && p <= order.price) isHit = true;
                if (order.type === 'tp' && p >= order.price) isHit = true;
            } else {
                if (order.type === 'sl' && p >= order.price) isHit = true;
                if (order.type === 'tp' && p <= order.price) isHit = true;
            }

            if (isHit) {
                handleClosePosition(posId, p);
            }
        }
    });
  }, [currentPrice1, currentPrice2, orders, symbol1, symbol2]);

  const currentTotalPnl = (order: ChartOrder, cp?: number) => {
    if (order.type !== 'position') return 0;
    const currentPrice = cp ?? (order.symbol === symbol1 ? currentPrice1 : order.symbol === symbol2 ? currentPrice2 : 0);
    if (currentPrice > 0 && order.price > 0 && order.qty) {
      const diff = order.isLong ? (currentPrice - order.price) : (order.price - currentPrice);
      return (diff * order.qty * leverage);
    }
    return 0;
  };

  const handleClosePosition = (orderId: string, currentPrice?: number) => {
    setOrders(currentOrders => {
      const position = currentOrders.find(o => o.id === orderId);
      if (position) {
        const exitP = currentPrice ?? (position.symbol === symbol1 ? currentPrice1 : position.symbol === symbol2 ? currentPrice2 : 0);
        setRealizedPnl(prev => prev + currentTotalPnl(position, currentPrice));
        
        // Save closed trade
        setClosedTrades(prev => [...prev, {
           id: position.id,
           symbol: position.symbol!,
           isLong: position.isLong!,
           entryTime: position.entryTime ?? 0,
           entryPrice: position.price,
           exitTime: position.symbol === symbol1 ? (esData[esData.length - 1]?.time || 0) : (nqData[nqData.length - 1]?.time || 0),
           exitPrice: exitP
        }]);

        return currentOrders.filter(o => o.id !== orderId && o.id !== orderId.replace('pos_', 'sl_') && o.id !== orderId.replace('pos_', 'tp_'));
      }
      return currentOrders;
    });
  };

  const unrealizedPnl = orders.reduce((acc, o) => {
    if (o.type === 'position') {
      const currentPrice = o.symbol === symbol1 ? currentPrice1 : o.symbol === symbol2 ? currentPrice2 : 0;
      if (currentPrice > 0 && o.price > 0 && o.qty) {
        const diff = o.isLong ? (currentPrice - o.price) : (o.price - currentPrice);
        return acc + (diff * o.qty * leverage);
      }
    }
    return acc;
  }, 0);

  const handleBuySell = (type: 'buy' | 'sell') => {
    const isChart1 = activeChart === 1;
    const currentPrice = isChart1 ? currentPrice1 : currentPrice2;
    const currentTime = isChart1 ? esData[esData.length - 1]?.time : nqData[nqData.length - 1]?.time;
    
    if (!currentPrice || !currentTime) return;

    const qty = 1;
    const positionId = `pos_${Date.now()}`;
    const slId = `sl_${Date.now()}`;
    const tpId = `tp_${Date.now()}`;

    const spread = currentPrice * 0.005; // 0.5% default SL/TP distance
    const slPrice = type === 'buy' ? currentPrice - spread : currentPrice + spread;
    const tpPrice = type === 'buy' ? currentPrice + spread * 2 : currentPrice - spread * 2;

    const newOrders: ChartOrder[] = [
      ...orders,
      { id: positionId, price: currentPrice, type: 'position', title: `${qty} ${type === 'buy' ? 'Long' : 'Short'}`, symbol: currentSymbol, qty: qty, isLong: type === 'buy', entryTime: currentTime },
      { id: slId, price: slPrice, type: 'sl', title: `SL`, symbol: currentSymbol },
      { id: tpId, price: tpPrice, type: 'tp', title: `TP`, symbol: currentSymbol },
    ];
    setOrders(newOrders);
  };

  const handleOrderDragEnd = (id: string, newPrice: number) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, price: newPrice } : o));
  };

  return (
    <div className="h-screen w-screen bg-[#11172B] text-slate-200 font-sans flex flex-col overflow-hidden select-none">
      
      {/* Top Header */}
      <div className="h-14 border-b border-slate-800/80 bg-[#131722] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold tracking-widest text-[#7C88A8]">TRADEZELLA</h1>
          
          <div className="relative">
            <div 
              className="flex items-center gap-1 bg-[#1A1F30] rounded p-1 h-8 px-2 border border-slate-800/40 cursor-pointer hover:bg-slate-800"
              onClick={() => setShowSymbolSelector(!showSymbolSelector)}
            >
              <Search className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-xs font-semibold uppercase text-slate-200 mx-1">{currentSymbol}</span>
              <Plus className="w-3.5 h-3.5 text-slate-500 ml-1 hover:text-white" />
            </div>

            {showSymbolSelector && (
              <div className="absolute top-10 left-0 w-48 bg-[#131722] border border-slate-700/80 rounded shadow-xl z-50 overflow-hidden">
                <div className="p-2 border-b border-slate-800">
                  <input 
                    type="text" 
                    placeholder="Search symbols..." 
                    className="w-full bg-[#0A0C14] text-xs text-white rounded px-2 py-1 outline-none border border-slate-800 focus:border-cyan-500"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {availableSymbols.map(sym => (
                    <div 
                      key={sym} 
                      className="px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer flex justify-between"
                      onClick={() => handleSymbolSelect(sym)}
                    >
                      <span className="font-bold">{sym}</span>
                      <span className="text-slate-500 font-mono">Chart {activeChart}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center text-xs font-semibold text-slate-400 gap-1 ml-2">
            {timeframes.map((tf) => (
              <button 
                key={tf}
                className={`px-2 py-1 rounded hover:bg-slate-800 ${currentTf === tf ? 'text-yellow-400' : 'hover:text-slate-200 opacity-50'}`}
                onClick={() => handleTimeframeSelect(tf)}
              >
                {tf}
              </button>
            ))}
            <div className="w-[1px] h-4 bg-slate-700 mx-1"></div>
            <button 
              className={`px-2 py-1 rounded hover:bg-slate-800 flex items-center gap-1 ${splitScreen ? 'bg-slate-800' : ''}`}
              onClick={() => setSplitScreen(!splitScreen)}
            >
              <Sparkles className="w-3 h-3" /> Indicators <LayoutGrid className="w-3 h-3 ml-1" />
            </button>
            <button 
              className="px-2 py-1 rounded hover:bg-slate-800 ml-1"
              onClick={() => setShowGoTo(true)}
            >
              Go to <ChevronDown className="w-3 h-3 inline" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-1 rounded-full bg-[#1A1F30] border border-slate-700 text-[10px] text-slate-400 font-mono hidden lg:block">
            Thu, Oct 03, 2024 23:59:59 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; |
          </div>
          <div className="flex items-center text-slate-400 gap-2">
            <button className="p-1 hover:text-white"><Expand className="w-4 h-4" /></button>
            <button className="p-1 hover:text-white text-xs border border-slate-800 rounded px-2">Autosaved <ChevronDown className="w-3 h-3 inline" /></button>
            <button className="p-1 hover:text-white"><Settings className="w-4 h-4" /></button>
            <button className="p-1 hover:text-white"><Maximize className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-12 bg-[#131722] border-r border-slate-800/80 flex flex-col items-center py-3 gap-3 overflow-y-auto shrink-0">
          <button className="p-2 text-cyan-500 rounded"><MousePointer2 className="w-4 h-4" /></button>
          <button className="p-2 text-slate-500 hover:text-slate-200"><PenLine className="w-4 h-4" /></button>
          <button className="p-2 text-slate-500 hover:text-slate-200"><ArrowDownRight className="w-4 h-4" /></button>
          <button className="p-2 text-slate-500 hover:text-slate-200"><Divide className="w-4 h-4" /></button>
          <button className="p-2 text-slate-500 hover:text-slate-200"><ArrowUpRight className="w-4 h-4" /></button>
          <button className="p-2 text-slate-500 hover:text-slate-200"><Type className="w-4 h-4" /></button>
          <button className="p-2 text-slate-500 hover:text-slate-200"><SquareMenu className="w-4 h-4" /></button>
          <button className="p-2 text-slate-500 hover:text-slate-200"><ZoomIn className="w-4 h-4" /></button>
          
          <div className="h-[1px] w-6 bg-slate-800 my-1"></div>
          
          <button className="p-2 text-slate-500 hover:text-slate-200"><Magnet className="w-4 h-4" /></button>
          <button className="p-2 text-slate-500 hover:text-slate-200"><Lock className="w-4 h-4" /></button>
          <button className="p-2 text-slate-500 hover:text-slate-200"><EyeOff className="w-4 h-4" /></button>
          <button className="p-2 text-slate-500 hover:text-slate-200"><Trash2 className="w-4 h-4" /></button>
        </div>

        {/* Charts Container - Split View mockup */}
        <div className="flex-1 bg-[#0A0C14] flex flex-col relative overflow-hidden" id="charts-wrapper border-b border-transparent">
          
          <div className="flex-1 flex overflow-hidden">
            {/* Left Chart */}
            <div 
              className={`flex-1 ${splitScreen ? 'border-r border-[#1C2030]' : ''} relative overflow-hidden flex flex-col z-0 cursor-crosshair`}
              onClick={() => setActiveChart(1)}
            >
              <div className={`absolute top-2 left-2 text-xs font-mono pointer-events-none z-10 bg-[#0a0c10]/50 px-1 rounded border ${activeChart === 1 ? 'border-cyan-500/50 text-slate-200' : 'border-transparent text-slate-400'}`}>
                {symbol1} . {tf1} • <span className="text-emerald-400">O</span>5752.50 <span className="text-emerald-400">H</span>5752.75 <span className="text-rose-400">L</span>5752.75 <span className="text-slate-300">C</span>5752.75 0.00 (0.00%)
              </div>
              <ChartComponent data={esData} orders={orders} closedTrades={closedTrades.filter(t => t.symbol === symbol1)} onOrderDragEnd={handleOrderDragEnd} />
            </div>
            {/* Right Chart */}
            {splitScreen && (
              <div 
                className="flex-1 relative overflow-hidden flex flex-col z-0 cursor-crosshair"
                onClick={() => setActiveChart(2)}
              >
                <div className={`absolute top-2 left-2 text-xs font-mono pointer-events-none z-10 bg-[#0a0c10]/50 px-1 rounded border ${activeChart === 2 ? 'border-cyan-500/50 text-slate-200' : 'border-transparent text-slate-400'}`}>
                  {symbol2} . {tf2} • <span className="text-emerald-400">O</span>20012.00 <span className="text-emerald-400">H</span>20014.50 <span className="text-rose-400">L</span>20011.75 <span className="text-slate-300">C</span>20013.50 +1.75 (+0.01%)
                </div>
                <ChartComponent data={nqData} orders={orders} closedTrades={closedTrades.filter(t => t.symbol === symbol2)} onOrderDragEnd={handleOrderDragEnd} />
              </div>
            )}
          </div>

          {/* Bottom Time playback bar (inside charts layer) */}
          <div className="h-12 bg-[#131722]/90 border-t border-slate-800/80 flex justify-between items-center px-4 shrink-0 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 font-bold ml-12">{replaySpeed}x</span>
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={replaySpeed}
                onChange={(e) => setReplaySpeed(Number(e.target.value))}
                className="w-20 accent-cyan-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                className="text-slate-400 hover:text-white p-1"
                onClick={() => setReplayIndex(prev => Math.max(1, prev - 100))}
              >
                <SkipBack className="w-4 h-4"/>
              </button>
              <button 
                className="text-slate-400 hover:text-white p-1"
                onClick={() => setIsReplaying(!isReplaying)}
              >
                {isReplaying ? <span className="text-rose-400 font-bold px-1">||</span> : <Play className="w-5 h-5"/>}
              </button>
              <button 
                className="text-slate-400 hover:text-white p-1"
                onClick={() => setReplayIndex(prev => Math.min(10000, prev + 100))}
              >
                <SkipForward className="w-4 h-4"/>
              </button>
              <div className="bg-[#1A1F30] border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 ml-2 cursor-pointer flex items-center gap-1">
                Replay <ChevronDown className="w-3 h-3" />
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs mr-16">
              <div className="bg-[#1A1F30] border border-slate-700/80 rounded px-3 py-1.5 text-slate-400 hidden lg:flex items-center gap-2 w-32">
                <span>Quant.</span>
              </div>
              <button className="bg-[#18A265] text-white px-4 py-1.5 rounded font-bold hover:bg-[#18A265]/80" onClick={() => handleBuySell('buy')}>Buy</button>
              <button className="bg-[#D8363F] text-white px-4 py-1.5 rounded font-bold hover:bg-[#D8363F]/80" onClick={() => handleBuySell('sell')}>Sell</button>
            </div>
          </div>
        </div>

        {/* Right Nav Rail fixed */}
        <div className="w-12 bg-[#131722] border-l border-slate-800/80 flex flex-col items-center py-2 gap-4 shrink-0 shadow-[-10px_0_20px_rgba(0,0,0,0.5)] z-20 h-full">
          <button className="flex flex-col items-center text-[#7C88A8] hover:text-white p-1">
            <span className="border border-indigo-400/50 p-1.5 rounded-md text-indigo-400 bg-indigo-500/10"><MousePointer2 className="w-4 h-4"/></span>
            <span className="text-[8px] mt-1 pr-0.5">Order</span>
          </button>
          <button className="flex flex-col items-center text-[#7C88A8] hover:text-white p-1">
             <span className="p-1"><Type className="w-4 h-4"/></span>
             <span className="text-[8px] mt-1 pr-0.5">Details</span>
          </button>
           <button className="flex flex-col items-center text-[#7C88A8] hover:text-white p-1">
             <span className="p-1"><BookOpen className="w-4 h-4"/></span>
             <span className="text-[8px] mt-1 pr-0.5">Journal</span>
          </button>
           <button className="flex flex-col items-center text-[#7C88A8] hover:text-white p-1">
             <span className="p-1"><Calendar className="w-4 h-4"/></span>
             <span className="text-[8px] mt-1 pr-0.5">Calendar</span>
          </button>
           <button className="flex flex-col items-center text-[#7C88A8] hover:text-white p-1 mt-auto pb-4">
             <span className="p-1"><Settings2 className="w-4 h-4"/></span>
             <span className="text-[8px] mt-1 pr-0.5">Settings</span>
          </button>
        </div>
      </div>

      {/* Bottom Table Section */}
      <div className={`${tableCollapsed ? 'h-10' : 'h-36'} bg-[#131722] border-t border-slate-800 shrink-0 flex flex-col z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] transition-all duration-300`}>
        <div className="h-10 border-b border-slate-800/80 flex items-center px-4 text-xs font-semibold gap-6 text-slate-400">
           <div className="flex gap-4 h-full pt-3">
             <button className={`${activeTab === 'orders' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-2' : 'hover:text-slate-200'}`} onClick={()=>setActiveTab('orders')}>Orders</button>
             <button className={`${activeTab === 'open' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-2' : 'hover:text-slate-200'}`} onClick={()=>setActiveTab('open')}>Open Positions</button>
             <button className={`${activeTab === 'closed' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-2' : 'hover:text-slate-200'}`} onClick={()=>setActiveTab('closed')}>Closed Positions</button>
           </div>
           
           <div className="ml-auto flex items-center gap-4 text-[11px] font-mono font-medium mr-12">
             <span className="text-slate-500">Current balance: <span className="text-slate-300 font-mono">${(balance + realizedPnl).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></span>
             <span className="text-slate-500">Realized P&L: <span className={`font-mono ${realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${realizedPnl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></span>
             <span className="text-slate-500">Unrealized P&L: <span className={`font-mono ${unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${unrealizedPnl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></span>
             <button className="p-1 hover:bg-slate-800 hover:text-white rounded ml-2 transition-colors" onClick={() => setShowSettings(true)}>
               <Settings2 className="w-4 h-4" />
             </button>
             <button className="p-1 hover:bg-slate-800 hover:text-white rounded ml-1 transition-colors" onClick={() => setTableCollapsed(!tableCollapsed)}>
               {tableCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
             </button>
           </div>
        </div>

        {!tableCollapsed && (
          <div className="flex-1 overflow-auto pr-12">
          <table className="w-full text-left text-[11px]">
            <thead className="text-slate-500 font-mono border-b border-slate-800/40">
              <tr>
                <th className="px-4 py-2 font-medium w-10">#</th>
                <th className="px-4 py-2 font-medium">Symbol</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Open time</th>
                <th className="px-4 py-2 font-medium">Close time</th>
                <th className="px-4 py-2 font-medium text-right">Price</th>
                <th className="px-4 py-2 font-medium text-right">Quantity</th>
                <th className="px-4 py-2 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500 text-xs gap-2 flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4" /> No data available
                  </td>
                </tr>
              ) : (
                orders.filter(o => o.type === 'position').map((order, idx) => (
                  <tr key={order.id} className="border-b border-slate-800/20 hover:bg-slate-800/50">
                    <td className="px-4 py-2 font-mono text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-2 font-bold">{order.title.includes('Long') ? symbol1 : symbol2}</td>
                    <td className="px-4 py-2">
                       <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${order.title.includes('Long') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {order.title.includes('Long') ? 'Buy' : 'Sell'}
                       </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`font-mono text-[11px] font-bold ${currentTotalPnl(order) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                         ${currentTotalPnl(order).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-slate-500">-</td>
                    <td className="px-4 py-2 font-mono text-slate-500">-</td>
                    <td className="px-4 py-2 text-right font-mono">{order.price.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-mono">1</td>
                    <td className="px-4 py-2 text-right text-slate-500 cursor-pointer hover:text-white">
                      <X className="w-4 h-4 ml-auto" onClick={() => handleClosePosition(order.id)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>
      
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#131722] border border-slate-800 rounded-lg shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4">
              <span className="font-bold text-sm text-slate-200">Account Settings</span>
              <X className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white" onClick={() => setShowSettings(false)} />
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Balance ($)</label>
                <input 
                  type="number" 
                  value={balance} 
                  onChange={(e) => setBalance(Number(e.target.value))}
                  className="bg-[#0A0C14] border border-slate-700/80 rounded px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Leverage (x)</label>
                <input 
                  type="number" 
                  value={leverage} 
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="bg-[#0A0C14] border border-slate-700/80 rounded px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                />
              </div>
              <button 
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded mt-2 transition-colors"
                onClick={() => setShowSettings(false)}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
      {showGoTo && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#131722] border border-slate-800 rounded-lg shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4">
              <span className="font-bold text-sm text-slate-200">Go To Date</span>
              <X className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white" onClick={() => setShowGoTo(false)} />
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Target Date</label>
                <input 
                  type="date" 
                  value={goToDate} 
                  onChange={(e) => setGoToDate(e.target.value)}
                  className="bg-[#0A0C14] border border-slate-700/80 rounded px-3 py-2 text-sm text-white outline-none focus:border-cyan-500 [color-scheme:dark]"
                />
              </div>
              <button 
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded mt-2 transition-colors"
                onClick={() => {
                   const t = new Date(goToDate).getTime() / 1000;
                   const idx = masterEsData.findIndex(d => d.time >= t);
                   if (idx !== -1) {
                       setReplayIndex(Math.max(10, idx));
                   }
                   setShowGoTo(false);
                }}
              >
                Jump
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
