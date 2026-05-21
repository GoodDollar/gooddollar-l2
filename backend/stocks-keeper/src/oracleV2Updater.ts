/**
 * OracleV2 Updater — pushes stock prices to StockOracleV2 via batchUpdatePrices.
 *
 * When STOCK_ORACLE_V2_ADDRESS is set, the keeper also pushes prices to the
 * new oracle alongside the legacy PriceOracle path.
 */

import { ethers } from 'ethers';
import pino from 'pino';

const logger = pino({ name: 'oracleV2Updater' });

const STOCK_ORACLE_V2_ABI = [
  'function batchUpdatePrices(string[] calldata symbols, uint256[] calldata prices8, uint256[] calldata timestamps, uint8[] calldata sessions, uint8[] calldata confidences) external',
  'function getPrice(string calldata symbol) external view returns (uint256)',
  'function getPriceUnsafe(string calldata symbol) external view returns (uint256 price8, uint256 timestamp, uint8 session, uint8 confidence)',
  'function signers(address) view returns (bool)',
  'function registeredSymbolCount() external view returns (uint256)',
  'function getAllSymbolHashes() external view returns (bytes32[])',
];

interface StockQuote {
  ticker: string;
  price: number;
  priceChainlink: bigint;
  timestamp: number;
}

export class OracleV2Updater {
  private wallet: ethers.Wallet;
  private oracle: ethers.Contract;
  private lastPrices: Map<string, bigint> = new Map();
  private registeredSymbols: Set<string> = new Set();
  private deviationBps: number;

  constructor(
    rpcUrl: string,
    signerKey: string,
    oracleAddress: string,
    deviationBps = 50,
  ) {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(signerKey, provider);
    this.oracle = new ethers.Contract(oracleAddress, STOCK_ORACLE_V2_ABI, this.wallet);
    this.deviationBps = deviationBps;
  }

  get signerAddress(): string {
    return this.wallet.address;
  }

  shouldUpdate(ticker: string, newPrice: bigint): boolean {
    const lastPrice = this.lastPrices.get(ticker);
    if (!lastPrice || lastPrice === 0n) return true;
    const diff = newPrice > lastPrice ? newPrice - lastPrice : lastPrice - newPrice;
    const bps = (diff * 10000n) / lastPrice;
    return bps >= BigInt(this.deviationBps);
  }

  async batchUpdate(quotes: StockQuote[]): Promise<number> {
    const pending = quotes
      .filter(q => this.registeredSymbols.has(q.ticker))
      .filter(q => this.shouldUpdate(q.ticker, q.priceChainlink));
    if (pending.length === 0) {
      logger.debug('No registered quotes exceed deviation threshold, skipping batch');
      return 0;
    }

    const symbols = pending.map(q => q.ticker);
    const prices = pending.map(q => q.priceChainlink);
    const timestamps = pending.map(q => BigInt(Math.floor(q.timestamp / 1000)));
    const sessions = pending.map(() => 0); // SessionState.Open
    const confidences = pending.map(() => 90);

    try {
      const tx = await this.oracle.batchUpdatePrices(
        symbols, prices, timestamps, sessions, confidences,
        { gasLimit: 500_000 },
      );
      const receipt = await tx.wait();

      for (const q of pending) {
        this.lastPrices.set(q.ticker, q.priceChainlink);
      }

      logger.info({
        symbols,
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
      }, `Batch updated ${pending.length} prices on StockOracleV2`);

      return pending.length;
    } catch (err) {
      logger.error({ err, symbols }, 'StockOracleV2 batch update failed');
      return 0;
    }
  }

  async init(tickers: string[]): Promise<void> {
    logger.info({ signer: this.signerAddress }, 'Initializing OracleV2Updater');

    const onChainHashes: string[] = await this.oracle.getAllSymbolHashes();
    const hashSet = new Set(onChainHashes.map((h: string) => h.toLowerCase()));

    for (const ticker of tickers) {
      const hash = ethers.keccak256(ethers.toUtf8Bytes(ticker));
      if (!hashSet.has(hash.toLowerCase())) {
        logger.info({ ticker, hash }, 'Not registered on StockOracleV2, skipping');
        continue;
      }
      this.registeredSymbols.add(ticker);
      try {
        const result = await this.oracle.getPriceUnsafe(ticker);
        const price8 = BigInt(result.price8);
        if (price8 > 0n) {
          this.lastPrices.set(ticker, price8);
          logger.info({ ticker, price8: price8.toString() }, 'Loaded on-chain price');
        }
      } catch {
        logger.debug({ ticker }, 'Failed to read price from StockOracleV2');
      }
    }
    logger.info(
      { registered: [...this.registeredSymbols], count: this.registeredSymbols.size },
      'OracleV2Updater initialized',
    );
  }
}

export type { StockQuote };
