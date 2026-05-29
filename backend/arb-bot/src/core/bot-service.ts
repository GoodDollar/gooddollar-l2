import { JsonRpcProvider } from 'ethers';
import type { BotConfig } from '../config.js';
import { checkGoodChain } from './health.js';
import { loadMarketFile } from './market-loader.js';
import { OpportunityEngine } from './opportunity-engine.js';
import { Executor } from '../exec/executor.js';
import { GenericRestVenue } from '../adapters/generic-rest.js';
import { GenericEvmVenue } from '../adapters/generic-evm.js';
import type { VenueAdapter } from '../adapters/venue.js';
import type { MarketQuote, Opportunity, ExecutionResult } from './types.js';
import { log } from '../util/logger.js';

export interface BotSnapshot {
  running: boolean;
  dryRun: boolean;
  lastHealth?: unknown;
  lastScanAt?: string;
  venues: string[];
  quotes: MarketQuote[];
  opportunities: Opportunity[];
  executions: ExecutionResult[];
  errors: string[];
}

export class BotService {
  private provider: JsonRpcProvider;
  private venues: VenueAdapter[] = [];
  private engine: OpportunityEngine;
  private executor: Executor;
  private timer: NodeJS.Timeout | undefined;
  private snapshot: BotSnapshot;

  constructor(private cfg: BotConfig) {
    this.provider = new JsonRpcProvider(cfg.GOODCHAIN_RPC_URL, cfg.GOODCHAIN_CHAIN_ID);
    this.engine = new OpportunityEngine({
      maxTradeUsd: cfg.MAX_TRADE_USD,
      minProfitUsd: cfg.MIN_PROFIT_USD,
      minProfitBps: cfg.MIN_PROFIT_BPS,
      maxSlippageBps: cfg.MAX_SLIPPAGE_BPS,
    });
    this.executor = new Executor(cfg, this.provider);
    this.snapshot = { running: false, dryRun: cfg.DRY_RUN, venues: [], quotes: [], opportunities: [], executions: [], errors: [] };
  }

  async init() {
    await this.reloadVenues();
    await this.health();
  }

  async reloadVenues() {
    const { venues } = loadMarketFile(this.cfg.MARKETS_FILE);
    this.venues = venues.filter(v => v.enabled).map(v => v.rest?.quotesUrl ? new GenericRestVenue(v) : new GenericEvmVenue(v, this.provider));
    this.snapshot.venues = this.venues.map(v => `${v.id}:${v.type}`);
  }

  async health() {
    const h = await checkGoodChain(this.provider, this.cfg.GOODCHAIN_CHAIN_ID, this.cfg.GOODCHAIN_STATUS_URL);
    this.snapshot.lastHealth = h;
    return h;
  }

  async scan() {
    this.snapshot.errors = [];
    const quoteSets = await Promise.allSettled(this.venues.map(async v => ({ venue: v.id, healthy: await v.healthy(), quotes: await v.quotes() })));
    const quotes = quoteSets.flatMap(r => {
      if (r.status === 'rejected') {
        const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
        this.snapshot.errors.push(msg);
        log.warn({ err: r.reason }, 'venue scan failed');
        return [];
      }
      return r.value.quotes;
    });
    const opportunities = this.engine.find(quotes);
    this.snapshot.quotes = quotes;
    this.snapshot.opportunities = opportunities;
    this.snapshot.lastScanAt = new Date().toISOString();
    return { quotes, opportunities };
  }

  async execute(opportunityId: string) {
    const opp = this.snapshot.opportunities.find(o => o.id === opportunityId);
    if (!opp) throw new Error(`opportunity not found: ${opportunityId}`);
    const result = await this.executor.execute(opp);
    this.snapshot.executions.unshift(result);
    this.snapshot.executions = this.snapshot.executions.slice(0, 50);
    return result;
  }

  start() {
    if (this.timer) return;
    this.snapshot.running = true;
    const loop = async () => {
      try { await this.health(); await this.scan(); }
      catch (e) { this.snapshot.errors.push(e instanceof Error ? e.message : String(e)); }
    };
    void loop();
    this.timer = setInterval(loop, this.cfg.POLL_INTERVAL_MS);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.snapshot.running = false;
  }

  getSnapshot(): BotSnapshot {
    return this.snapshot;
  }
}
