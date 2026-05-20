import { ethers } from 'ethers';
import { PendingUpdate, UpdateResult } from './types';

const STOCK_ORACLE_V2_ABI = [
  'function batchUpdatePrices(string[] calldata symbols, uint256[] calldata prices8, uint256[] calldata timestamps, uint8[] calldata sessions, uint8[] calldata confidences) external',
  'function getPrice(string calldata symbol) external view returns (uint256)',
  'function getPriceData(string calldata symbol) external view returns (tuple(uint256 price8, uint256 timestamp, uint8 session, uint8 confidence, uint256 signerCount))',
];

/**
 * Submits batched price updates to StockOracleV2 on-chain.
 */
export class OracleSubmitter {
  private readonly contract: ethers.Contract;
  private readonly wallet: ethers.Wallet;
  private readonly txTimeoutMs: number;

  constructor(rpcUrl: string, oracleAddress: string, signerKey: string, txTimeoutMs = 60000) {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(signerKey, provider);
    this.contract = new ethers.Contract(oracleAddress, STOCK_ORACLE_V2_ABI, this.wallet);
    this.txTimeoutMs = txTimeoutMs;
  }

  async submitBatch(updates: PendingUpdate[]): Promise<UpdateResult> {
    if (updates.length === 0) {
      throw new Error('Empty batch');
    }

    const symbols = updates.map(u => u.symbol);
    const prices8 = updates.map(u => u.price8);
    const timestamps = updates.map(u => BigInt(u.timestamp));
    const sessions = updates.map(u => u.session);
    const confidences = updates.map(u => u.confidence);

    const start = Date.now();

    const tx = await this.contract.batchUpdatePrices(
      symbols, prices8, timestamps, sessions, confidences,
    );
    const receipt = await tx.wait(1, this.txTimeoutMs);

    if (!receipt) {
      throw new Error(
        `Transaction dropped or replaced (tx: ${tx.hash}). ` +
        `Batch contained ${updates.length} symbol(s): ${symbols.join(', ')}`,
      );
    }

    return {
      txHash: receipt.hash,
      gasUsed: receipt.gasUsed,
      symbolCount: updates.length,
      roundTripMs: Date.now() - start,
    };
  }

  async getPrice(symbol: string): Promise<bigint> {
    return this.contract.getPrice(symbol);
  }

  get signerAddress(): string {
    return this.wallet.address;
  }
}
