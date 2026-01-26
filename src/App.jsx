import React, { useState, useEffect, useMemo } from 'react';
import { Search, ExternalLink, ChevronDown, ChevronUp, RefreshCw, Copy, Check, TrendingUp, TrendingDown, Filter, Download, Shield, ShieldAlert, ShieldX, ArrowUpDown } from 'lucide-react';

// Mock RWA Protocol Data
const mockProtocols = [
  {
    id: 'ondo-finance',
    name: 'Ondo Finance',
    logo: '🏛️',
    tvl: 634000000,
    tvlChange24h: 2.3,
    tvlChange7d: 8.5,
    marketCap: 1890000000,
    description: 'Institutional-grade finance on blockchain. Tokenized US Treasuries (OUSG) and short-term bonds.',
    assetClass: 'US Treasuries',
    liquidity24h: 45000000,
    volume24h: 78000000,
    revenue30d: 1200000,
    redeemable: 'Yes',
    attestationStatus: 'verified',
    attestationUrl: 'https://ondo.finance/attestations',
    cexListed: ['Coinbase', 'Kraken', 'Bybit'],
    dexListed: ['Uniswap', 'Curve'],
    secRegistered: false,
    transferable: 'Restricted',
    chains: ['ethereum', 'polygon'],
    website: 'https://ondo.finance',
    docs: 'https://docs.ondo.finance',
    contractAddress: '0x96F6eF951840721AdBF56A61D9B4cdb4E9Ef8D4c',
    tokenAddress: '0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92',
    secFilings: null,
    treasuryUrl: 'https://ondo.finance/transparency'
  },
  {
    id: 'maple-finance',
    name: 'Maple Finance',
    logo: '🍁',
    tvl: 127000000,
    tvlChange24h: -1.2,
    tvlChange7d: 4.2,
    marketCap: 89000000,
    description: 'Institutional capital markets. Undercollateralized lending to institutions and credit funds.',
    assetClass: 'Private Credit',
    liquidity24h: 8500000,
    volume24h: 12000000,
    revenue30d: 450000,
    redeemable: 'Conditional',
    attestationStatus: 'verified',
    attestationUrl: 'https://maple.finance/audits',
    cexListed: ['Binance', 'Coinbase'],
    dexListed: ['Uniswap', 'Balancer'],
    secRegistered: false,
    transferable: 'Yes',
    chains: ['ethereum', 'solana', 'base'],
    website: 'https://maple.finance',
    docs: 'https://docs.maple.finance',
    contractAddress: '0x33349B282065b0284d756F0577FB39c158F935e6',
    tokenAddress: '0x33349B282065b0284d756F0577FB39c158F935e6',
    secFilings: null,
    treasuryUrl: null
  },
  {
    id: 'centrifuge',
    name: 'Centrifuge',
    logo: '🌀',
    tvl: 256000000,
    tvlChange24h: 0.8,
    tvlChange7d: -2.1,
    marketCap: 178000000,
    description: 'Real-world asset financing protocol. Tokenizes invoices, real estate, and trade receivables.',
    assetClass: 'Mixed RWA',
    liquidity24h: 15000000,
    volume24h: 23000000,
    revenue30d: 680000,
    redeemable: 'Conditional',
    attestationStatus: 'verified',
    attestationUrl: 'https://centrifuge.io/audits',
    cexListed: ['Coinbase', 'Kraken'],
    dexListed: ['Uniswap'],
    secRegistered: false,
    transferable: 'Yes',
    chains: ['ethereum', 'centrifuge'],
    website: 'https://centrifuge.io',
    docs: 'https://docs.centrifuge.io',
    contractAddress: '0xc221b7E65FfC80DE234bbB6667aBDd46593D34F0',
    tokenAddress: '0xc221b7E65FfC80DE234bbB6667aBDd46593D34F0',
    secFilings: null,
    treasuryUrl: 'https://centrifuge.io/pools'
  },
  {
    id: 'goldfinch',
    name: 'Goldfinch',
    logo: '🐦',
    tvl: 98000000,
    tvlChange24h: 0.4,
    tvlChange7d: 1.8,
    marketCap: 45000000,
    description: 'Decentralized credit protocol for emerging market loans without crypto collateral.',
    assetClass: 'Emerging Market Loans',
    liquidity24h: 3200000,
    volume24h: 5800000,
    revenue30d: 320000,
    redeemable: 'Conditional',
    attestationStatus: 'pending',
    attestationUrl: 'https://goldfinch.finance/audits',
    cexListed: ['Coinbase'],
    dexListed: ['Uniswap'],
    secRegistered: false,
    transferable: 'Restricted',
    chains: ['ethereum'],
    website: 'https://goldfinch.finance',
    docs: 'https://docs.goldfinch.finance',
    contractAddress: '0xdab396cCF3d84Cf2D07C4454e10C8A6F5b008D2b',
    tokenAddress: '0xdab396cCF3d84Cf2D07C4454e10C8A6F5b008D2b',
    secFilings: null,
    treasuryUrl: null
  },
  {
    id: 'makerdao-rwa',
    name: 'MakerDAO RWA',
    logo: '🏗️',
    tvl: 2100000000,
    tvlChange24h: 0.1,
    tvlChange7d: 0.5,
    marketCap: 1450000000,
    description: 'MakerDAO RWA vaults backing DAI with US Treasuries and institutional credit.',
    assetClass: 'US Treasuries',
    liquidity24h: 180000000,
    volume24h: 320000000,
    revenue30d: 4500000,
    redeemable: 'No',
    attestationStatus: 'verified',
    attestationUrl: 'https://makerdao.com/audits',
    cexListed: ['All Major'],
    dexListed: ['Uniswap', 'Curve', 'Balancer'],
    secRegistered: false,
    transferable: 'Yes',
    chains: ['ethereum'],
    website: 'https://makerdao.com',
    docs: 'https://docs.makerdao.com',
    contractAddress: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
    tokenAddress: '0x6B175474E89094C44Da98b954EescdECD3EF9e86D',
    secFilings: null,
    treasuryUrl: 'https://makerburn.com'
  },
  {
    id: 'backed-finance',
    name: 'Backed Finance',
    logo: '📊',
    tvl: 45000000,
    tvlChange24h: 3.2,
    tvlChange7d: 12.4,
    marketCap: null,
    description: 'Tokenized securities including stocks and ETFs. Fully backed 1:1 with real assets.',
    assetClass: 'Tokenized Securities',
    liquidity24h: 2800000,
    volume24h: 4500000,
    revenue30d: 180000,
    redeemable: 'Yes',
    attestationStatus: 'verified',
    attestationUrl: 'https://backed.fi/attestations',
    cexListed: [],
    dexListed: ['Uniswap'],
    secRegistered: false,
    transferable: 'Restricted',
    chains: ['ethereum', 'gnosis'],
    website: 'https://backed.fi',
    docs: 'https://docs.backed.fi',
    contractAddress: '0xCA30c93B02514f86d5C86a6e375E3A330B435Fb5',
    tokenAddress: '0xCA30c93B02514f86d5C86a6e375E3A330B435Fb5',
    secFilings: null,
    treasuryUrl: 'https://backed.fi/proof-of-reserves'
  },
  {
    id: 'matrixdock',
    name: 'Matrixdock',
    logo: '📐',
    tvl: 312000000,
    tvlChange24h: 1.5,
    tvlChange7d: 6.8,
    marketCap: null,
    description: 'Short-term Treasury Bill token (STBT). Fully backed by US T-Bills.',
    assetClass: 'US Treasuries',
    liquidity24h: 28000000,
    volume24h: 42000000,
    revenue30d: 890000,
    redeemable: 'Yes',
    attestationStatus: 'verified',
    attestationUrl: 'https://matrixdock.com/attestation',
    cexListed: [],
    dexListed: ['Curve'],
    secRegistered: false,
    transferable: 'Restricted',
    chains: ['ethereum'],
    website: 'https://matrixdock.com',
    docs: 'https://docs.matrixdock.com',
    contractAddress: '0x530824DA86689C9C17CdC2871Ff29B058345b44a',
    tokenAddress: '0x530824DA86689C9C17CdC2871Ff29B058345b44a',
    secFilings: null,
    treasuryUrl: 'https://matrixdock.com/proof-of-reserve'
  },
  {
    id: 'openeden',
    name: 'OpenEden',
    logo: '🌿',
    tvl: 156000000,
    tvlChange24h: 2.1,
    tvlChange7d: 9.2,
    marketCap: null,
    description: 'Tokenized US Treasury Bills. Institutional-grade T-Bill vault on-chain.',
    assetClass: 'US Treasuries',
    liquidity24h: 18000000,
    volume24h: 25000000,
    revenue30d: 520000,
    redeemable: 'Yes',
    attestationStatus: 'verified',
    attestationUrl: 'https://openeden.com/attestations',
    cexListed: [],
    dexListed: ['Uniswap'],
    secRegistered: false,
    transferable: 'Restricted',
    chains: ['ethereum', 'arbitrum'],
    website: 'https://openeden.com',
    docs: 'https://docs.openeden.com',
    contractAddress: '0x2c5D4B55E8E9b0E3b1F8E9A8D7E6C5B4A3F2E1D0',
    tokenAddress: '0x2c5D4B55E8E9b0E3b1F8E9A8D7E6C5B4A3F2E1D0',
    secFilings: null,
    treasuryUrl: 'https://openeden.com/transparency'
  },
  {
    id: 'mountain-protocol',
    name: 'Mountain Protocol',
    logo: '⛰️',
    tvl: 78000000,
    tvlChange24h: 4.5,
    tvlChange7d: 15.3,
    marketCap: null,
    description: 'USDM - yield-bearing stablecoin backed by US Treasuries. Daily rebasing.',
    assetClass: 'US Treasuries',
    liquidity24h: 12000000,
    volume24h: 18000000,
    revenue30d: 280000,
    redeemable: 'Yes',
    attestationStatus: 'verified',
    attestationUrl: 'https://mountainprotocol.com/attestations',
    cexListed: ['Bybit'],
    dexListed: ['Curve', 'Uniswap'],
    secRegistered: false,
    transferable: 'Yes',
    chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'],
    website: 'https://mountainprotocol.com',
    docs: 'https://docs.mountainprotocol.com',
    contractAddress: '0x59D9356E565Ab3A36dD77763Fc0d87fEaf85508C',
    tokenAddress: '0x59D9356E565Ab3A36dD77763Fc0d87fEaf85508C',
    secFilings: null,
    treasuryUrl: 'https://mountainprotocol.com/transparency'
  },
  {
    id: 'trufi',
    name: 'TrueFi',
    logo: '💎',
    tvl: 34000000,
    tvlChange24h: -0.8,
    tvlChange7d: 2.1,
    marketCap: 52000000,
    description: 'Uncollateralized DeFi lending. Credit scoring for institutional borrowers.',
    assetClass: 'Private Credit',
    liquidity24h: 2100000,
    volume24h: 3800000,
    revenue30d: 145000,
    redeemable: 'Conditional',
    attestationStatus: 'pending',
    attestationUrl: 'https://truefi.io/audits',
    cexListed: ['Binance', 'FTX'],
    dexListed: ['Uniswap', 'Sushiswap'],
    secRegistered: false,
    transferable: 'Yes',
    chains: ['ethereum', 'optimism'],
    website: 'https://truefi.io',
    docs: 'https://docs.truefi.io',
    contractAddress: '0x4C19596f5aAfF459fA38B0f7eD92F11AE6543784',
    tokenAddress: '0x4C19596f5aAfF459fA38B0f7eD92F11AE6543784',
    secFilings: null,
    treasuryUrl: null
  },
  {
    id: 'credix',
    name: 'Credix',
    logo: '🔷',
    tvl: 67000000,
    tvlChange24h: 1.2,
    tvlChange7d: 5.6,
    marketCap: null,
    description: 'Private credit marketplace for emerging markets. Fintech and SME lending.',
    assetClass: 'Private Credit',
    liquidity24h: 4500000,
    volume24h: 7200000,
    revenue30d: 285000,
    redeemable: 'Conditional',
    attestationStatus: 'verified',
    attestationUrl: 'https://credix.finance/audits',
    cexListed: [],
    dexListed: [],
    secRegistered: false,
    transferable: 'Restricted',
    chains: ['solana'],
    website: 'https://credix.finance',
    docs: 'https://docs.credix.finance',
    contractAddress: 'CrdxP2WJ3K4VXXXXXXXXXXxample',
    tokenAddress: null,
    secFilings: null,
    treasuryUrl: 'https://credix.finance/pools'
  },
  {
    id: 'fortunafi',
    name: 'Fortunafi',
    logo: '🍀',
    tvl: 23000000,
    tvlChange24h: 0.6,
    tvlChange7d: 3.4,
    marketCap: null,
    description: 'Real-world asset lending. Revenue-based financing and equipment leasing.',
    assetClass: 'Mixed RWA',
    liquidity24h: 1800000,
    volume24h: 2900000,
    revenue30d: 98000,
    redeemable: 'Conditional',
    attestationStatus: 'pending',
    attestationUrl: null,
    cexListed: [],
    dexListed: [],
    secRegistered: false,
    transferable: 'Restricted',
    chains: ['ethereum'],
    website: 'https://fortunafi.com',
    docs: 'https://docs.fortunafi.com',
    contractAddress: '0x8F8e8b3C8D5E6F7A9B0C1D2E3F4A5B6C7D8E9F0A',
    tokenAddress: null,
    secFilings: null,
    treasuryUrl: null
  },
  {
    id: 'realio',
    name: 'Realio Network',
    logo: '🏢',
    tvl: 18000000,
    tvlChange24h: -0.3,
    tvlChange7d: 1.2,
    marketCap: 32000000,
    description: 'Tokenized real estate and private equity. Institutional issuance platform.',
    assetClass: 'Real Estate',
    liquidity24h: 890000,
    volume24h: 1500000,
    revenue30d: 65000,
    redeemable: 'Conditional',
    attestationStatus: 'none',
    attestationUrl: null,
    cexListed: ['Gate.io'],
    dexListed: ['Uniswap'],
    secRegistered: true,
    transferable: 'Restricted',
    chains: ['ethereum', 'algorand'],
    website: 'https://realio.network',
    docs: 'https://docs.realio.network',
    contractAddress: '0x1D3B6C9B8A7E5F4D2C1A0B9E8D7C6F5A4B3E2D1C',
    tokenAddress: '0x1D3B6C9B8A7E5F4D2C1A0B9E8D7C6F5A4B3E2D1C',
    secFilings: 'https://www.sec.gov/cgi-bin/browse-edgar?company=realio',
    treasuryUrl: null
  },
  {
    id: 'paxos-gold',
    name: 'Paxos Gold',
    logo: '🥇',
    tvl: 485000000,
    tvlChange24h: 0.2,
    tvlChange7d: -0.8,
    marketCap: 485000000,
    description: 'PAXG - each token backed by one fine troy ounce of London Good Delivery gold.',
    assetClass: 'Commodities',
    liquidity24h: 35000000,
    volume24h: 58000000,
    revenue30d: 420000,
    redeemable: 'Yes',
    attestationStatus: 'verified',
    attestationUrl: 'https://paxos.com/attestations',
    cexListed: ['Binance', 'Kraken', 'Coinbase', 'FTX'],
    dexListed: ['Uniswap', 'Curve'],
    secRegistered: true,
    transferable: 'Yes',
    chains: ['ethereum'],
    website: 'https://paxos.com/paxgold',
    docs: 'https://docs.paxos.com',
    contractAddress: '0x45804880De22913dAFE09f4980848ECE6EcbAf78',
    tokenAddress: '0x45804880De22913dAFE09f4980848ECE6EcbAf78',
    secFilings: 'https://www.sec.gov/cgi-bin/browse-edgar?company=paxos',
    treasuryUrl: 'https://paxos.com/attestations'
  },
  {
    id: 'tether-gold',
    name: 'Tether Gold',
    logo: '🪙',
    tvl: 612000000,
    tvlChange24h: 0.1,
    tvlChange7d: -0.5,
    marketCap: 612000000,
    description: 'XAUT - tokenized gold stored in Swiss vaults. Each token = 1 troy ounce.',
    assetClass: 'Commodities',
    liquidity24h: 28000000,
    volume24h: 45000000,
    revenue30d: 380000,
    redeemable: 'Yes',
    attestationStatus: 'verified',
    attestationUrl: 'https://gold.tether.to/attestations',
    cexListed: ['Bitfinex', 'FTX'],
    dexListed: ['Uniswap'],
    secRegistered: false,
    transferable: 'Yes',
    chains: ['ethereum', 'tron'],
    website: 'https://gold.tether.to',
    docs: 'https://gold.tether.to/docs',
    contractAddress: '0x68749665FF8D2d112Fa859AA293F07A622782F38',
    tokenAddress: '0x68749665FF8D2d112Fa859AA293F07A622782F38',
    secFilings: null,
    treasuryUrl: 'https://gold.tether.to/transparency'
  },
  {
    id: 'superstate',
    name: 'Superstate',
    logo: '🌟',
    tvl: 892000000,
    tvlChange24h: 3.8,
    tvlChange7d: 18.2,
    marketCap: null,
    description: 'USTB - SEC-registered fund investing in US Treasury securities. Institutional grade.',
    assetClass: 'US Treasuries',
    liquidity24h: 65000000,
    volume24h: 98000000,
    revenue30d: 1800000,
    redeemable: 'Yes',
    attestationStatus: 'verified',
    attestationUrl: 'https://superstate.co/attestations',
    cexListed: [],
    dexListed: [],
    secRegistered: true,
    transferable: 'Restricted',
    chains: ['ethereum'],
    website: 'https://superstate.co',
    docs: 'https://docs.superstate.co',
    contractAddress: '0x1234567890ABCDEF1234567890ABCDEF12345678',
    tokenAddress: '0x1234567890ABCDEF1234567890ABCDEF12345678',
    secFilings: 'https://www.sec.gov/cgi-bin/browse-edgar?company=superstate',
    treasuryUrl: 'https://superstate.co/transparency'
  },
  {
    id: 'blackrock-buidl',
    name: 'BlackRock BUIDL',
    logo: '⬛',
    tvl: 523000000,
    tvlChange24h: 5.2,
    tvlChange7d: 22.8,
    marketCap: null,
    description: 'BlackRock USD Institutional Digital Liquidity Fund. Tokenized money market fund.',
    assetClass: 'US Treasuries',
    liquidity24h: 85000000,
    volume24h: 120000000,
    revenue30d: 2200000,
    redeemable: 'Yes',
    attestationStatus: 'verified',
    attestationUrl: 'https://securitize.io/blackrock-buidl',
    cexListed: [],
    dexListed: [],
    secRegistered: true,
    transferable: 'Restricted',
    chains: ['ethereum'],
    website: 'https://securitize.io/blackrock-buidl',
    docs: 'https://securitize.io/docs',
    contractAddress: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
    tokenAddress: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
    secFilings: 'https://www.sec.gov/cgi-bin/browse-edgar?company=blackrock',
    treasuryUrl: null
  },
  {
    id: 'franklin-templeton',
    name: 'Franklin OnChain',
    logo: '🔵',
    tvl: 410000000,
    tvlChange24h: 1.8,
    tvlChange7d: 8.4,
    marketCap: null,
    description: 'Franklin Templeton On-Chain US Government Money Fund (FOBXX). SEC-registered.',
    assetClass: 'US Treasuries',
    liquidity24h: 42000000,
    volume24h: 68000000,
    revenue30d: 1400000,
    redeemable: 'Yes',
    attestationStatus: 'verified',
    attestationUrl: 'https://www.franklintempleton.com/investments/options/money-market-funds/products/702/SINGLCLASS/franklin-on-chain-us-government-money-fund',
    cexListed: [],
    dexListed: [],
    secRegistered: true,
    transferable: 'Restricted',
    chains: ['stellar', 'polygon'],
    website: 'https://www.franklintempleton.com/investments/options/money-market-funds/products/702/SINGLCLASS/franklin-on-chain-us-government-money-fund',
    docs: 'https://www.franklintempleton.com/investor/investments',
    contractAddress: 'GCZXXX...stellar',
    tokenAddress: null,
    secFilings: 'https://www.sec.gov/cgi-bin/browse-edgar?company=franklin+templeton',
    treasuryUrl: 'https://www.franklintempleton.com/investments/options/money-market-funds/products/702/SINGLCLASS/franklin-on-chain-us-government-money-fund'
  }
];

