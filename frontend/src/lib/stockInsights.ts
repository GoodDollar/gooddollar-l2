export interface AnalystOutlook {
  consensus: 'Bullish' | 'Neutral' | 'Bearish'
  targetLow: number
  targetMean: number
  targetHigh: number
  asOf: string
}

export interface StockNewsItem {
  id: string
  ticker: string
  headline: string
  source: string
  publishedAt: string
  tag: 'Earnings' | 'Guidance' | 'Macro' | 'Product'
  url: string
}

const ANALYST_OUTLOOK_BY_TICKER: Record<string, AnalystOutlook> = {
  AAPL: { consensus: 'Bullish', targetLow: 196, targetMean: 224, targetHigh: 248, asOf: 'May 2026' },
  MSFT: { consensus: 'Bullish', targetLow: 418, targetMean: 451, targetHigh: 486, asOf: 'May 2026' },
  NVDA: { consensus: 'Bullish', targetLow: 98, targetMean: 117, targetHigh: 138, asOf: 'May 2026' },
  AMZN: { consensus: 'Bullish', targetLow: 176, targetMean: 204, targetHigh: 226, asOf: 'May 2026' },
  GOOGL: { consensus: 'Bullish', targetLow: 154, targetMean: 176, targetHigh: 198, asOf: 'May 2026' },
  META: { consensus: 'Neutral', targetLow: 545, targetMean: 588, targetHigh: 633, asOf: 'May 2026' },
  TSLA: { consensus: 'Neutral', targetLow: 231, targetMean: 278, targetHigh: 338, asOf: 'May 2026' },
  AMD: { consensus: 'Neutral', targetLow: 92, targetMean: 110, targetHigh: 136, asOf: 'May 2026' },
}

export function getAnalystOutlook(ticker: string): AnalystOutlook | null {
  return ANALYST_OUTLOOK_BY_TICKER[ticker] ?? null
}

export function calcUpsidePercent(currentPrice: number, targetMean: number): number {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return 0
  return ((targetMean - currentPrice) / currentPrice) * 100
}

