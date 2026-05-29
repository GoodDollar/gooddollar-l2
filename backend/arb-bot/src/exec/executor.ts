import { JsonRpcProvider, Wallet } from 'ethers';
import type { BotConfig } from '../config.js';
import type { ExecutionResult, Opportunity } from '../core/types.js';
import { log } from '../util/logger.js';

export class Executor {
  private wallet?: Wallet;

  constructor(private cfg: BotConfig, private provider: JsonRpcProvider) {
    if (cfg.PRIVATE_KEY) this.wallet = new Wallet(cfg.PRIVATE_KEY, provider);
  }

  async execute(opp: Opportunity): Promise<ExecutionResult> {
    if (this.cfg.DRY_RUN) {
      log.info({ opportunity: opp }, 'dry-run opportunity');
      return { opportunityId: opp.id, dryRun: true, ok: true, txHashes: [] };
    }
    if (!this.wallet) throw new Error('wallet not configured');

    // Conservative generic executor: refuses to execute unless adapters supplied exact tx targets/calldata.
    const txHashes: string[] = [];
    for (const leg of opp.legs) {
      if (!leg.to || !leg.calldata) {
        return { opportunityId: opp.id, dryRun: false, ok: false, txHashes, error: `leg ${leg.venueId}:${leg.marketId} missing to/calldata` };
      }
      const tx = await this.wallet.sendTransaction({ to: leg.to, data: leg.calldata, value: leg.valueWei ?? 0n });
      txHashes.push(tx.hash);
      await tx.wait(1);
    }
    return { opportunityId: opp.id, dryRun: false, ok: true, txHashes };
  }
}