const chainIcons = {
  ethereum: '⟠',
  polygon: '⬡',
  arbitrum: '🔵',
  optimism: '🔴',
  base: '🔷',
  solana: '◎',
  avalanche: '🔺',
  gnosis: '🦉',
  centrifuge: '🌀',
  tron: '⚡',
  stellar: '✦',
  algorand: '◯'
};

const assetClasses = ['All', 'US Treasuries', 'Private Credit', 'Real Estate', 'Commodities', 'Tokenized Securities', 'Mixed RWA', 'Emerging Market Loans'];

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '—';
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return `${value.toFixed(2)}`;
};

const formatPercent = (value) => {
  if (value === null || value === undefined) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const getMcTvlRatio = (marketCap, tvl) => {
  if (!marketCap || !tvl) return null;
  return marketCap / tvl;
};

const getMcTvlColor = (ratio) => {
  if (ratio === null) return 'text-zinc-500';
  if (ratio < 1) return 'text-emerald-400';
  if (ratio <= 2) return 'text-amber-400';
  return 'text-red-400';
};

const AttestationBadge = ({ status }) => {
  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
        <Shield className="w-3 h-3" />
        Verified
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
        <ShieldAlert className="w-3 h-3" />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-700 text-zinc-400 text-xs rounded-full">
      <ShieldX className="w-3 h-3" />
      None
    </span>
  );
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-zinc-700 rounded transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
    </button>
  );
};

