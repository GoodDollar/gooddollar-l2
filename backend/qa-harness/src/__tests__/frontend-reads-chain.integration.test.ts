import { REAL_TRADING_ENABLED } from '../../../etoro-client/src';
import { OracleSubmitter } from '../../../oracle-signer/src/oracle-submitter';
import { SessionState, PendingUpdate } from '../../../oracle-signer/src/types';
import { bootLocalChain, LocalChainHandle } from '../local-stack';
import { isAnvilInstalled } from '../anvil';
import { ethers } from 'ethers';
import { writeEvidence } from '../evidence';
import { getRunId } from '../run-id';

const anvilAvailable = isAnvilInstalled();
const maybeDescribe = anvilAvailable ? describe : describe.skip;

maybeDescribe('Lane 6 / frontend-reads-chain — a raw provider.call decodes getPrice correctly', () => {
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

  it('encoded getPrice() call returns the value batchUpdatePrices wrote (within 1 unit tolerance)', async () => {
    if (!chain) throw new Error('chain not booted');
    const runId = getRunId();
    const t0 = Date.now();

    const submitter = new OracleSubmitter(
      chain.anvil.rpcUrl,
      chain.oracle.address,
      chain.anvil.deployerKey,
    );

    const expectedPrice = 13_095_000_000n; // NVDA $130.95
    const update: PendingUpdate = {
      symbol: 'NVDA',
      price8: expectedPrice,
      timestamp: Math.floor(Date.now() / 1000),
      session: SessionState.Open,
      confidence: 92,
    };
    await submitter.submitBatch([update]);

    // This is the same call path useStockPrices (wagmi multicall) uses:
    // encode `getPrice(string)` calldata, send via provider.call, decode the
    // returned uint256.
    const iface = new ethers.Interface([
      'function getPrice(string calldata symbol) external view returns (uint256)',
    ]);
    const data = iface.encodeFunctionData('getPrice', ['NVDA']);
    const raw = await chain.provider.call({ to: chain.oracle.address, data });
    const [decoded] = iface.decodeFunctionResult('getPrice', raw);

    const delta = decoded > expectedPrice ? decoded - expectedPrice : expectedPrice - decoded;
    const ok = delta <= 1n;
    writeEvidence({
      check: '05-frontend-reads-chain',
      ok,
      runId,
      details: {
        durationMs: Date.now() - t0,
        oracleAddress: chain.oracle.address,
        symbol: 'NVDA',
        expectedPrice8: expectedPrice.toString(),
        decodedPrice8: decoded.toString(),
        delta: delta.toString(),
        callPath: 'provider.call({ to, data: encodeFunctionData(getPrice) })',
      },
    });

    expect(delta).toBeLessThanOrEqual(1n);
  }, 60_000);
});
