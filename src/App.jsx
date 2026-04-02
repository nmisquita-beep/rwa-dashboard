import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';

const API_URL = 'https://api.llama.fi/stablecoins';

function formatCurrency(value) {
  if (value == null || isNaN(value)) return '—';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPrice(value) {
  if (value == null || isNaN(value)) return '—';
  if (value >= 100) return `$${value.toFixed(2)}`;
  if (value >= 1) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(6)}`;
}

function formatPegType(pegType) {
  const map = {
    'peggedUSD': 'USD',
    'peggedEUR': 'EUR',
    'peggedGOLD': 'Gold',
    'peggedJPY': 'JPY',
    'peggedCNY': 'CNY',
    'peggedSGD': 'SGD',
    'peggedCAD': 'CAD',
    'peggedVAR': 'Variable',
  };
  return map[pegType] || pegType?.replace('pegged', '') || 'Unknown';
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-[#131621] border border-[#1c2039] rounded-xl overflow-hidden flex-1 min-w-[180px]">
      <div className="h-1" style={{ backgroundColor: color }} />
      <div className="p-4">
        <div className="text-[11px] text-[#545a70] uppercase tracking-wider mb-1">{label}</div>
        <div className="text-2xl font-semibold text-white">{value}</div>
      </div>
    </div>
  );
}

function SortHeader({ label, sortKey, sortConfig, onSort, align = 'left' }) {
  const active = sortConfig.key === sortKey;
  return (
    <th
      className={`px-4 py-3 text-[11px] font-medium uppercase tracking-wider cursor-pointer
        hover:bg-[#1a1e30] transition-colors whitespace-nowrap select-none
        ${align === 'right' ? 'text-right' : 'text-left'}
        ${active ? 'text-[#5b9cf5]' : 'text-[#545a70]'}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        {active ? (
          sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </div>
    </th>
  );
}

function ChainPills({ chains, max = 3 }) {
  if (!chains?.length) return <span className="text-[#545a70]">—</span>;
  const shown = chains.slice(0, max);
  const extra = chains.length - max;

  const chainColors = {
    'Ethereum': '#627EEA',
    'Tron': '#FF0013',
    'BSC': '#F3BA2F',
    'Solana': '#14F195',
    'Arbitrum': '#28A0F0',
    'Polygon': '#8247E5',
    'Avalanche': '#E84142',
    'Base': '#0052FF',
    'Optimism': '#FF0420',
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {shown.map(c => (
        <span
          key={c}
          className="text-[10px] px-1.5 py-0.5 rounded text-[#cdd0d8] whitespace-nowrap"
          style={{ backgroundColor: `${chainColors[c] || '#7f8c8d'}30` }}
        >
          {c}
        </span>
      ))}
      {extra > 0 && <span className="text-[10px] text-[#545a70]">+{extra}</span>}
    </div>
  );
}

export default function App() {
  const [stablecoins, setStablecoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'mcap', direction: 'desc' });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();

        const processed = (data.peggedAssets || []).map(s => {
          const mcap = s.circulating?.peggedUSD || s.circulating?.peggedEUR ||
                       Object.values(s.circulating || {})[0] || 0;

          const chains = Object.entries(s.chainCirculating || {})
            .filter(([_, data]) => {
              const val = data?.current?.peggedUSD || data?.current?.peggedEUR ||
                          Object.values(data?.current || {})[0] || 0;
              return val > 0;
            })
            .map(([chain, data]) => ({
              name: chain,
              value: data?.current?.peggedUSD || data?.current?.peggedEUR ||
                     Object.values(data?.current || {})[0] || 0
            }))
            .sort((a, b) => b.value - a.value);

          return {
            id: s.id,
            name: s.name,
            symbol: s.symbol,
            pegType: s.pegType,
            mcap,
            price: s.price || null,
            chains: chains.map(c => c.name),
          };
        }).filter(s => s.mcap > 0).sort((a, b) => b.mcap - a.mcap);

        setStablecoins(processed);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch:', err);
        setError('Failed to load data');
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...stablecoins];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.symbol?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'name':
          return sortConfig.direction === 'desc'
            ? b.name.localeCompare(a.name)
            : a.name.localeCompare(b.name);
        case 'symbol':
          return sortConfig.direction === 'desc'
            ? b.symbol.localeCompare(a.symbol)
            : a.symbol.localeCompare(b.symbol);
        case 'pegType':
          return sortConfig.direction === 'desc'
            ? (b.pegType || '').localeCompare(a.pegType || '')
            : (a.pegType || '').localeCompare(b.pegType || '');
        case 'mcap':
          aVal = a.mcap || 0;
          bVal = b.mcap || 0;
          break;
        case 'price':
          aVal = a.price ?? 0;
          bVal = b.price ?? 0;
          break;
        case 'chains':
          aVal = a.chains?.length || 0;
          bVal = b.chains?.length || 0;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }
      return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return result;
  }, [stablecoins, searchQuery, sortConfig]);

  const stats = useMemo(() => {
    const totalMcap = stablecoins.reduce((sum, s) => sum + s.mcap, 0);
    const usdt = stablecoins.find(s => s.symbol === 'USDT');
    const usdtDominance = usdt && totalMcap > 0 ? (usdt.mcap / totalMcap) * 100 : 0;
    const allChains = new Set();
    stablecoins.forEach(s => s.chains?.forEach(c => allChains.add(c)));

    return {
      totalMcap,
      count: stablecoins.length,
      chainCount: allChains.size,
      usdtDominance,
    };
  }, [stablecoins]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1019' }}>
        <div className="text-[#545a70]">Loading stablecoins...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1019' }}>
        <div className="text-[#f46565]">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#cdd0d8]" style={{ background: '#0d1019', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <header className="border-b border-[#1c2039] px-6 py-4">
        <h1 className="text-xl font-semibold text-white">Stablecoin Dashboard</h1>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Stat Cards */}
        <div className="flex flex-wrap gap-4 mb-6">
          <StatCard label="Total Mcap" value={formatCurrency(stats.totalMcap)} color="#5b9cf5" />
          <StatCard label="# Stablecoins" value={stats.count.toLocaleString()} color="#3fb68b" />
          <StatCard label="# Chains" value={stats.chainCount.toLocaleString()} color="#9b59b6" />
          <StatCard label="USDT Dominance" value={`${stats.usdtDominance.toFixed(1)}%`} color="#f5a623" />
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#545a70]" />
            <input
              type="text"
              placeholder="Search stablecoins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#131621] border border-[#1c2039] rounded-lg text-sm text-[#cdd0d8] focus:outline-none focus:border-[#5b9cf5] placeholder:text-[#3a3f55]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#1c2039]">
          <table className="w-full text-sm">
            <thead className="bg-[#131621]">
              <tr>
                <th className="px-4 py-3 text-[11px] font-medium text-[#545a70] text-right w-16">#</th>
                <SortHeader label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                <SortHeader label="Symbol" sortKey="symbol" sortConfig={sortConfig} onSort={handleSort} />
                <SortHeader label="Peg Type" sortKey="pegType" sortConfig={sortConfig} onSort={handleSort} />
                <SortHeader label="Mcap" sortKey="mcap" sortConfig={sortConfig} onSort={handleSort} align="right" />
                <SortHeader label="Price" sortKey="price" sortConfig={sortConfig} onSort={handleSort} align="right" />
                <SortHeader label="Top Chains" sortKey="chains" sortConfig={sortConfig} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((s, idx) => (
                <tr key={s.id} className="border-t border-[#1c2039] hover:bg-[#131621] transition-colors">
                  <td className="px-4 py-3 text-right text-[#545a70] font-mono">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                  <td className="px-4 py-3 text-[#8a8fa8] uppercase">{s.symbol}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] px-2 py-1 rounded bg-[#1e2235] text-[#8a8fa8]">
                      {formatPegType(s.pegType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white">{formatCurrency(s.mcap)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#cdd0d8]">{formatPrice(s.price)}</td>
                  <td className="px-4 py-3"><ChainPills chains={s.chains} /></td>
                </tr>
              ))}
              {filteredAndSorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#545a70]">
                    No stablecoins found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-[11px] text-[#3a3f55]">
          Data from <a href="https://defillama.com/stablecoins" target="_blank" rel="noopener noreferrer" className="text-[#5b9cf5] hover:underline">DeFiLlama</a>
        </div>
      </main>
    </div>
  );
}