const ExpandedRow = ({ protocol }) => {
  const explorerUrl = protocol.chains.includes('ethereum')
    ? `https://etherscan.io/address/${protocol.contractAddress}`
    : protocol.chains.includes('polygon')
    ? `https://polygonscan.com/address/${protocol.contractAddress}`
    : protocol.chains.includes('arbitrum')
    ? `https://arbiscan.io/address/${protocol.contractAddress}`
    : protocol.chains.includes('solana')
    ? `https://solscan.io/account/${protocol.contractAddress}`
    : '#';

  const tokenExplorerUrl = protocol.tokenAddress
    ? protocol.chains.includes('ethereum')
      ? `https://etherscan.io/token/${protocol.tokenAddress}`
      : '#'
    : null;

  return (
    <tr className="bg-zinc-800/50 border-b border-zinc-700">
      <td colSpan="12" className="px-4 py-4">
        <div className="grid grid-cols-3 gap-6">
          {/* Column 1: Description & Details */}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Description</h4>
              <p className="text-sm text-zinc-300">{protocol.description}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Asset Backing</h4>
              <p className="text-sm text-zinc-300">{protocol.assetClass}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Chains</h4>
              <div className="flex gap-1 flex-wrap">
                {protocol.chains.map(chain => (
                  <span key={chain} className="px-2 py-0.5 bg-zinc-700 text-zinc-300 text-xs rounded capitalize">
                    {chainIcons[chain]} {chain}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Contract Info */}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Contract Address</h4>
              <div className="flex items-center gap-2">
                <code className="text-xs text-zinc-300 bg-zinc-900 px-2 py-1 rounded font-mono">
                  {protocol.contractAddress.slice(0, 10)}...{protocol.contractAddress.slice(-8)}
                </code>
                <CopyButton text={protocol.contractAddress} />
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            {protocol.tokenAddress && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Token Address</h4>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-zinc-300 bg-zinc-900 px-2 py-1 rounded font-mono">
                    {protocol.tokenAddress.slice(0, 10)}...{protocol.tokenAddress.slice(-8)}
                  </code>
                  <CopyButton text={protocol.tokenAddress} />
                  {tokenExplorerUrl && (
                    <a href={tokenExplorerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">CEX Listings</h4>
              <p className="text-sm text-zinc-300">
                {protocol.cexListed.length > 0 ? protocol.cexListed.join(', ') : 'None'}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">DEX Listings</h4>
              <p className="text-sm text-zinc-300">
                {protocol.dexListed.length > 0 ? protocol.dexListed.join(', ') : 'None'}
              </p>
            </div>
          </div>

          {/* Column 3: Source Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Source Links</h4>
            <div className="space-y-1.5">
              <a href={protocol.website} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                <ExternalLink className="w-3 h-3" /> Official Website
              </a>
              <a href={protocol.docs} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                <ExternalLink className="w-3 h-3" /> Documentation
              </a>
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                <ExternalLink className="w-3 h-3" /> Block Explorer
              </a>
              {protocol.attestationUrl && (
                <a href={protocol.attestationUrl} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                  <Shield className="w-3 h-3" /> Attestation Reports
                </a>
              )}
              {protocol.secFilings && (
                <a href={protocol.secFilings} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors">
                  <ExternalLink className="w-3 h-3" /> SEC Filings
                </a>
              )}
              {protocol.treasuryUrl && (
                <a href={protocol.treasuryUrl} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  <ExternalLink className="w-3 h-3" /> Treasury / Reserves
                </a>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default function RWADashboard() {
  const [protocols, setProtocols] = useState(mockProtocols);
  const [searchQuery, setSearchQuery] = useState('');
  const [assetFilter, setAssetFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'tvl', direction: 'desc' });
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 1000);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const toggleExpand = (id) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredAndSortedProtocols = useMemo(() => {
    let result = [...protocols];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.assetClass.toLowerCase().includes(query)
      );
    }

    // Filter by asset class
    if (assetFilter !== 'All') {
      result = result.filter(p => p.assetClass === assetFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle MC/TVL ratio specially
      if (sortConfig.key === 'mcTvlRatio') {
        aVal = getMcTvlRatio(a.marketCap, a.tvl);
        bVal = getMcTvlRatio(b.marketCap, b.tvl);
      }

      // Handle null values
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return result;
  }, [protocols, searchQuery, assetFilter, sortConfig]);

  const exportToCSV = () => {
    const headers = ['Name', 'TVL', 'Market Cap', 'MC/TVL', 'Asset Class', '24h Volume', '30d Revenue', 'Redeemable', 'Attestation', 'Website'];
    const rows = filteredAndSortedProtocols.map(p => [
      p.name,
      p.tvl,
      p.marketCap || '',
      getMcTvlRatio(p.marketCap, p.tvl)?.toFixed(2) || '',
      p.assetClass,
      p.volume24h,
      p.revenue30d,
      p.redeemable,
      p.attestationStatus,
      p.website
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rwa-protocols.csv';
    a.click();
  };

  const SortHeader = ({ label, sortKey }) => (
    <th
      className="px-3 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider cursor-pointer hover:bg-zinc-700/50 transition-colors whitespace-nowrap"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortConfig.key === sortKey ? (
          sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 text-zinc-500" />
        )}
      </div>
    </th>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">RWA Research Dashboard</h1>
            <p className="text-sm text-zinc-400 mt-1">Real World Asset Protocol Analysis • {filteredAndSortedProtocols.length} Protocols</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search protocols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-zinc-600 placeholder:text-zinc-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <select
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-zinc-600"
            >
              {assetClasses.map(ac => (
                <option key={ac} value={ac}>{ac}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 sticky top-0">
            <tr>
              <th className="w-8 px-2 py-3"></th>
              <SortHeader label="Protocol" sortKey="name" />
              <SortHeader label="TVL" sortKey="tvl" />
              <th className="px-3 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider whitespace-nowrap">Trend</th>
              <SortHeader label="Market Cap" sortKey="marketCap" />
              <SortHeader label="MC/TVL" sortKey="mcTvlRatio" />
              <SortHeader label="Asset Class" sortKey="assetClass" />
              <SortHeader label="24h Volume" sortKey="volume24h" />
              <SortHeader label="30d Revenue" sortKey="revenue30d" />
              <th className="px-3 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider whitespace-nowrap">Redeemable</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider whitespace-nowrap">Attestation</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider whitespace-nowrap">Chains</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedProtocols.map((protocol, idx) => (
              <React.Fragment key={protocol.id}>
                <tr
                  className={`border-b border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-zinc-900/30' : ''}`}
                  onClick={() => toggleExpand(protocol.id)}
                >
                  <td className="px-2 py-3 text-center">
                    {expandedRows.has(protocol.id) ? (
                      <ChevronUp className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-500" />
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{protocol.logo}</span>
                      <div>
                        <div className="font-medium text-white">{protocol.name}</div>
                        {protocol.secRegistered && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">SEC</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-white">{formatCurrency(protocol.tvl)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      {protocol.tvlChange24h >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      <span className={protocol.tvlChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {formatPercent(protocol.tvlChange24h)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-zinc-300">{formatCurrency(protocol.marketCap)}</td>
                  <td className={`px-3 py-3 font-mono ${getMcTvlColor(getMcTvlRatio(protocol.marketCap, protocol.tvl))}`}>
                    {getMcTvlRatio(protocol.marketCap, protocol.tvl)?.toFixed(2) || '—'}
                  </td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-full whitespace-nowrap">
                      {protocol.assetClass}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-zinc-300">{formatCurrency(protocol.volume24h)}</td>
                  <td className="px-3 py-3 font-mono text-zinc-300">{formatCurrency(protocol.revenue30d)}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs ${
                      protocol.redeemable === 'Yes' ? 'text-emerald-400' :
                      protocol.redeemable === 'No' ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {protocol.redeemable}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <AttestationBadge status={protocol.attestationStatus} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      {protocol.chains.slice(0, 3).map(chain => (
                        <span key={chain} className="text-sm" title={chain}>
                          {chainIcons[chain] || '●'}
                        </span>
                      ))}
                      {protocol.chains.length > 3 && (
                        <span className="text-xs text-zinc-500">+{protocol.chains.length - 3}</span>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedRows.has(protocol.id) && <ExpandedRow protocol={protocol} />}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Legend */}
      <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-4">
          <span>MC/TVL: </span>
          <span className="text-emerald-400">● &lt;1 Undervalued</span>
          <span className="text-amber-400">● 1-2 Fair</span>
          <span className="text-red-400">● &gt;2 Overvalued</span>
        </div>
        <div>
          Click any row to expand details and source links
        </div>
      </div>
    </div>
  );
}
