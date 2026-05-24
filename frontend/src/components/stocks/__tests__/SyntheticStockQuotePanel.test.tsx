/**
 * Task 0025: SyntheticStockQuotePanel replaces the fabricated bid/ask
 * ladder. Shape A shows an oracle mark + AMM slippage table (+ supply
 * when available). Shape B shows an empty-state explanatory card when
 * the oracle has no mark.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const useSyntheticTokenSupplyMock = vi.fn()

vi.mock('@/lib/useSyntheticTokenSupply', () => ({
  useSyntheticTokenSupply: () => useSyntheticTokenSupplyMock(),
}))

import { SyntheticStockQuotePanel } from '@/components/stocks/SyntheticStockQuotePanel'

describe('SyntheticStockQuotePanel — task 0025', () => {
  beforeEach(() => {
    useSyntheticTokenSupplyMock.mockReset()
  })

  it('Shape A: renders Quote heading, oracle mark, three slippage rows, supply, no fake CLOB', () => {
    useSyntheticTokenSupplyMock.mockReturnValue({ supply: 12_453, tokenAddress: '0xabc' })

    render(<SyntheticStockQuotePanel ticker="AAPL" markPrice={218.27} source="chain-oracle" />)

    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Quote')
    expect(screen.queryByText('Order Book')).toBeNull()
    expect(screen.getByText('Oracle mark').nextElementSibling?.textContent).toContain('218.27')

    const slippageRows = screen.getByTestId('synthetic-stock-slippage-rows')
    const items = slippageRows.querySelectorAll('li')
    expect(items).toHaveLength(3)
    expect(items[0].textContent).toMatch(/\$100/)
    expect(items[1].textContent).toMatch(/\$1,000/)
    expect(items[2].textContent).toMatch(/\$10,000/)
    items.forEach((li) => {
      expect(li.textContent).toMatch(/%/)
    })

    expect(screen.getByTestId('synthetic-stock-supply').textContent).toBe('12,453 sAAPL')

    const panel = screen.getByTestId('synthetic-stock-quote-panel')
    expect(panel.textContent ?? '').not.toMatch(/Spread \$0\.0/)
    expect(panel.textContent ?? '').not.toMatch(/(\$\d{2,3}\.\d{2,4}\s+\d){6}/)
  })

  it('Shape A: still renders without the supply row when on-chain supply is unavailable', () => {
    useSyntheticTokenSupplyMock.mockReturnValue({ supply: null, tokenAddress: null })

    render(<SyntheticStockQuotePanel ticker="AAPL" markPrice={218.27} source="chain-oracle" />)

    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Quote')
    expect(screen.queryByTestId('synthetic-stock-supply')).toBeNull()
    const slippageRows = screen.getByTestId('synthetic-stock-slippage-rows')
    expect(slippageRows.querySelectorAll('li')).toHaveLength(3)
  })

  it('Shape B: empty-state copy explains why there is no order book when markPrice is 0', () => {
    useSyntheticTokenSupplyMock.mockReturnValue({ supply: null, tokenAddress: null })

    render(<SyntheticStockQuotePanel ticker="AAPL" markPrice={0} source="unknown" />)

    const panel = screen.getByTestId('synthetic-stock-quote-panel')
    expect(panel.textContent).toMatch(/No central order book/i)
    expect(panel.textContent).toMatch(/oracle-priced/i)
    expect(panel.textContent).toMatch(/AMM/i)
    expect(panel.textContent ?? '').not.toMatch(/Spread \$/)
    expect(screen.queryByTestId('synthetic-stock-slippage-rows')).toBeNull()
    expect(screen.getByRole('link', { name: /Learn how synthetic stocks settle/i })).toBeTruthy()
  })

  it('source badge reflects the attribution prop (chain-oracle vs fallback vs closed)', () => {
    useSyntheticTokenSupplyMock.mockReturnValue({ supply: 100, tokenAddress: '0xabc' })

    const { rerender } = render(
      <SyntheticStockQuotePanel ticker="AAPL" markPrice={100} source="chain-oracle" />,
    )
    expect(screen.getByTestId('price-source-badge').getAttribute('data-source')).toBe('chain-oracle')

    rerender(<SyntheticStockQuotePanel ticker="AAPL" markPrice={100} source="fallback" />)
    expect(screen.getByTestId('price-source-badge').getAttribute('data-source')).toBe('fallback')

    rerender(<SyntheticStockQuotePanel ticker="AAPL" markPrice={100} source="closed" />)
    expect(screen.getByTestId('price-source-badge').getAttribute('data-source')).toBe('closed')
  })

  it('renders no fabricated bid/ask ladder fingerprint (six consecutive price-size rows)', () => {
    useSyntheticTokenSupplyMock.mockReturnValue({ supply: 12_453, tokenAddress: '0xabc' })

    render(<SyntheticStockQuotePanel ticker="AAPL" markPrice={193} source="chain-oracle" />)
    const panel = screen.getByTestId('synthetic-stock-quote-panel')
    const text = panel.textContent ?? ''
    // The old fake CLOB rendered six price/size pairs vertically. The
    // new panel must never match that fingerprint, in either shape.
    expect(text).not.toMatch(/(\$\d+\.\d{2,4}\s+\d){6}/)
  })
})
