import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, ExternalLink, ChevronDown, ChevronUp, RefreshCw,
  Download, ArrowUpDown, AlertCircle, Loader2, Check, X
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend
} from 'recharts';

// ─── Constants ───────────────────────────────────────────────────────────────

const PROTOCOLS_URL = 'https://api.llama.fi/protocols';
const RWA_STATS_URL = 'https://api.llama.fi/rwa/stats';
const ICON_BASE = 'https://icons.llama.fi';

const ASSET_GROUP_COLORS = {
  'Treasury Bills': '#5b9cf5',
  'Commodities': '#f5a623',
  'Private Credit': '#9b59b6',
  'Real Estate': '#3fb68b',
  'Stocks & ETFs': '#e74c3c',
  'Money Market Funds': '#1abc9c',
  'Other Fixed Income': '#8e44ad',
  'Carbon Credits': '#27ae60',
  'Crowdfunding': '#f39c12',
  'Private Equity': '#c0392b',
  'Collectibles': '#d35400',
  'Tokenized Trading Strategies': '#2980b9',
  'Onchain Equity': '#16a085',
  'Other': '#7f8c8d',
};

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatCurrency(value, compact = true) {
  if (value == null || isNaN(value)) return '—';
  if (compact) {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}t`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}b`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}m`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}k`;
    return `$${value.toFixed(0)}`;
  }
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatPercent(value) {
  if (value == null || isNaN(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatPrice(value) {
  if (value == null || isNaN(value)) return '—';
  if (value >= 1000) return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(6)}`;
}

// ─── Data fetching ───────────────────────────────────────────────────────────

async function fetchRWAData() {
  const [protocolsRes, statsRes] = await Promise.all([
    fetch(PROTOCOLS_URL).then(r => r.json()),
    fetch(RWA_STATS_URL).then(r => r.json()).catch(() => ({})),
  ]);

  // Build stats lookup by protocol ID
  const statsMap = statsRes || {};

  // Filter for RWA category and merge with stats
  const rwaProtocols = protocolsRes
    .filter(p => p.category === 'RWA')
    .map(p => {
      const stats = statsMap[p.id] || {};
      const assetGroup = p.tags?.[0] || 'Other';

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        symbol: p.symbol,
        logo: p.logo || `${ICON_BASE}/${p.slug}.jpg`,
        tvl: p.tvl ?? 0,
        mcap: p.mcap ?? null,
        change1h: p.change_1h ?? null,
        change1d: p.change_1d ?? null,
        change7d: p.change_7d ?? null,
        chains: p.chains || [],
        assetGroup,
        allTags: p.tags || [],
        description: p.description || '',
        url: p.url || '',
        twitter: p.twitter || '',
        geckoId: p.gecko_id || null,
        issuer: p.parentProtocolSlug?.replace('parent#', '').replace(/-/g, ' ') || null,
        // RWA-specific metadata from /rwa/stats
        tickers: stats.symbols || [],
        redeemable: stats.redeemable ?? null,
        attestations: stats.attestations ?? null,
        cexListed: stats.cexListed ?? null,
        kyc: stats.kyc ?? null,
        transferable: stats.transferable ?? null,
        selfCustody: stats.selfCustody ?? null,
        volumeUsd1d: stats.volumeUsd1d ?? null,
        volumeUsd7d: stats.volumeUsd7d ?? null,
      };
    })
    .sort((a, b) => (b.tvl || 0) - (a.tvl || 0));

  return rwaProtocols;
}

async function fetchHistoricalData(slugs) {
  // Fetch historical TVL for top protocols to build chart data
  const results = await Promise.all(
    slugs.slice(0, 20).map(async (slug) => {
      try {
        const res = await fetch(`https://api.llama.fi/protocol/${slug}`);
        const data = await res.json();
        return {
          slug,
          tags: data.tags || [],
          tvl: data.tvl || [],
        };
      } catch {
        return { slug, tags: [], tvl: [] };
      }
    })
  );
  return results;
}

// ─── Components ──────────────────────────────────────────────────────────────

function ProtocolLogo({ src, name }) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className="w-7 h-7 rounded-full bg-[#2a2f42] flex items-center justify-center text-[11px] font-bold text-[#8a8fa8] flex-shrink-0">
        {name?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="w-7 h-7 rounded-full flex-shrink-0 bg-[#2a2f42]"
      onError={() => setErrored(true)}
    />
  );
}

