import { Command } from 'commander';
import { JsonRpcProvider } from 'ethers';
import { loadConfig } from './config.js';
import { checkGoodChain } from './core/health.js';
import { loadMarketFile } from './core/market-loader.js';
import { OpportunityEngine } from './core/opportunity-engine.js';
import { Executor } from './exec/executor.js';
import { GenericRestVenue } from './adapters/generic-rest.js';
import { GenericEvmVenue } from './adapters/generic-evm.js';
import type { VenueAdapter } from './adapters/venue.js';
import { log } from './util/logger.js';

const program = new Command();
program
  .name('goodclaw-arb-bot')
  .description('Generic dry-run-first arbitrage bot scaffold for GoodChain spot/perp/prediction venues')
  .option('--once', 'run one scan and exit', false)
  .option('--health-only', 'check RPC/status and exit', false)
  .parse();

const opts = program.opts<{ once: boolean; healthOnly: boolean }>();
const cfg = loadConfig();
const provider = new JsonRpcProvider(cfg.GOODCHAIN_RPC_URL, cfg.GOODCHAIN_CHAIN_ID);

async function buildVenues(): Promise<VenueAdapter[]> {
  const { venues } = loadMarketFile(cfg.MARKETS_FILE);
  return venues.filter(v => v.enabled).map(v => {
    if (v.rest?.quotesUrl) return new GenericRestVenue(v);
    return new GenericEvmVenue(v, provider);
  });
}

async function scanOnce(venues: VenueAdapter[], engine: OpportunityEngine, executor: Executor) {
  const quoteSets = await Promise.allSettled(venues.map(async v => ({ venue: v.id, healthy: await v.healthy(), quotes: await v.quotes() })));
  const quotes = quoteSets.flatMap(r => {
    if (r.status === 'rejected') {
      log.warn({ err: r.reason }, 'venue quote fetch failed');
      return [];
    }
    log.info({ venue: r.value.venue, healthy: r.value.healthy, quotes: r.value.quotes.length }, 'venue scanned');
    return r.value.quotes;
  });
  const opps = engine.find(quotes);
  log.info({ quotes: quotes.length, opportunities: opps.length }, 'scan complete');
  for (const opp of opps.slice(0, 3)) {
    log.info({ id: opp.id, kind: opp.kind, profitUsd: opp.expectedProfitUsd, profitBps: opp.expectedProfitBps, desc: opp.description, risks: opp.risks }, 'candidate opportunity');
    await executor.execute(opp);
  }
}

async function main() {
  const health = await checkGoodChain(provider, cfg.GOODCHAIN_CHAIN_ID, cfg.GOODCHAIN_STATUS_URL);
  log.info(health, 'goodclaw health');
  if (!health.chainOk) throw new Error(`wrong chain id: got ${health.chainId}, expected ${cfg.GOODCHAIN_CHAIN_ID}`);
  if (opts.healthOnly) return;

  const venues = await buildVenues();
  log.info({ dryRun: cfg.DRY_RUN, venues: venues.map(v => `${v.id}:${v.type}`), pollMs: cfg.POLL_INTERVAL_MS }, 'bot started');
  const engine = new OpportunityEngine({ maxTradeUsd: cfg.MAX_TRADE_USD, minProfitUsd: cfg.MIN_PROFIT_USD, minProfitBps: cfg.MIN_PROFIT_BPS, maxSlippageBps: cfg.MAX_SLIPPAGE_BPS });
  const executor = new Executor(cfg, provider);

  do {
    await scanOnce(venues, engine, executor);
    if (opts.once) break;
    await new Promise(resolve => setTimeout(resolve, cfg.POLL_INTERVAL_MS));
  } while (true);
}

main().catch(err => {
  log.error({ err }, 'fatal');
  process.exitCode = 1;
});
