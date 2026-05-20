import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { WatchlistStarButton } from '@/components/stocks/WatchlistStarButton'
import {
  addToWatchlist,
  removeFromWatchlist,
} from '@/lib/watchlist'

describe('WatchlistStarButton — task 0034', () => {
  beforeEach(() => {
    localStorage.clear()
    for (const t of ['AAPL', 'NVDA', 'TSLA']) {
      removeFromWatchlist(t)
    }
  })

  it('renders an unwatched star with an Add label by default', () => {
    render(<WatchlistStarButton ticker="AAPL" />)
    const button = screen.getByRole('button', { name: /add aapl to watchlist/i })
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders a watched star with a Remove label when ticker is already saved', () => {
    addToWatchlist('NVDA')
    render(<WatchlistStarButton ticker="NVDA" />)
    const button = screen.getByRole('button', {
      name: /remove nvda from watchlist/i,
    })
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('toggles the watchlist on click', async () => {
    const user = userEvent.setup()
    render(<WatchlistStarButton ticker="TSLA" />)
    const button = screen.getByRole('button', { name: /add tsla to watchlist/i })
    await user.click(button)
    expect(
      screen.getByRole('button', { name: /remove tsla from watchlist/i }),
    ).toHaveAttribute('aria-pressed', 'true')
    await user.click(
      screen.getByRole('button', { name: /remove tsla from watchlist/i }),
    )
    expect(
      screen.getByRole('button', { name: /add tsla to watchlist/i }),
    ).toHaveAttribute('aria-pressed', 'false')
  })

  it('does not propagate click events to ancestor handlers (so list rows stay clickable separately)', async () => {
    const user = userEvent.setup()
    let parentClicks = 0
    render(
      <button onClick={() => (parentClicks += 1)} type="button">
        <WatchlistStarButton ticker="AAPL" />
      </button>,
    )
    await user.click(
      screen.getByRole('button', { name: /add aapl to watchlist/i }),
    )
    expect(parentClicks).toBe(0)
  })
})
