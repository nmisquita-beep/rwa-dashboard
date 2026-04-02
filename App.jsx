import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, ExternalLink, ChevronDown, ChevronUp, RefreshCw,
  Download, ArrowUpDown, AlertCircle, Loader2
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFILLAMA_PROTOCOLS_URL = 'https://api.llama.fi/protocols';
const DEFILLAMA_FEES_URL = 'https://api.llama.fi/overview/fees';
const ICON_BASE = 'https://icons.llama.fi';

const CHAIN_OPTIONS = [
  'All', 'Ethereum', 'Solana', 'Polygon', 'Arbitrum', 'Base', 'Avalanche',
  'BSC', 'Optimism', 'Gnosis', 'Stellar', 'Aptos', 'Sui', 'Mantle',
  'Plume Mainnet', 'Tron', 'Algorand', 'XDC', 'Near'
];

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatCurrency(value) {
  if (value == null || isNaN(value)) return '—';
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}b`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}m`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

function formatPercent(value) {
  if (value == null || isNaN(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// ─── Data fetching ───────────────────────────────────────────────────────────

async function fetchRWAData() {
  const [protocolsRes, feesRes] = await Promise.allSettled([
    fetch(DEFILLAMA_PROTOCOLS_URL).then(r => r.json()),
    fetch(DEFILLAMA_FEES_URL).then(r => r.json()),
  ]);

  const allProtocols = protocolsRes.status === 'fulfilled' ? protocolsRes.value : [];
  const feesData = feesRes.status === 'fulfilled' ? feesRes.value : {};

  // Build fees lookup by protocol slug and name
  const feesMap = {};
  if (feesData.protocols) {
    for (const p of feesData.protocols) {
      const slug = p.slug || p.module?.replace('/index.js', '') || p.name?.toLowerCase().replace(/\s+/g, '-');
      if (slug) {
        feesMap[slug] = {
          fees24h: p.total24h ?? null,
          fees7d: p.total7d ?? null,
          fees30d: p.total30d ?? null,
          revenue24h: p.revenue24h ?? p.dailyRevenue ?? null,
          revenue7d: p.revenue7d ?? null,
          revenue30d: p.revenue30d ?? null,
        };
      }
      if (p.defillamaId) {
        feesMap[`id_${p.defillamaId}`] = feesMap[slug];
      }
      if (p.name) {
        feesMap[`name_${p.name.toLowerCase()}`] = feesMap[slug];
      }
    }
  }

  // Filter for RWA category
  const rwaProtocols = allProtocols
    .filter(p => p.category === 'RWA')
    .map(p => {
      const slug = p.slug || p.name?.toLowerCase().replace(/\s+/g, '-');
      const fees = feesMap[slug] || feesMap[`id_${p.id}`] || feesMap[`name_${p.name?.toLowerCase()}`] || {};

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        symbol: p.symbol,
        logo: `${ICON_BASE}/${p.slug || slug}.jpg`,
        tvl: p.tvl ?? 0,
        change1h: p.change_1h ?? null,
        change1d: p.change_1d ?? null,
        change7d: p.change_7d ?? null,
        mcap: p.mcap ?? null,
        chains: p.chains || [],
        category: p.category,
        description: p.description || '',
        url: p.url || '',
        twitter: p.twitter || '',
        geckoId: p.gecko_id || null,
        ...fees,
      };
    })
    .sort((a, b) => (b.tvl || 0) - (a.tvl || 0));

  return rwaProtocols;
}

// ─── Components ──────────────────────────────────────────────────────────────

function ProtocolLogo({ src, name }) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className="w-6 h-6 rounded-full bg-[#2a2f42] flex items-center justify-center text-[10px] font-bold text-[#8a8fa8] flex-shrink-0">
        {name?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="w-6 h-6 rounded-full flex-shrink-0 bg-[#2a2f42]"
      onError={() => setErrored(true)}
    />
  );
}

function ChainPills({ chains }) {
  if (!chains?.length) return <span className="text-[#545a70]">—</span>;
  const shown = chains.slice(0, 4);
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

function SortHeader({ label, sortKey, sortConfig, onSort, align = 'left' }) {
  const active = sortConfig.key === sortKey;
  return (
    <th
      className={`px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider cursor-pointer
        hover:bg-[#1a1e30] transition-colors whitespace-nowrap select-none
        ${align === 'right' ? 'text-right' : 'text-left'}
        ${active ? 'text-[#5b9cf5]' : 'text-[#545a70]'}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
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

function ChangeCell({ value }) {
  if (value == null || isNaN(value)) return <td className="px-3 py-2.5 text-right font-mono text-[#545a70] text-xs">—</td>;
  const positive = value >= 0;
  return (
    <td className={`px-3 py-2.5 text-right font-mono text-xs ${positive ? 'text-[#3fb68b]' : 'text-[#f46565]'}`}>
      {formatPercent(value)}
    </td>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [protocols, setProtocols] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [chainFilter, setChainFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'tvl', direction: 'desc' });
  const [expandedRows, setExpandedRows] = useState(new Set());

  // ── Fetch data ──
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRWAData();
      setProtocols(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch RWA data:', err);
      setError('Failed to load data from DeFiLlama. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  // ── Sort ──
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  // ── Filter & sort ──
  const filteredProtocols = useMemo(() => {
    let result = [...protocols];

    if (chainFilter !== 'All') {
      result = result.filter(p =>
        p.chains.some(c => c.toLowerCase() === chainFilter.toLowerCase())
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.symbol && p.symbol.toLowerCase().includes(q))
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
        case 'change1d': aVal = a.change1d ?? -Infinity; bVal = b.change1d ?? -Infinity; break;
        case 'change7d': aVal = a.change7d ?? -Infinity; bVal = b.change7d ?? -Infinity; break;
        case 'mcap': aVal = a.mcap ?? 0; bVal = b.mcap ?? 0; break;
        case 'mcapTvl':
          aVal = (a.mcap && a.tvl) ? a.mcap / a.tvl : 0;
          bVal = (b.mcap && b.tvl) ? b.mcap / b.tvl : 0;
          break;
        case 'fees7d': aVal = a.fees7d ?? 0; bVal = b.fees7d ?? 0; break;
        case 'revenue7d': aVal = a.revenue7d ?? 0; bVal = b.revenue7d ?? 0; break;
        case 'chains': aVal = a.chains.length; bVal = b.chains.length; break;
        default: aVal = 0; bVal = 0;
      }

      if (sortConfig.key !== 'name') {
        return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;
      }
      return 0;
    });

    return result;
  }, [protocols, chainFilter, searchQuery, sortConfig]);

  // ── Stats ──
  const totalTVL = useMemo(() => protocols.reduce((sum, p) => sum + (p.tvl || 0), 0), [protocols]);
  const totalFees7d = useMemo(() => protocols.reduce((sum, p) => sum + (p.fees7d || 0), 0), [protocols]);
  const totalRevenue7d = useMemo(() => protocols.reduce((sum, p) => sum + (p.revenue7d || 0), 0), [protocols]);

  // ── Expand ──
  const toggleExpand = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── CSV Export ──
  const exportCSV = () => {
    const headers = ['Name', 'Symbol', 'TVL', '1d Change', '7d Change', 'Market Cap', 'Mcap/TVL', 'Chains', 'Fees 7d', 'Revenue 7d', 'URL'];
    const rows = filteredProtocols.map(p => [
      p.name,
      p.symbol || '',
      p.tvl?.toFixed(0) || '',
      p.change1d?.toFixed(2) || '',
      p.change7d?.toFixed(2) || '',
      p.mcap?.toFixed(0) || '',
      (p.mcap && p.tvl) ? (p.mcap / p.tvl).toFixed(2) : '',
      p.chains.join('; '),
      p.fees7d?.toFixed(0) || '',
      p.revenue7d?.toFixed(0) || '',
      p.url,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rwa-protocols-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ──
  return (
    <div className="min-h-screen text-[#cdd0d8]" style={{ background: '#0d1019', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* ─── Header ─── */}
      <header className="border-b border-[#1c2039] px-4 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
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
              .csv
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-4">
        {/* ─── Stats Bar ─── */}
        <div className="flex items-center gap-6 mb-4">
          <div>
            <span className="text-[11px] text-[#545a70] uppercase tracking-wider">Total RWA Value</span>
            <div className="text-xl font-semibold text-white">{formatCurrency(totalTVL)}</div>
          </div>
          {totalFees7d > 0 && (
            <div>
              <span className="text-[11px] text-[#545a70] uppercase tracking-wider">Fees (7d)</span>
              <div className="text-sm font-medium text-[#cdd0d8]">{formatCurrency(totalFees7d)}</div>
            </div>
          )}
          {totalRevenue7d > 0 && (
            <div>
              <span className="text-[11px] text-[#545a70] uppercase tracking-wider">Revenue (7d)</span>
              <div className="text-sm font-medium text-[#cdd0d8]">{formatCurrency(totalRevenue7d)}</div>
            </div>
          )}
          <div>
            <span className="text-[11px] text-[#545a70] uppercase tracking-wider">Protocols</span>
            <div className="text-sm font-medium text-[#cdd0d8]">{filteredProtocols.length}</div>
          </div>
        </div>

        {/* ─── Chain Tabs ─── */}
        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
          {CHAIN_OPTIONS.map(chain => (
            <button
              key={chain}
              onClick={() => setChainFilter(chain)}
              className={`px-3 py-1.5 text-[11px] rounded-lg whitespace-nowrap transition-colors
                ${chainFilter === chain
                  ? 'bg-[#1e2235] text-[#5b9cf5] font-medium'
                  : 'text-[#545a70] hover:text-[#8a8fa8] hover:bg-[#13162180]'
                }`}
            >
              {chain}
            </button>
          ))}
        </div>

        {/* ─── Search ─── */}
        <div className="mb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#545a70]" />
            <input
              type="text"
              placeholder="Search protocols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#131621] border border-[#1c2039] rounded-lg text-xs text-[#cdd0d8]
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
            <span className="ml-2 text-sm text-[#545a70]">Loading RWA protocols from DeFiLlama...</span>
          </div>
        )}

        {/* ─── Table ─── */}
        {protocols.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-[#1c2039]">
            <table className="w-full text-xs">
              <thead className="bg-[#131621] sticky top-0 z-10">
                <tr>
                  <th className="w-10 px-3 py-2.5 text-[11px] font-medium text-[#545a70] text-right">#</th>
                  <SortHeader label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                  <SortHeader label="TVL" sortKey="tvl" sortConfig={sortConfig} onSort={handleSort} align="right" />
                  <SortHeader label="1d Change" sortKey="change1d" sortConfig={sortConfig} onSort={handleSort} align="right" />
                  <SortHeader label="7d Change" sortKey="change7d" sortConfig={sortConfig} onSort={handleSort} align="right" />
                  <SortHeader label="Mcap" sortKey="mcap" sortConfig={sortConfig} onSort={handleSort} align="right" />
                  <SortHeader label="Mcap/TVL" sortKey="mcapTvl" sortConfig={sortConfig} onSort={handleSort} align="right" />
                  <SortHeader label="Fees 7d" sortKey="fees7d" sortConfig={sortConfig} onSort={handleSort} align="right" />
                  <SortHeader label="Revenue 7d" sortKey="revenue7d" sortConfig={sortConfig} onSort={handleSort} align="right" />
                  <SortHeader label="Chains" sortKey="chains" sortConfig={sortConfig} onSort={handleSort} />
                  <th className="w-8 px-2 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProtocols.map((protocol, idx) => {
                  const mcapTvl = (protocol.mcap && protocol.tvl) ? (protocol.mcap / protocol.tvl) : null;
                  const isExpanded = expandedRows.has(protocol.id);

                  return (
                    <React.Fragment key={protocol.id}>
                      <tr
                        className={`border-b border-[#1c2039] cursor-pointer transition-colors
                          ${isExpanded ? 'bg-[#151929]' : 'hover:bg-[#12152080]'}`}
                        onClick={() => toggleExpand(protocol.id)}
                      >
                        <td className="px-3 py-2.5 text-right text-[#545a70] font-mono">{idx + 1}</td>

                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <ProtocolLogo src={protocol.logo} name={protocol.name} />
                            <div className="min-w-0">
                              <div className="font-medium text-white text-[13px] truncate">{protocol.name}</div>
                              {protocol.symbol && protocol.symbol !== '-' && (
                                <div className="text-[10px] text-[#545a70] uppercase">{protocol.symbol}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-2.5 text-right font-mono text-white">{formatCurrency(protocol.tvl)}</td>

                        <ChangeCell value={protocol.change1d} />
                        <ChangeCell value={protocol.change7d} />

                        <td className="px-3 py-2.5 text-right font-mono text-[#8a8fa8]">
                          {formatCurrency(protocol.mcap)}
                        </td>

                        <td className={`px-3 py-2.5 text-right font-mono ${
                          mcapTvl == null ? 'text-[#545a70]'
                          : mcapTvl < 1 ? 'text-[#3fb68b]'
                          : mcapTvl < 3 ? 'text-[#f5a623]'
                          : 'text-[#f46565]'
                        }`}>
                          {mcapTvl != null ? mcapTvl.toFixed(2) + 'x' : '—'}
                        </td>

                        <td className="px-3 py-2.5 text-right font-mono text-[#8a8fa8]">
                          {formatCurrency(protocol.fees7d)}
                        </td>

                        <td className="px-3 py-2.5 text-right font-mono text-[#8a8fa8]">
                          {formatCurrency(protocol.revenue7d)}
                        </td>

                        <td className="px-3 py-2.5">
                          <ChainPills chains={protocol.chains} />
                        </td>

                        <td className="px-2 py-2.5 text-center">
                          {isExpanded
                            ? <ChevronUp className="w-3.5 h-3.5 text-[#545a70]" />
                            : <ChevronDown className="w-3.5 h-3.5 text-[#545a70]" />
                          }
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#131621]">
                          <td colSpan={11} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              <div className="md:col-span-2">
                                <div className="text-[#545a70] uppercase text-[10px] tracking-wider mb-1">Description</div>
                                <p className="text-[#8a8fa8] leading-relaxed">
                                  {protocol.description || 'No description available.'}
                                </p>
                              </div>

                              <div>
                                <div className="text-[#545a70] uppercase text-[10px] tracking-wider mb-2">Links</div>
                                <div className="flex flex-wrap gap-2">
                                  {protocol.url && (
                                    <a
                                      href={protocol.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1 px-2 py-1 rounded bg-[#1e2235] text-[#5b9cf5] hover:bg-[#262b42] transition-colors"
                                    >
                                      <ExternalLink className="w-3 h-3" /> Website
                                    </a>
                                  )}
                                  {protocol.twitter && (
                                    <a
                                      href={`https://twitter.com/${protocol.twitter}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1 px-2 py-1 rounded bg-[#1e2235] text-[#5b9cf5] hover:bg-[#262b42] transition-colors"
                                    >
                                      <ExternalLink className="w-3 h-3" /> Twitter
                                    </a>
                                  )}
                                  {protocol.geckoId && (
                                    <a
                                      href={`https://www.coingecko.com/en/coins/${protocol.geckoId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1 px-2 py-1 rounded bg-[#1e2235] text-[#5b9cf5] hover:bg-[#262b42] transition-colors"
                                    >
                                      <ExternalLink className="w-3 h-3" /> CoinGecko
                                    </a>
                                  )}
                                </div>
                              </div>

                              <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#1c2039]">
                                <div>
                                  <div className="text-[#545a70] text-[10px] uppercase">1h Change</div>
                                  <div className={`font-mono ${
                                    protocol.change1h == null ? 'text-[#545a70]'
                                    : protocol.change1h >= 0 ? 'text-[#3fb68b]' : 'text-[#f46565]'
                                  }`}>
                                    {protocol.change1h != null ? formatPercent(protocol.change1h) : '—'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[#545a70] text-[10px] uppercase">Fees 24h</div>
                                  <div className="font-mono text-[#8a8fa8]">{formatCurrency(protocol.fees24h)}</div>
                                </div>
                                <div>
                                  <div className="text-[#545a70] text-[10px] uppercase">Revenue 24h</div>
                                  <div className="font-mono text-[#8a8fa8]">{formatCurrency(protocol.revenue24h)}</div>
                                </div>
                                <div>
                                  <div className="text-[#545a70] text-[10px] uppercase">Fees 30d</div>
                                  <div className="font-mono text-[#8a8fa8]">{formatCurrency(protocol.fees30d)}</div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {filteredProtocols.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-[#545a70]">
                      No protocols found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Footer ─── */}
        <div className="mt-3 flex items-center justify-between text-[10px] text-[#3a3f55]">
          <div className="flex items-center gap-4">
            <span>Mcap/TVL:</span>
            <span className="text-[#3fb68b]">&lt;1x Undervalued</span>
            <span className="text-[#f5a623]">1-3x Fair</span>
            <span className="text-[#f46565]">&gt;3x Overvalued</span>
          </div>
          <div>
            Data from{' '}
            <a href="https://defillama.com/protocols/rwa" target="_blank" rel="noopener noreferrer" className="text-[#5b9cf5] hover:underline">
              DeFiLlama
            </a>{' '}
            · Auto-refreshes every 5 min
          </div>
        </div>
      </main>
    </div>
  );
}
