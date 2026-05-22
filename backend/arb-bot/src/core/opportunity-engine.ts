import crypto from 'node:crypto';
import type { ExecutionLeg, MarketQuote, Opportunity } from './types.js';

export interface RiskLimits {
  maxTradeUsd: number;
  minProfitUsd: number;
  minProfitBps: number;
  maxSlippageBps: number;
}

export class OpportunityEngine {
  constructor(private limits: RiskLimits) {}

  find(quotes: MarketQuote[]): Opportunity[] {
    return [
      ...this.findCrossVenueSpotArb(quotes),
      ...this.findPredictionBaskets(quotes),
      ...this.findSpotPerpBasis(quotes),
    ].sort((a, b) => b.expectedProfitUsd - a.expectedProfitUsd);
  }

  private findCrossVenueSpotArb(quotes: MarketQuote[]): Opportunity[] {
    const buys = quotes.filter(q => q.venueType === 'spot' && q.side === 'buy');
    const sells = quotes.filter(q => q.venueType === 'spot' && q.side === 'sell');
    const out: Opportunity[] = [];
    for (const buy of buys) for (const sell of sells) {
      if (buy.venueId === sell.venueId || buy.base !== sell.base || buy.quote !== sell.quote) continue;
      const size = Math.min(buy.size, sell.size, this.limits.maxTradeUsd / buy.price);
      if (size <= 0) continue;
      const gross = (sell.price - buy.price) * size;
      const fees = ((buy.feeBps ?? 0) * buy.price * size + (sell.feeBps ?? 0) * sell.price * size) / 10_000;
      const profit = gross - fees;
      const notional = buy.price * size;
      const bps = notional > 0 ? (profit / notional) * 10_000 : 0;
      if (profit < this.limits.minProfitUsd || bps < this.limits.minProfitBps) continue;
      out.push(this.opp('spot-spot', `Buy ${buy.base} on ${buy.venueId}, sell on ${sell.venueId}`, notional, profit, bps, [
        this.leg(buy, size), this.leg(sell, size),
      ], ['atomicity', 'slippage', 'inventory imbalance']));
    }
    return out;
  }

  private findSpotPerpBasis(quotes: MarketQuote[]): Opportunity[] {
    const spotBuys = quotes.filter(q => q.venueType === 'spot' && q.side === 'buy');
    const perpSells = quotes.filter(q => q.venueType === 'perp' && q.side === 'sell');
    const out: Opportunity[] = [];
    for (const spot of spotBuys) for (const perp of perpSells) {
      if (spot.base !== perp.base || spot.quote !== perp.quote) continue;
      const size = Math.min(spot.size, perp.size, this.limits.maxTradeUsd / spot.price);
      const basis = perp.price - spot.price;
      const profit = basis * size;
      const notional = spot.price * size;
      const bps = notional > 0 ? (profit / notional) * 10_000 : 0;
      if (profit < this.limits.minProfitUsd || bps < this.limits.minProfitBps) continue;
      out.push(this.opp('spot-perp-basis', `Long spot ${spot.base}, short perp on ${perp.venueId}`, notional, profit, bps, [
        this.leg(spot, size), this.leg(perp, size),
      ], ['funding-rate drift', 'oracle/index risk', 'liquidation risk', 'non-atomic execution']));
    }
    return out;
  }

  private findPredictionBaskets(quotes: MarketQuote[]): Opportunity[] {
    // Generic binary-market basket: YES ask + NO ask < 1, or YES bid + NO bid > 1.
    // Requires adapters to emit base symbols like MARKET:YES and MARKET:NO quoted in USD/USDC.
    const byMarket = new Map<string, MarketQuote[]>();
    for (const q of quotes.filter(q => q.venueType === 'prediction')) {
      const root = q.base.replace(/:(YES|NO)$/i, '');
      byMarket.set(root, [...(byMarket.get(root) ?? []), q]);
    }
    const out: Opportunity[] = [];
    for (const [root, qs] of byMarket) {
      const yesAsk = qs.find(q => /:YES$/i.test(q.base) && q.side === 'buy');
      const noAsk = qs.find(q => /:NO$/i.test(q.base) && q.side === 'buy');
      if (!yesAsk || !noAsk) continue;
      const cost = yesAsk.price + noAsk.price;
      const edge = 1 - cost;
      const size = Math.min(yesAsk.size, noAsk.size, this.limits.maxTradeUsd / Math.max(cost, 0.0001));
      const profit = edge * size;
      const notional = cost * size;
      const bps = notional > 0 ? (profit / notional) * 10_000 : 0;
      if (profit < this.limits.minProfitUsd || bps < this.limits.minProfitBps) continue;
      out.push(this.opp('prediction-basket', `Buy complete YES/NO basket for ${root} below $1`, notional, profit, bps, [
        this.leg(yesAsk, size), this.leg(noAsk, size),
      ], ['resolution rules', 'market invalidation', 'liquidity withdrawal', 'settlement delay']));
    }
    return out;
  }

  private leg(q: MarketQuote, size: number): ExecutionLeg {
    return { venueId: q.venueId, venueType: q.venueType, marketId: q.marketId, side: q.side, base: q.base, quote: q.quote, size, expectedPrice: q.price, maxSlippageBps: this.limits.maxSlippageBps, raw: q.raw };
  }

  private opp(kind: Opportunity['kind'], description: string, notionalUsd: number, profitUsd: number, profitBps: number, legs: ExecutionLeg[], risks: string[]): Opportunity {
    const id = crypto.createHash('sha256').update(JSON.stringify({ kind, description, legs, t: Math.floor(Date.now() / 10_000) })).digest('hex').slice(0, 16);
    return { id, kind, description, legs, notionalUsd, expectedProfitUsd: profitUsd, expectedProfitBps: profitBps, risks, createdAt: Date.now() };
  }
}
