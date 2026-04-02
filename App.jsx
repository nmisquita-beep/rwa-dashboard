import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, ExternalLink, ChevronDown, ChevronUp, RefreshCw,
  Download, ArrowUpDown, AlertCircle, Loader2, Check, X, Minus
} from 'lucide-react';

// ─── API Endpoints ───────────────────────────────────────────────────────────
const RWA_BASE = 'https://api.llama.fi/rwa';
const ICON_BASE = 'https://icons.llama.fi';

// ─── Formatters ──────────────────────────────────────────────────────────────
function fmt(v) {
  if (v == null || isNaN(v)) return '—';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}b`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}m`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}k`;
  return `$${v.toFixed(2)}`;
}
function pct(v) {
  if (v == null || isNaN(v)) return '—';
  return `${(v * 100).toFixed(1)}%`;
}

// ─── Data helpers ────────────────────────────────────────────────────────────
function sumMap(obj) {
  if (!obj) return 0;
  if (typeof obj === 'number') return obj;
  return Object.values(obj).reduce((s, v) => {
    if (typeof v === 'number') return s + v;
    if (typeof v === 'object' && v !== null) return s + sumMap(v);
    return s;
  }, 0);
}

function getChains(project) {
  if (project.chain && Array.isArray(project.chain)) return project.chain;
  if (project.contracts) return Object.keys(project.contracts);
  if (project.onChainMcap && typeof project.onChainMcap === 'object') return Object.keys(project.onChainMcap);
  return [];
}

function normalize(projects) {
  return projects.map(p => {
    const onChainMcap = sumMap(p.onChainMcap);
    const activeMcap = sumMap(p.activeMcap);
    const defiActiveTvl = sumMap(p.defiActiveTvl);
    const utilization = activeMcap > 0 ? defiActiveTvl / activeMcap : 0;
    const chains = getChains(p);

    return {
      ...p,
      _onChainMcap: onChainMcap,
      _activeMcap: activeMcap,
      _defiActiveTvl: defiActiveTvl,
      _utilization: utilization,
      _chains: chains,
      _assetGroup: p.assetGroup || '—',
      _category: Array.isArray(p.category) ? p.category.join(', ') : (p.category || '—'),
      _assetClass: Array.isArray(p.assetClass) ? p.assetClass.join(', ') : (p.assetClass || '—'),
      _issuer: p.issuer || '—',
      _accessModel: p.accessModel || '—',
      _type: p.type || '—',
      _rwaClass: p.rwaClassification || '—',
    };
  }).filter(p => p._activeMcap > 0 || p._onChainMcap > 0 || p._defiActiveTvl > 0)
    .sort((a, b) => b._activeMcap - a._activeMcap);
}

// ─── Components ──────────────────────────────────────────────────────────────
function Logo({ project }) {
  const [err, setErr] = useState(false);
  const src = (() => {
    if (project.logo) {
      if (Array.isArray(project.logo)) return project.logo[0];
      return project.logo;
    }
    if (project.coingeckoId) return `${ICON_BASE}/${project.coingeckoId}.jpg`;
    const slug = project.ticker?.toLowerCase();
    if (slug) return `${ICON_BASE}/${slug}.jpg`;
    return null;
  })();

  if (!src || err) {
    return (
      <div className="w-6 h-6 rounded-full bg-[#2a2f42] flex items-center justify-center text-[10px] font-bold text-[#8a8fa8] flex-shrink-0">
        {(project.ticker || project.assetName || '?').charAt(0).toUpperCase()}
      </div>
    );
  }
  return <img src={src} alt="" className="w-6 h-6 rounded-full flex-shrink-0 bg-[#2a2f42]" onError={() => setErr(true)} />;
}

function Bool({ value }) {
  if (value === true) return <Check className="w-3.5 h-3.5 text-[#3fb68b]" />;
  if (value === false) return <X className="w-3.5 h-3.5 text-[#f46565]" />;
  return <Minus className="w-3.5 h-3.5 text-[#545a70]" />;
}

function StatCard({ label, value, sub }) {
  return (
    <div className="px-5 py-3 rounded-lg bg-[#131621] border border-[#1c2039]">
      <div className="text-[10px] text-[#5b9cf5] uppercase tracking-wider font-medium mb-0.5">{label}</div>
      <div className="text-lg font-semibold text-white">{value}</div>
      {sub && <div className="text-[10px] text-[#545a70] mt-0.5">{sub}</div>}
    </div>
  );
}

function SortTh({ label, sortKey, cfg, onSort, align = 'left' }) {
  const active = cfg.key === sortKey;
  return (
    <th
      className={`px-2.5 py-2 text-[10px] font-medium uppercase tracking-wider cursor-pointer select-none
        hover:bg-[#1a1e30] transition-colors whitespace-nowrap
        ${align === 'right' ? 'text-right' : 'text-left'}
        ${active ? 'text-[#5b9cf5]' : 'text-[#545a70]'}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-0.5 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        {active ? (cfg.dir === 'desc' ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronUp className="w-2.5 h-2.5" />) : <ArrowUpDown className="w-2.5 h-2.5 opacity-30" />}
      </div>
    </th>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updated, setUpdated] = useState(null);

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [sort, setSort] = useState({ key: '_activeMcap', dir: 'desc' });

  // ── Fetch ──
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [currentRes, statsRes] = await Promise.all([
        fetch(`${RWA_BASE}/current`).then(r => r.json()),
        fetch(`${RWA_BASE}/stats`).then(r => r.json()),
      ]);
      setProjects(normalize(currentRes));
      setStats(statsRes);
      setUpdated(new Date());
    } catch (e) {
      console.error(e);
      setError('Failed to load RWA data from DeFiLlama.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); const i = setInterval(load, 5 * 60 * 1000); return () => clearInterval(i); }, [load]);

  // ── Sort handler ──
  const onSort = useCallback((key) => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc' }));
  }, []);

  // ── Asset groups for filter tabs ──
  const assetGroups = useMemo(() => {
    const groups = new Set(projects.map(p => p._assetGroup).filter(g => g !== '—'));
    return ['All', ...Array.from(groups).sort()];
  }, [projects]);

  // ── Filter + Sort ──
  const filtered = useMemo(() => {
    let result = [...projects];
    if (groupFilter !== 'All') result = result.filter(p => p._assetGroup === groupFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        (p.assetName || '').toLowerCase().includes(q) ||
        (p.ticker || '').toLowerCase().includes(q) ||
        (p._issuer || '').toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      let av = a[sort.key], bv = b[sort.key];
      if (typeof av === 'string') { av = av.toLowerCase(); bv = (bv || '').toLowerCase(); return sort.dir === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv); }
      av = av ?? -Infinity; bv = bv ?? -Infinity;
      return sort.dir === 'desc' ? bv - av : av - bv;
    });
    return result;
  }, [projects, groupFilter, search, sort]);

  // ── CSV ──
  const exportCSV = () => {
    const h = ['Name','Ticker','Asset Group','Active Mcap','Onchain Mcap','DeFi Active TVL','Utilization','Category','Asset Class','Type','RWA Classification','Price','Issuer','Access Model','Redeemable','Attestations','CEX Listed','Chains'];
    const rows = filtered.map(p => [p.assetName,p.ticker,p._assetGroup,p._activeMcap,p._onChainMcap,p._defiActiveTvl,(p._utilization*100).toFixed(1)+'%',p._category,p._assetClass,p._type,p._rwaClass,p.price,p._issuer,p._accessModel,p.redeemable,p.attestations,p.cexListed,p._chains.join('; ')]);
    const csv = [h,...rows].map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `rwa-assets-${new Date().toISOString().split('T')[0]}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen text-[#cdd0d8]" style={{ background: '#0d1019', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Header */}
      <header className="border-b border-[#1c2039] px-4 py-3">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-white tracking-tight">RWA Dashboard</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#162a1f] text-[#3fb68b] font-medium">LIVE</span>
            <span className="text-[11px] text-[#545a70]">Powered by DeFiLlama RWA API</span>
          </div>
          <div className="flex items-center gap-3">
            {updated && <span className="text-[11px] text-[#545a70]">Updated {updated.toLocaleTimeString()}</span>}
            <button onClick={load} disabled={loading} className="p-1.5 rounded hover:bg-[#1e2235] transition-colors disabled:opacity-40"><RefreshCw className={`w-3.5 h-3.5 text-[#8a8fa8] ${loading ? 'animate-spin' : ''}`} /></button>
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded bg-[#1e2235] hover:bg-[#262b42] text-[#8a8fa8] transition-colors"><Download className="w-3 h-3" />.csv</button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-4 py-4">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard label="Total RWA Active Mcap" value={fmt(stats.totalActiveMcap)} />
            <StatCard label="Total RWA Onchain Mcap" value={fmt(stats.totalOnChainMcap)} />
            <StatCard label="DeFi Active TVL" value={fmt(stats.totalDefiActiveTvl)} />
            <StatCard label="Total Asset Issuers" value={stats.totalIssuers?.toLocaleString() || '—'} sub={`${stats.totalAssets?.toLocaleString() || '—'} assets`} />
          </div>
        )}

        {/* Asset Group Tabs */}
        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
          {assetGroups.map(g => (
            <button key={g} onClick={() => setGroupFilter(g)}
              className={`px-3 py-1.5 text-[11px] rounded-lg whitespace-nowrap transition-colors ${groupFilter === g ? 'bg-[#1e2235] text-[#5b9cf5] font-medium' : 'text-[#545a70] hover:text-[#8a8fa8] hover:bg-[#13162180]'}`}
            >{g}</button>
          ))}
        </div>

        {/* Search + Count */}
        <div className="flex items-center justify-between mb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#545a70]" />
            <input type="text" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#131621] border border-[#1c2039] rounded-lg text-xs text-[#cdd0d8] focus:outline-none focus:border-[#2a3050] placeholder:text-[#3a3f55]" />
          </div>
          <span className="text-[11px] text-[#545a70]">{filtered.length} assets</span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#1a1520] border border-[#2a1a2a] flex items-center gap-2 text-sm text-[#f46565]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            <button onClick={load} className="ml-auto text-[11px] px-2 py-1 bg-[#2a1a2a] rounded hover:bg-[#3a2a3a]">Retry</button>
          </div>
        )}

        {loading && projects.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#5b9cf5] animate-spin" />
            <span className="ml-2 text-sm text-[#545a70]">Loading RWA assets from DeFiLlama...</span>
          </div>
        )}

        {/* Table */}
        {projects.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-[#1c2039]">
            <table className="w-full text-[11px]">
              <thead className="bg-[#131621] sticky top-0 z-10">
                <tr>
                  <th className="w-8 px-2 py-2 text-[10px] font-medium text-[#545a70] text-right">#</th>
                  <SortTh label="Name" sortKey="assetName" cfg={sort} onSort={onSort} />
                  <SortTh label="Asset Group" sortKey="_assetGroup" cfg={sort} onSort={onSort} />
                  <SortTh label="Active Mcap" sortKey="_activeMcap" cfg={sort} onSort={onSort} align="right" />
                  <SortTh label="Onchain Mcap" sortKey="_onChainMcap" cfg={sort} onSort={onSort} align="right" />
                  <SortTh label="DeFi Active TVL" sortKey="_defiActiveTvl" cfg={sort} onSort={onSort} align="right" />
                  <SortTh label="Utilization" sortKey="_utilization" cfg={sort} onSort={onSort} align="right" />
                  <SortTh label="Category" sortKey="_category" cfg={sort} onSort={onSort} />
                  <SortTh label="Asset Class" sortKey="_assetClass" cfg={sort} onSort={onSort} />
                  <th className="px-2.5 py-2 text-[10px] font-medium text-[#545a70] uppercase text-left whitespace-nowrap">Access Model</th>
                  <th className="px-2.5 py-2 text-[10px] font-medium text-[#545a70] uppercase text-left whitespace-nowrap">Type</th>
                  <th className="px-2.5 py-2 text-[10px] font-medium text-[#545a70] uppercase text-left whitespace-nowrap">RWA Class.</th>
                  <SortTh label="Price" sortKey="price" cfg={sort} onSort={onSort} align="right" />
                  <SortTh label="Issuer" sortKey="_issuer" cfg={sort} onSort={onSort} />
                  <th className="px-2.5 py-2 text-[10px] font-medium text-[#545a70] uppercase text-center whitespace-nowrap">Redeem.</th>
                  <th className="px-2.5 py-2 text-[10px] font-medium text-[#545a70] uppercase text-center whitespace-nowrap">Attest.</th>
                  <th className="px-2.5 py-2 text-[10px] font-medium text-[#545a70] uppercase text-center whitespace-nowrap">CEX</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className="border-b border-[#1c2039] hover:bg-[#12152080] transition-colors">
                    <td className="px-2 py-2 text-right text-[#545a70] font-mono">{i + 1}</td>
                    <td className="px-2.5 py-2">
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <Logo project={p} />
                        <div className="min-w-0">
                          <div className="font-medium text-white text-xs truncate max-w-[160px]">
                            {p.website?.length ? (
                              <a href={p.website[0]} target="_blank" rel="noopener noreferrer" className="hover:text-[#5b9cf5] transition-colors" onClick={e => e.stopPropagation()}>
                                {p.assetName || p.ticker}
                              </a>
                            ) : (p.assetName || p.ticker)}
                          </div>
                          <div className="text-[10px] text-[#545a70] uppercase">{p.ticker}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e2235] text-[#8a8fa8] whitespace-nowrap">{p._assetGroup}</span>
                    </td>
                    <td className="px-2.5 py-2 text-right font-mono text-white">{fmt(p._activeMcap)}</td>
                    <td className="px-2.5 py-2 text-right font-mono text-[#8a8fa8]">{fmt(p._onChainMcap)}</td>
                    <td className="px-2.5 py-2 text-right font-mono text-[#8a8fa8]">{fmt(p._defiActiveTvl)}</td>
                    <td className="px-2.5 py-2 text-right font-mono text-[#8a8fa8]">{p._utilization > 0 ? pct(p._utilization) : '0%'}</td>
                    <td className="px-2.5 py-2 text-[#8a8fa8] max-w-[120px] truncate" title={p._category}>{p._category}</td>
                    <td className="px-2.5 py-2 text-[#8a8fa8] max-w-[120px] truncate" title={p._assetClass}>{p._assetClass}</td>
                    <td className="px-2.5 py-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap ${
                        p._accessModel === 'Permissionless' ? 'bg-[#162a1f] text-[#3fb68b]' :
                        p._accessModel === 'Permissioned' ? 'bg-[#2a2515] text-[#f5a623]' :
                        'bg-[#1e2235] text-[#545a70]'
                      }`}>{p._accessModel}</span>
                    </td>
                    <td className="px-2.5 py-2 text-[#8a8fa8]">{p._type}</td>
                    <td className="px-2.5 py-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e2235] text-[#8a8fa8] whitespace-nowrap">{p._rwaClass}</span>
                    </td>
                    <td className="px-2.5 py-2 text-right font-mono text-[#8a8fa8]">{p.price != null ? `$${Number(p.price).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '—'}</td>
                    <td className="px-2.5 py-2 text-[#8a8fa8] max-w-[100px] truncate" title={p._issuer}>{p._issuer}</td>
                    <td className="px-2.5 py-2 text-center"><Bool value={p.redeemable} /></td>
                    <td className="px-2.5 py-2 text-center"><Bool value={p.attestations} /></td>
                    <td className="px-2.5 py-2 text-center"><Bool value={p.cexListed} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={17} className="text-center py-12 text-[#545a70]">No assets found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-[10px] text-[#3a3f55]">
          <div className="flex items-center gap-3">
            <span className="text-[#3fb68b]"><Check className="w-3 h-3 inline" /> Yes</span>
            <span className="text-[#f46565]"><X className="w-3 h-3 inline" /> No</span>
            <span className="text-[#545a70]"><Minus className="w-3 h-3 inline" /> Unknown</span>
          </div>
          <div>
            Data from <a href="https://defillama.com/rwa" target="_blank" rel="noopener noreferrer" className="text-[#5b9cf5] hover:underline">DeFiLlama RWA</a> · Auto-refreshes every 5 min
          </div>
        </div>
      </main>
    </div>
  );
}