function ChainPills({ chains }) {
  if (!chains?.length) return <span className="text-[#545a70]">—</span>;
  const shown = chains.slice(0, 3);
  const extra = chains.length - shown.length;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {shown.map(c => (
        <span
          key={c}
          className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e2235] text-[#8a8fa8] whitespace-nowrap"
          title={c}
        >
          {c}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-[10px] text-[#545a70]">+{extra}</span>
      )}
    </div>
  );
}

function BooleanCell({ value }) {
  if (value === null || value === undefined) {
    return <span className="text-[#3a3f55]">—</span>;
  }
  return value ? (
    <Check className="w-4 h-4 text-[#3fb68b]" />
  ) : (
    <X className="w-4 h-4 text-[#f46565]" />
  );
}

function SortHeader({ label, sortKey, sortConfig, onSort, align = 'left', className = '' }) {
  const active = sortConfig.key === sortKey;
  return (
    <th
      className={`px-3 py-3 text-[11px] font-medium uppercase tracking-wider cursor-pointer
        hover:bg-[#1a1e30] transition-colors whitespace-nowrap select-none
        ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}
        ${active ? 'text-[#5b9cf5]' : 'text-[#545a70]'} ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
        {label}
        {active ? (
          sortConfig.direction === 'desc'
            ? <ChevronDown className="w-3 h-3" />
            : <ChevronUp className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </div>
    </th>
  );
}

function StatCard({ label, value, subValue, color }) {
  return (
    <div className="bg-[#131621] border border-[#1c2039] rounded-xl p-4 min-w-[180px]">
      <div className="text-[11px] text-[#545a70] uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${color || 'text-white'}`}>{value}</div>
      {subValue && <div className="text-[11px] text-[#545a70] mt-1">{subValue}</div>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#1c2039] border border-[#2a3050] rounded-lg p-3 shadow-xl">
      <div className="text-xs text-[#8a8fa8] mb-2">{label}</div>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[#cdd0d8]">{entry.name}:</span>
          <span className="font-mono text-white">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [protocols, setProtocols] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [assetGroupFilter, setAssetGroupFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'tvl', direction: 'desc' });

  // ── Fetch data ──
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRWAData();
      setProtocols(data);
      setLastUpdated(new Date());

      // Fetch historical data for chart (top 20 protocols)
      setChartLoading(true);
      const topSlugs = data.slice(0, 20).map(p => p.slug);
      const historical = await fetchHistoricalData(topSlugs);

      // Aggregate by date and asset group
      const dateMap = new Map();
      historical.forEach(({ tags, tvl }) => {
        const assetGroup = tags?.[0] || 'Other';
        tvl.forEach(({ date, totalLiquidityUSD }) => {
          const dateStr = new Date(date * 1000).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          if (!dateMap.has(dateStr)) {
            dateMap.set(dateStr, { date: dateStr, timestamp: date });
          }
          const entry = dateMap.get(dateStr);
          entry[assetGroup] = (entry[assetGroup] || 0) + totalLiquidityUSD;
        });
      });

      // Sort by timestamp and take last 12 months
      const chartEntries = Array.from(dateMap.values())
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-52); // Last 52 data points

      setChartData(chartEntries);
      setChartLoading(false);
    } catch (err) {
      console.error('Failed to fetch RWA data:', err);
      setError('Failed to load data from DeFiLlama. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000); // Auto-refresh every 5 minutes
    return () => clearInterval(interval);
  }, [loadData]);

  // ── Sort ──
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  // ── Asset Groups ──
  const assetGroups = useMemo(() => {
    const groups = new Set();
    protocols.forEach(p => {
      if (p.assetGroup) groups.add(p.assetGroup);
    });
    return ['All', ...Array.from(groups).sort()];
  }, [protocols]);

  // ── Filter & sort ──
  const filteredProtocols = useMemo(() => {
    let result = [...protocols];

    if (assetGroupFilter !== 'All') {
      result = result.filter(p => p.assetGroup === assetGroupFilter || p.allTags?.includes(assetGroupFilter));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.symbol && p.symbol.toLowerCase().includes(q)) ||
        (p.tickers && p.tickers.some(t => t.toLowerCase().includes(q)))
      );
    }

    result.sort((a, b) => {
      let aVal, bVal;

      switch (sortConfig.key) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          return sortConfig.direction === 'desc'
            ? bVal.localeCompare(aVal)
            : aVal.localeCompare(bVal);
        case 'tvl': aVal = a.tvl || 0; bVal = b.tvl || 0; break;
        case 'mcap': aVal = a.mcap ?? 0; bVal = b.mcap ?? 0; break;
        case 'change1d': aVal = a.change1d ?? -Infinity; bVal = b.change1d ?? -Infinity; break;
        case 'change7d': aVal = a.change7d ?? -Infinity; bVal = b.change7d ?? -Infinity; break;
        case 'chains': aVal = a.chains.length; bVal = b.chains.length; break;
        case 'assetGroup':
          aVal = a.assetGroup || '';
          bVal = b.assetGroup || '';
          return sortConfig.direction === 'desc'
            ? bVal.localeCompare(aVal)
            : aVal.localeCompare(bVal);
        default: aVal = 0; bVal = 0;
      }

      if (!['name', 'assetGroup'].includes(sortConfig.key)) {
        return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;
      }
      return 0;
    });

    return result;
  }, [protocols, assetGroupFilter, searchQuery, sortConfig]);

  // ── Stats ──
  const stats = useMemo(() => {
    const totalTvl = protocols.reduce((sum, p) => sum + (p.tvl || 0), 0);
    const totalMcap = protocols.reduce((sum, p) => sum + (p.mcap || 0), 0);
    const totalAssets = protocols.length;
    const uniqueIssuers = new Set(protocols.map(p => p.issuer).filter(Boolean)).size;
    const protocolsWithoutIssuer = protocols.filter(p => !p.issuer).length;
    const totalIssuers = uniqueIssuers + protocolsWithoutIssuer;

    // Calculate TVL by asset group for display
    const tvlByGroup = {};
    protocols.forEach(p => {
      const group = p.assetGroup || 'Other';
      tvlByGroup[group] = (tvlByGroup[group] || 0) + (p.tvl || 0);
    });

    return { totalTvl, totalMcap, totalAssets, totalIssuers, tvlByGroup };
  }, [protocols]);

  // ── Chart asset groups ──
  const chartAssetGroups = useMemo(() => {
    const groups = new Set();
    chartData.forEach(entry => {
      Object.keys(entry).forEach(key => {
        if (key !== 'date' && key !== 'timestamp') groups.add(key);
      });
    });
    return Array.from(groups).sort((a, b) => {
      const totalA = chartData.reduce((sum, d) => sum + (d[a] || 0), 0);
      const totalB = chartData.reduce((sum, d) => sum + (d[b] || 0), 0);
      return totalB - totalA;
    });
  }, [chartData]);

  // ── CSV Export ──
  const exportCSV = () => {
    const headers = [
      'Name', 'Symbol', 'Asset Group', 'TVL', 'Market Cap', '1d Change', '7d Change',
      'Chains', 'Issuer', 'Redeemable', 'Attestations', 'CEX Listed', 'KYC', 'Transferable', 'URL'
    ];
    const rows = filteredProtocols.map(p => [
      p.name,
      p.symbol || '',
      p.assetGroup || '',
      p.tvl?.toFixed(0) || '',
      p.mcap?.toFixed(0) || '',
      p.change1d?.toFixed(2) || '',
      p.change7d?.toFixed(2) || '',
      p.chains.join('; '),
      p.issuer || '',
      p.redeemable ?? '',
      p.attestations ?? '',
      p.cexListed ?? '',
      p.kyc ?? '',
      p.transferable ?? '',
      p.url,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rwa-assets-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ──
  return (
    <div className="min-h-screen text-[#cdd0d8]" style={{ background: '#0d1019', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* ─── Header ─── */}
      <header className="border-b border-[#1c2039] px-4 py-3">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-white tracking-tight">RWA Dashboard</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e2235] text-[#3fb68b] font-medium">LIVE</span>
            </div>
            <span className="text-[11px] text-[#545a70]">Powered by DeFiLlama</span>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-[11px] text-[#545a70]">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-1.5 rounded hover:bg-[#1e2235] transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#8a8fa8] ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded bg-[#1e2235] hover:bg-[#262b42] text-[#8a8fa8] transition-colors"
            >
              <Download className="w-3 h-3" />
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-4 py-6">
        {/* ─── Stats Cards ─── */}
        <div className="flex flex-wrap gap-4 mb-6">
          <StatCard
            label="Total RWA TVL"
            value={formatCurrency(stats.totalTvl)}
          />
          <StatCard
            label="Total Market Cap"
            value={formatCurrency(stats.totalMcap)}
          />
          <StatCard
            label="Total Assets"
            value={stats.totalAssets.toLocaleString()}
          />
          <StatCard
            label="Asset Issuers"
            value={stats.totalIssuers.toLocaleString()}
          />
        </div>

        {/* ─── Chart ─── */}
        <div className="bg-[#131621] border border-[#1c2039] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white">RWA TVL by Asset Group</h2>
            {chartLoading && <Loader2 className="w-4 h-4 text-[#5b9cf5] animate-spin" />}
          </div>
          <div className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2039" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#545a70', fontSize: 10 }}
                    tickLine={{ stroke: '#1c2039' }}
                    axisLine={{ stroke: '#1c2039' }}
                  />
                  <YAxis
                    tick={{ fill: '#545a70', fontSize: 10 }}
                    tickLine={{ stroke: '#1c2039' }}
                    axisLine={{ stroke: '#1c2039' }}
                    tickFormatter={(v) => formatCurrency(v)}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 10 }}
                    formatter={(value) => <span className="text-[11px] text-[#8a8fa8]">{value}</span>}
                  />
                  {chartAssetGroups.map((group) => (
                    <Area
                      key={group}
                      type="monotone"
                      dataKey={group}
                      stackId="1"
                      stroke={ASSET_GROUP_COLORS[group] || '#7f8c8d'}
                      fill={ASSET_GROUP_COLORS[group] || '#7f8c8d'}
                      fillOpacity={0.6}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : !chartLoading ? (
              <div className="h-full flex items-center justify-center text-[#545a70] text-sm">
                No chart data available
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[#5b9cf5] animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* ─── Asset Group Tabs ─── */}
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
          {assetGroups.map(group => (
            <button
              key={group}
              onClick={() => setAssetGroupFilter(group)}
              className={`px-3 py-1.5 text-[11px] rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5
                ${assetGroupFilter === group
                  ? 'bg-[#1e2235] text-[#5b9cf5] font-medium'
                  : 'text-[#545a70] hover:text-[#8a8fa8] hover:bg-[#13162180]'
                }`}
            >
              {group !== 'All' && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: ASSET_GROUP_COLORS[group] || '#7f8c8d' }}
                />
              )}
              {group}
              {group !== 'All' && (
                <span className="text-[#3a3f55] ml-1">
                  ({protocols.filter(p => p.assetGroup === group).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Search ─── */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#545a70]" />
            <input
              type="text"
              placeholder="Search by name, symbol, or ticker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#131621] border border-[#1c2039] rounded-lg text-sm text-[#cdd0d8]
                focus:outline-none focus:border-[#2a3050] placeholder:text-[#3a3f55]"
            />
          </div>
        </div>

        {/* ─── Error State ─── */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#1a1520] border border-[#2a1a2a] flex items-center gap-2 text-sm text-[#f46565]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={loadData} className="ml-auto text-[11px] px-2 py-1 bg-[#2a1a2a] rounded hover:bg-[#3a2a3a]">
              Retry
            </button>
          </div>
        )}

        {/* ─── Loading ─── */}
        {isLoading && protocols.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#5b9cf5] animate-spin" />
            <span className="ml-2 text-sm text-[#545a70]">Loading RWA assets from DeFiLlama...</span>
          </div>
        )}

        {/* ─── Table ─── */}
        {protocols.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-[#1c2039]">
            <table className="w-full text-xs">
              <thead className="bg-[#131621] sticky top-0 z-10">
                <tr>
                  <th className="w-10 px-3 py-3 text-[11px] font-medium text-[#545a70] text-right">#</th>
                  <SortHeader label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} className="min-w-[200px]" />
                  <SortHeader label="Asset Group" sortKey="assetGroup" sortConfig={sortConfig} onSort={handleSort} />
                  <SortHeader label="TVL" sortKey="tvl" sortConfig={sortConfig} onSort={handleSort} align="right" />
                  <SortHeader label="Mcap" sortKey="mcap" sortConfig={sortConfig} onSort={handleSort} align="right" />
                  <SortHeader label="1d %" sortKey="change1d" sortConfig={sortConfig} onSort={handleSort} align="right" />
                  <SortHeader label="7d %" sortKey="change7d" sortConfig={sortConfig} onSort={handleSort} align="right" />
                  <SortHeader label="Chains" sortKey="chains" sortConfig={sortConfig} onSort={handleSort} />
                  <th className="px-3 py-3 text-[11px] font-medium text-[#545a70] text-left">Issuer</th>
                  <th className="px-3 py-3 text-[11px] font-medium text-[#545a70] text-center">Redeem</th>
                  <th className="px-3 py-3 text-[11px] font-medium text-[#545a70] text-center">Attest</th>
                  <th className="px-3 py-3 text-[11px] font-medium text-[#545a70] text-center">CEX</th>
                  <th className="px-3 py-3 text-[11px] font-medium text-[#545a70] text-center">KYC</th>
                  <th className="px-3 py-3 text-[11px] font-medium text-[#545a70] text-center">Transfer</th>
                  <th className="w-8 px-2 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProtocols.map((protocol, idx) => (
                  <tr
                    key={protocol.id}
                    className="border-b border-[#1c2039] hover:bg-[#12152080] transition-colors"
                  >
                    <td className="px-3 py-3 text-right text-[#545a70] font-mono">{idx + 1}</td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <ProtocolLogo src={protocol.logo} name={protocol.name} />
                        <div className="min-w-0">
                          <div className="font-medium text-white text-[13px] truncate flex items-center gap-1.5">
                            {protocol.name}
                            {protocol.url && (
                              <a
                                href={protocol.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[#545a70] hover:text-[#5b9cf5]"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          {protocol.symbol && (
                            <div className="text-[10px] text-[#545a70] uppercase">{protocol.symbol}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${ASSET_GROUP_COLORS[protocol.assetGroup] || '#7f8c8d'}20`,
                          color: ASSET_GROUP_COLORS[protocol.assetGroup] || '#7f8c8d',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: ASSET_GROUP_COLORS[protocol.assetGroup] || '#7f8c8d' }}
                        />
                        {protocol.assetGroup}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-right font-mono text-white">
                      {formatCurrency(protocol.tvl)}
                    </td>

                    <td className="px-3 py-3 text-right font-mono text-[#8a8fa8]">
                      {formatCurrency(protocol.mcap)}
                    </td>

                    <td className={`px-3 py-3 text-right font-mono text-xs ${
                      protocol.change1d == null ? 'text-[#545a70]'
                      : protocol.change1d >= 0 ? 'text-[#3fb68b]' : 'text-[#f46565]'
                    }`}>
                      {protocol.change1d != null ? formatPercent(protocol.change1d) : '—'}
                    </td>

                    <td className={`px-3 py-3 text-right font-mono text-xs ${
                      protocol.change7d == null ? 'text-[#545a70]'
                      : protocol.change7d >= 0 ? 'text-[#3fb68b]' : 'text-[#f46565]'
                    }`}>
                      {protocol.change7d != null ? formatPercent(protocol.change7d) : '—'}
                    </td>

                    <td className="px-3 py-3">
                      <ChainPills chains={protocol.chains} />
                    </td>

                    <td className="px-3 py-3 text-[#8a8fa8] text-xs capitalize">
                      {protocol.issuer || '—'}
                    </td>

                    <td className="px-3 py-3 text-center">
                      <BooleanCell value={protocol.redeemable} />
                    </td>

                    <td className="px-3 py-3 text-center">
                      <BooleanCell value={protocol.attestations} />
                    </td>

                    <td className="px-3 py-3 text-center">
                      <BooleanCell value={protocol.cexListed} />
                    </td>

                    <td className="px-3 py-3 text-center">
                      <BooleanCell value={protocol.kyc} />
                    </td>

                    <td className="px-3 py-3 text-center">
                      <BooleanCell value={protocol.transferable} />
                    </td>

                    <td className="px-2 py-3">
                      {protocol.geckoId && (
                        <a
                          href={`https://www.coingecko.com/en/coins/${protocol.geckoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#545a70] hover:text-[#5b9cf5]"
                          title="View on CoinGecko"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredProtocols.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={15} className="text-center py-12 text-[#545a70]">
                      No assets found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Footer ─── */}
        <div className="mt-4 flex items-center justify-between text-[10px] text-[#3a3f55]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-[#3fb68b]" /> Yes</span>
            <span className="flex items-center gap-1"><X className="w-3 h-3 text-[#f46565]" /> No</span>
            <span>— Unknown</span>
          </div>
          <div>
            Data from{' '}
            <a href="https://defillama.com/rwa" target="_blank" rel="noopener noreferrer" className="text-[#5b9cf5] hover:underline">
              DeFiLlama RWA
            </a>{' '}
            · Auto-refreshes every 5 min
          </div>
        </div>
      </main>
    </div>
  );
}