const NEWS_BY_TICKER: Record<string, StockNewsItem[]> = {
  AAPL: [
    {
      id: 'aapl-earnings-refresh',
      ticker: 'AAPL',
      headline: 'Apple supply-chain update improves near-term iPhone shipment outlook',
      source: 'Market Wire',
      publishedAt: '2026-05-18T15:30:00Z',
      tag: 'Guidance',
      url: 'https://example.com/news/aapl-guidance',
    },
    {
      id: 'aapl-ai-suite',
      ticker: 'AAPL',
      headline: 'Apple expands on-device AI suite ahead of developer conference',
      source: 'Tech Ledger',
      publishedAt: '2026-05-17T10:15:00Z',
      tag: 'Product',
      url: 'https://example.com/news/aapl-ai-suite',
    },
    {
      id: 'aapl-services-rev',
      ticker: 'AAPL',
      headline: 'Services revenue tops $26B as App Store growth accelerates',
      source: 'Earnings Desk',
      publishedAt: '2026-05-15T08:20:00Z',
      tag: 'Earnings',
      url: 'https://example.com/news/aapl-services-rev',
    },
  ],
  MSFT: [
    {
      id: 'msft-cloud-demand',
      ticker: 'MSFT',
      headline: 'Azure enterprise demand remains strong in new channel checks',
      source: 'Street Brief',
      publishedAt: '2026-05-19T09:40:00Z',
      tag: 'Guidance',
      url: 'https://example.com/news/msft-azure-demand',
    },
    {
      id: 'msft-earnings-watch',
      ticker: 'MSFT',
      headline: 'Analysts raise earnings expectations for next quarter',
      source: 'Earnings Desk',
      publishedAt: '2026-05-16T20:05:00Z',
      tag: 'Earnings',
      url: 'https://example.com/news/msft-earnings-watch',
    },
    {
      id: 'msft-copilot-enterprise',
      ticker: 'MSFT',
      headline: 'Copilot enterprise adoption doubles as AI features ship across Office',
      source: 'Tech Ledger',
      publishedAt: '2026-05-14T11:30:00Z',
      tag: 'Product',
      url: 'https://example.com/news/msft-copilot',
    },
  ],
  NVDA: [
    {
      id: 'nvda-dc-capex',
      ticker: 'NVDA',
      headline: 'Hyperscaler capex plans point to sustained accelerator demand',
      source: 'Data Center Journal',
      publishedAt: '2026-05-18T13:05:00Z',
      tag: 'Macro',
      url: 'https://example.com/news/nvda-capex-demand',
    },
    {
      id: 'nvda-blackwell-ramp',
      ticker: 'NVDA',
      headline: 'Blackwell GPU production ramps faster than initially projected',
      source: 'Street Brief',
      publishedAt: '2026-05-16T09:10:00Z',
      tag: 'Product',
      url: 'https://example.com/news/nvda-blackwell',
    },
    {
      id: 'nvda-q1-beat',
      ticker: 'NVDA',
      headline: 'NVIDIA posts record Q1 revenue, data center segment up 150% YoY',
      source: 'Earnings Desk',
      publishedAt: '2026-05-14T16:05:00Z',
      tag: 'Earnings',
      url: 'https://example.com/news/nvda-q1-beat',
    },
  ],
  AMZN: [
    {
      id: 'amzn-aws-reinvent',
      ticker: 'AMZN',
      headline: 'AWS launches next-gen custom chips targeting AI inference workloads',
      source: 'Data Center Journal',
      publishedAt: '2026-05-19T14:20:00Z',
      tag: 'Product',
      url: 'https://example.com/news/amzn-aws-chips',
    },
    {
      id: 'amzn-prime-day',
      ticker: 'AMZN',
      headline: 'Prime membership hits record high ahead of summer sales event',
      source: 'Market Wire',
      publishedAt: '2026-05-17T07:45:00Z',
      tag: 'Guidance',
      url: 'https://example.com/news/amzn-prime-day',
    },
    {
      id: 'amzn-margins',
      ticker: 'AMZN',
      headline: 'Operating margins expand as fulfillment automation reduces costs',
      source: 'Earnings Desk',
      publishedAt: '2026-05-15T18:30:00Z',
      tag: 'Earnings',
      url: 'https://example.com/news/amzn-margins',
    },
  ],
  GOOGL: [
    {
      id: 'googl-gemini-update',
      ticker: 'GOOGL',
      headline: 'Google rolls out Gemini 2.5 across Search and Workspace products',
      source: 'Tech Ledger',
      publishedAt: '2026-05-19T10:00:00Z',
      tag: 'Product',
      url: 'https://example.com/news/googl-gemini',
    },
    {
      id: 'googl-cloud-growth',
      ticker: 'GOOGL',
      headline: 'Google Cloud crosses $40B annual run rate, narrows gap with Azure',
      source: 'Street Brief',
      publishedAt: '2026-05-17T14:15:00Z',
      tag: 'Earnings',
      url: 'https://example.com/news/googl-cloud-growth',
    },
    {
      id: 'googl-ad-rebound',
      ticker: 'GOOGL',
      headline: 'Digital ad spending rebounds as retail and travel sectors increase budgets',
      source: 'Market Wire',
      publishedAt: '2026-05-15T09:50:00Z',
      tag: 'Macro',
      url: 'https://example.com/news/googl-ad-rebound',
    },
  ],
  META: [
    {
      id: 'meta-threads-growth',
      ticker: 'META',
      headline: 'Threads reaches 300M monthly active users, ad rollout begins',
      source: 'Tech Ledger',
      publishedAt: '2026-05-18T08:30:00Z',
      tag: 'Product',
      url: 'https://example.com/news/meta-threads',
    },
    {
      id: 'meta-reality-labs',
      ticker: 'META',
      headline: 'Reality Labs narrows quarterly losses as Quest headset sales surge',
      source: 'Earnings Desk',
      publishedAt: '2026-05-16T15:40:00Z',
      tag: 'Earnings',
      url: 'https://example.com/news/meta-reality-labs',
    },
    {
      id: 'meta-ai-infra',
      ticker: 'META',
      headline: 'Meta commits $18B to AI infrastructure buildout through 2027',
      source: 'Data Center Journal',
      publishedAt: '2026-05-14T12:20:00Z',
      tag: 'Macro',
      url: 'https://example.com/news/meta-ai-infra',
    },
  ],
  TSLA: [
    {
      id: 'tsla-robotaxi-launch',
      ticker: 'TSLA',
      headline: 'Tesla begins supervised robotaxi operations in Austin and San Jose',
      source: 'Market Wire',
      publishedAt: '2026-05-19T16:00:00Z',
      tag: 'Product',
      url: 'https://example.com/news/tsla-robotaxi',
    },
    {
      id: 'tsla-deliveries',
      ticker: 'TSLA',
      headline: 'Q2 delivery guidance revised higher on Model Y refresh demand',
      source: 'Street Brief',
      publishedAt: '2026-05-17T11:30:00Z',
      tag: 'Guidance',
      url: 'https://example.com/news/tsla-deliveries',
    },
    {
      id: 'tsla-energy-record',
      ticker: 'TSLA',
      headline: 'Energy storage deployments set quarterly record at 12.4 GWh',
      source: 'Earnings Desk',
      publishedAt: '2026-05-15T14:50:00Z',
      tag: 'Earnings',
      url: 'https://example.com/news/tsla-energy-record',
    },
  ],
  AMD: [
    {
      id: 'amd-mi400-preview',
      ticker: 'AMD',
      headline: 'AMD previews MI400 accelerator targeting data center AI training',
      source: 'Data Center Journal',
      publishedAt: '2026-05-18T10:45:00Z',
      tag: 'Product',
      url: 'https://example.com/news/amd-mi400',
    },
    {
      id: 'amd-server-share',
      ticker: 'AMD',
      headline: 'EPYC server CPU market share gains continue in latest Mercury data',
      source: 'Street Brief',
      publishedAt: '2026-05-16T13:20:00Z',
      tag: 'Macro',
      url: 'https://example.com/news/amd-server-share',
    },
    {
      id: 'amd-guidance-raise',
      ticker: 'AMD',
      headline: 'AMD lifts full-year revenue guidance on data center strength',
      source: 'Earnings Desk',
      publishedAt: '2026-05-14T19:00:00Z',
      tag: 'Guidance',
      url: 'https://example.com/news/amd-guidance',
    },
  ],
  NFLX: [
    {
      id: 'nflx-ads-tier',
      ticker: 'NFLX',
      headline: 'Ad-supported tier surpasses 70M subscribers globally',
      source: 'Market Wire',
      publishedAt: '2026-05-18T12:00:00Z',
      tag: 'Earnings',
      url: 'https://example.com/news/nflx-ads-tier',
    },
    {
      id: 'nflx-live-sports',
      ticker: 'NFLX',
      headline: 'Netflix secures multi-year NFL package starting 2027 season',
      source: 'Tech Ledger',
      publishedAt: '2026-05-16T08:30:00Z',
      tag: 'Product',
      url: 'https://example.com/news/nflx-live-sports',
    },
    {
      id: 'nflx-content-spend',
      ticker: 'NFLX',
      headline: 'Content spending efficiency improves as licensed titles drive engagement',
      source: 'Street Brief',
      publishedAt: '2026-05-14T15:10:00Z',
      tag: 'Guidance',
      url: 'https://example.com/news/nflx-content-spend',
    },
  ],
  COIN: [
    {
      id: 'coin-base-layer',
      ticker: 'COIN',
      headline: 'Base L2 transaction volume overtakes Arbitrum for first time',
      source: 'Data Center Journal',
      publishedAt: '2026-05-19T07:15:00Z',
      tag: 'Product',
      url: 'https://example.com/news/coin-base-layer',
    },
    {
      id: 'coin-custody-growth',
      ticker: 'COIN',
      headline: 'Institutional custody AUM crosses $300B as ETF demand persists',
      source: 'Market Wire',
      publishedAt: '2026-05-17T13:40:00Z',
      tag: 'Earnings',
      url: 'https://example.com/news/coin-custody',
    },
    {
      id: 'coin-regulation',
      ticker: 'COIN',
      headline: 'Senate passes stablecoin framework bill, removing regulatory overhang',
      source: 'Street Brief',
      publishedAt: '2026-05-15T20:30:00Z',
      tag: 'Macro',
      url: 'https://example.com/news/coin-regulation',
    },
  ],
  JPM: [
    {
      id: 'jpm-trading-rev',
      ticker: 'JPM',
      headline: 'Fixed income trading revenue beats estimates on rate volatility',
      source: 'Earnings Desk',
      publishedAt: '2026-05-18T06:50:00Z',
      tag: 'Earnings',
      url: 'https://example.com/news/jpm-trading',
    },
    {
      id: 'jpm-ai-fraud',
      ticker: 'JPM',
      headline: 'JPMorgan deploys AI-powered fraud detection across consumer banking',
      source: 'Tech Ledger',
      publishedAt: '2026-05-16T10:15:00Z',
      tag: 'Product',
      url: 'https://example.com/news/jpm-ai-fraud',
    },
    {
      id: 'jpm-rate-outlook',
      ticker: 'JPM',
      headline: 'Dimon warns extended rates could slow lending growth into H2',
      source: 'Market Wire',
      publishedAt: '2026-05-14T08:00:00Z',
      tag: 'Macro',
      url: 'https://example.com/news/jpm-rate-outlook',
    },
  ],
  V: [
    {
      id: 'v-cross-border',
      ticker: 'V',
      headline: 'Cross-border transaction volumes up 18% as travel spending normalizes',
      source: 'Market Wire',
      publishedAt: '2026-05-18T09:30:00Z',
      tag: 'Earnings',
      url: 'https://example.com/news/v-cross-border',
    },
    {
      id: 'v-tokenization',
      ticker: 'V',
      headline: 'Visa expands tokenization network to support real-time B2B payments',
      source: 'Tech Ledger',
      publishedAt: '2026-05-16T14:45:00Z',
      tag: 'Product',
      url: 'https://example.com/news/v-tokenization',
    },
    {
      id: 'v-fintech-partner',
      ticker: 'V',
      headline: 'New fintech partnerships accelerate embedded finance adoption',
      source: 'Street Brief',
      publishedAt: '2026-05-14T11:20:00Z',
      tag: 'Guidance',
      url: 'https://example.com/news/v-fintech',
    },
  ],
  DIS: [
    {
      id: 'dis-streaming-profit',
      ticker: 'DIS',
      headline: 'Disney+ reaches sustained profitability ahead of schedule',
      source: 'Earnings Desk',
      publishedAt: '2026-05-18T16:20:00Z',
      tag: 'Earnings',
      url: 'https://example.com/news/dis-streaming-profit',
    },
    {
      id: 'dis-parks-expansion',
      ticker: 'DIS',
      headline: 'Parks division announces $8B expansion plan across three continents',
      source: 'Market Wire',
      publishedAt: '2026-05-16T07:00:00Z',
      tag: 'Guidance',
      url: 'https://example.com/news/dis-parks',
    },
    {
      id: 'dis-box-office',
      ticker: 'DIS',
      headline: 'Summer film slate on track for strongest box office since 2019',
      source: 'Tech Ledger',
      publishedAt: '2026-05-14T13:40:00Z',
      tag: 'Product',
      url: 'https://example.com/news/dis-box-office',
    },
  ],
}

export function getStockNews(ticker: string): StockNewsItem[] {
  return NEWS_BY_TICKER[ticker] ?? []
}
