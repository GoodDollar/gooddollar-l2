import { ethers } from 'ethers';
import { UNIFIED_RISK_ENGINE_ABI } from './abi';
import { OnChainExposure, StockSymbol } from './types';

/**
 * Reads net on-chain exposure per symbol from UnifiedRiskEngine.
 * Converts the bytes32 symbol key ↔ string symbol transparently.
 */
export class ExposureReader {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly contract: ethers.Contract;

  constructor(rpcUrl: string, riskEngineAddress: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contract = new ethers.Contract(
      riskEngineAddress,
      UNIFIED_RISK_ENGINE_ABI,
      this.provider,
    );
  }

  static symbolToBytes32(symbol: string): string {
    return ethers.encodeBytes32String(symbol);
  }

  async getExposure(symbol: StockSymbol): Promise<OnChainExposure> {
    const key = ExposureReader.symbolToBytes32(symbol);
    const blockNumber = await this.provider.getBlockNumber();
    const raw: bigint = await this.contract.getNetExposure(key);
    const netDelta = Number(ethers.formatUnits(raw, 18));

    return {
      symbol,
      netDelta,
      absExposure: Math.abs(netDelta),
      blockNumber,
      readTimestamp: Date.now(),
    };
  }

  async getAllExposures(symbols: StockSymbol[]): Promise<OnChainExposure[]> {
    const settled = await Promise.allSettled(symbols.map((s) => this.getExposure(s)));
    const exposures: OnChainExposure[] = [];

    for (let i = 0; i < settled.length; i++) {
      const result = settled[i];
      if (result.status === 'fulfilled') {
        exposures.push(result.value);
      } else {
        const errMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
        console.warn(`[ExposureReader] Failed to read exposure for ${symbols[i]}:`, errMsg);
      }
    }

    return exposures;
  }
}
