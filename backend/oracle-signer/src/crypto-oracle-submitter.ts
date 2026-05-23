import { ethers } from 'ethers';
import { PendingCryptoUpdate, UpdateResult } from './types';

/**
 * Crypto-rail counterpart to {@link OracleSubmitter}.
 *
 * Calls `SwapPriceOracle.batchUpdatePrices(address[], uint256[])`. The
 * contract stamps `block.timestamp` itself, so we deliberately drop the
 * off-chain timestamp from the calldata — the auditor stores it separately.
 */
const SWAP_PRICE_ORACLE_ABI = [
  'function batchUpdatePrices(address[] calldata tokens, uint256[] calldata prices) external',
  'function getPriceUnsafe(address token) external view returns (uint256 price, uint256 timestamp)',
];

export class CryptoOracleSubmitter {
  private readonly contract: ethers.Contract;
  private readonly signer: ethers.Signer;
  private readonly _provider: ethers.JsonRpcProvider;
  private readonly txTimeoutMs: number;
  private readonly cachedAddress: string;

  constructor(
    rpcUrlOrSigner: string | ethers.Signer,
    oracleAddress: string,
    signerKeyOrAddress: string,
    txTimeoutMs = 60000,
  ) {
    if (typeof rpcUrlOrSigner === 'string') {
      this._provider = new ethers.JsonRpcProvider(rpcUrlOrSigner);
      this.signer = new ethers.Wallet(signerKeyOrAddress, this._provider);
      this.cachedAddress = (this.signer as ethers.Wallet).address;
    } else {
      this.signer = rpcUrlOrSigner;
      const p = rpcUrlOrSigner.provider;
      if (!p) throw new Error('shared signer must have a provider attached');
      this._provider = p as ethers.JsonRpcProvider;
      this.cachedAddress = signerKeyOrAddress;
    }
    this.contract = new ethers.Contract(oracleAddress, SWAP_PRICE_ORACLE_ABI, this.signer);
    this.txTimeoutMs = txTimeoutMs;
  }

  get provider(): ethers.JsonRpcProvider {
    return this._provider;
  }

  async submitBatch(updates: PendingCryptoUpdate[]): Promise<UpdateResult> {
    if (updates.length === 0) {
      throw new Error('Empty batch');
    }

    const addresses = updates.map(u => u.address);
    const prices = updates.map(u => u.price8);

    const start = Date.now();
    const tx = await this.contract.batchUpdatePrices(addresses, prices);
    const receipt = await tx.wait(1, this.txTimeoutMs);

    if (!receipt) {
      throw new Error(
        `Transaction dropped or replaced (tx: ${tx.hash}). ` +
        `Batch contained ${updates.length} token(s): ${updates.map(u => u.symbol).join(', ')}`,
      );
    }

    return {
      txHash: receipt.hash,
      gasUsed: receipt.gasUsed,
      symbolCount: updates.length,
      roundTripMs: Date.now() - start,
      blockNumber: receipt.blockNumber,
    };
  }

  async getPriceUnsafe(tokenAddress: string): Promise<[bigint, bigint]> {
    const result = await this.contract.getPriceUnsafe(tokenAddress);
    return [result[0], result[1]];
  }

  get signerAddress(): string {
    return this.cachedAddress;
  }
}
