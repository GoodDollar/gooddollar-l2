#!/usr/bin/env node

import { ethers } from 'ethers';
import { DeltaCalculator } from './delta-calculator';
import { ExposureReader } from './exposure-reader';
import { HedgeExecutor, EtoroAdapter } from './hedge-executor';
import { HedgeEngine } from './engine';
import { HedgeProofRecorder } from './hedge-proof';
import { HedgeEngineConfig } from './types';

interface CliArgs {
  symbol: string;
  mode: 'dry-run' | 'demo-trade';
}

function parseArgs(argv: string[]): CliArgs {
  let mode: CliArgs['mode'] = 'dry-run';
  let symbol = process.env.HEDGE_DEMO_SYMBOL ?? 'AAPL';
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') mode = 'dry-run';
    else if (arg === '--demo-trade') mode = 'demo-trade';
    else if (arg === '--symbol' && argv[i + 1]) {
      symbol = argv[++i];
    }
  }
  return { symbol, mode };
}

function buildConfig(): HedgeEngineConfig {
  return {
    rpcUrl: process.env.RPC_URL ?? 'http://127.0.0.1:8545',
    riskEngineAddress: process.env.RISK_ENGINE_ADDRESS ?? '',
    symbols: (process.env.HEDGE_SYMBOLS ?? 'AAPL,TSLA,NVDA').split(',').map((s) => s.trim()).filter(Boolean),
    deltaThresholdUsd: Number(process.env.HEDGE_DELTA_THRESHOLD_USD ?? '5000'),
    deltaThresholdPct: Number(process.env.HEDGE_DELTA_THRESHOLD_PCT ?? '2'),
    pollIntervalMs: Number(process.env.HEDGE_POLL_INTERVAL_MS ?? '30000'),
    dryRun: true, // overridden below
  };
}

function stubAdapter(): EtoroAdapter {
  return {
    async openPosition() {
      return { orderId: `demo-${Date.now()}`, status: 'filled' };
    },
    async closePosition() {
      return { orderId: `demo-close-${Date.now()}` };
    },
    async getPositions() {
      return [];
    },
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.mode === 'demo-trade') {
    if (process.env.ETORO_MODE && process.env.ETORO_MODE !== 'sandbox') {
      console.error(`[hedge:demo] --demo-trade requires ETORO_MODE=sandbox (got ${process.env.ETORO_MODE})`);
      process.exit(2);
    }
    if (!process.env.ETORO_SANDBOX_KEY || !process.env.ETORO_SANDBOX_SECRET) {
      console.error('[hedge:demo] --demo-trade requires ETORO_SANDBOX_KEY and ETORO_SANDBOX_SECRET');
      process.exit(2);
    }
  }

  const config = buildConfig();
  config.dryRun = args.mode === 'dry-run';

  // Without RISK_ENGINE_ADDRESS we cannot read on-chain exposure; the demo
  // still produces a proof with zero before/after exposure so the artifact
  // shape is observable.
  let reader: ExposureReader;
  if (config.riskEngineAddress) {
    reader = new ExposureReader(config.rpcUrl, config.riskEngineAddress);
  } else {
    // Build a stub reader returning a zero exposure on a "fake" block 0.
    reader = {
      async getExposure(symbol: string) {
        return { symbol, netDelta: 0, absExposure: 0, blockNumber: 0, readTimestamp: Date.now() };
      },
      async getAllExposures(symbols: string[]) {
        return symbols.map((symbol) => ({
          symbol,
          netDelta: 0,
          absExposure: 0,
          blockNumber: 0,
          readTimestamp: Date.now(),
        }));
      },
    } as unknown as ExposureReader;
  }

  const calculator = new DeltaCalculator(config);
  const adapter = stubAdapter();
  const executor = new HedgeExecutor(adapter, new Map([[args.symbol, `INST-${args.symbol}`]]), {
    dryRun: config.dryRun,
    safetyMode: 'sandbox',
  });

  const engine = new HedgeEngine(reader, calculator, executor, config);

  const recorder = new HedgeProofRecorder();
  const proof = await engine.runOnce(args.symbol, { recorder, etoroMode: 'sandbox' });

  const file = require('path').join(recorder.getDir(), `${proof.runId.replace(/[^a-zA-Z0-9_-]+/g, '-')}.json`);
  console.log(`[hedge:demo] mode=${args.mode} symbol=${args.symbol} proof=${file}`);
  console.log(`[hedge:demo] orderId=${proof.orderId} side=${proof.side} notional=${proof.notionalUsd} dryRun=${proof.dryRun}`);

  // Disconnect any provider polling so the process exits cleanly.
  if (config.riskEngineAddress) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = (reader as any).provider as ethers.JsonRpcProvider | undefined;
      provider?.destroy?.();
    } catch {
      // best effort
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[hedge:demo] fatal:', err);
    process.exit(1);
  });
}
