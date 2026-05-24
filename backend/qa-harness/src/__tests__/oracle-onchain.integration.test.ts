import { REAL_TRADING_ENABLED } from '../../../etoro-client/src';
import { OracleSubmitter } from '../../../oracle-signer/src/oracle-submitter';
import { SessionState, PendingUpdate } from '../../../oracle-signer/src/types';
import { bootLocalChain, LocalChainHandle } from '../local-stack';
import { isAnvilInstalled } from '../anvil';
import { writeEvidence } from '../evidence';
import { getRunId } from '../run-id';

const anvilAvailable = isAnvilInstalled();
const maybeDescribe = anvilAvailable ? describe : describe.skip;

maybeDescribe('Lane 6 / oracle-onchain — batchUpdatePrices lands a receipt on the local chain', () => {
  let chain: LocalChainHandle | null = null;

  beforeAll(async () => {
    chain = await bootLocalChain();
  }, 60_000);

  afterAll(async () => {
    if (chain) await chain.stop();
  });

  it('REAL_TRADING_ENABLED is hardcoded false (precondition)', () => {
    expect(REAL_TRADING_ENABLED).toBe(false);
  });

  it('OracleSubmitter.submitBatch writes the prices and the tx receipt has status 1', async () => {
    if (!chain) throw new Error('chain not booted');
    const runId = getRunId();
    const t0 = Date.now();

    const submitter = new OracleSubmitter(
      chain.anvil.rpcUrl,
      chain.oracle.address,
      chain.anvil.signerKey,
    );

    const now = Math.floor(Date.now() / 1000);
    const updates: PendingUpdate[] = [
      { symbol: 'AAPL', price8: 19_155_000_000n, timestamp: now, session: SessionState.Open, confidence: 95 },
      { symbol: 'TSLA', price8: 17_830_000_000n, timestamp: now, session: SessionState.Open, confidence: 90 },
    ];

    const result = await submitter.submitBatch(updates);

    // Verify on-chain state changed.
    const stored = await chain.contract.getPrice('AAPL');

    const receipt = await chain.provider.getTransactionReceipt(result.txHash);

    const ok = !!receipt && receipt.status === 1 && BigInt(stored) === 19_155_000_000n;
    writeEvidence({
      check: '04-oracle-onchain',
      ok,
      runId,
      details: {
        durationMs: Date.now() - t0,
        oracleAddress: chain.oracle.address,
        txHash: result.txHash,
        receiptStatus: receipt?.status ?? null,
        blockNumber: receipt?.blockNumber ?? null,
        gasUsed: result.gasUsed.toString(),
        readBackPrice8: stored.toString(),
        updates: updates.map((u) => ({ symbol: u.symbol, price8: u.price8.toString() })),
      },
    });

    expect(receipt).not.toBeNull();
    expect(receipt!.status).toBe(1);
    expect(BigInt(stored)).toBe(19_155_000_000n);
  }, 60_000);
});
