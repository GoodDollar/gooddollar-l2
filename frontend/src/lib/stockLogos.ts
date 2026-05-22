const STOCK_LOGO_DOMAINS: Record<string, string> = {
  AAPL: 'apple.com',
  TSLA: 'tesla.com',
  NVDA: 'nvidia.com',
  MSFT: 'microsoft.com',
  AMZN: 'amazon.com',
  GOOGL: 'google.com',
  META: 'meta.com',
  JPM: 'jpmorganchase.com',
  V: 'visa.com',
  DIS: 'thewaltdisneycompany.com',
  NFLX: 'netflix.com',
  AMD: 'amd.com',
}

export function getStockLogoUrl(ticker: string): string | null {
  const domain = STOCK_LOGO_DOMAINS[ticker.toUpperCase()]
  return domain ? `https://logo.clearbit.com/${domain}` : null
}
