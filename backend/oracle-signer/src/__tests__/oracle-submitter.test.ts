import { OracleSubmitter } from '../oracle-submitter';
import { PendingUpdate, SessionState } from '../types';

jest.mock('ethers', () => {
  const mockReceipt = {
    hash: '0xabc123',
    gasUsed: BigInt(150000),
    status: 1,
  };

  const mockTx = {
    hash: '0xabc123',
    wait: jest.fn().mockResolvedValue(mockReceipt),
  };

  const mockContract = {
    batchUpdatePrices: jest.fn().mockResolvedValue(mockTx),
    getPrice: jest.fn().mockResolvedValue(BigInt(19_150_000_000)),
  };

  return {
    ethers: {
      JsonRpcProvider: jest.fn(),
      Wallet: jest.fn().mockImplementation(() => ({
        address: '0x1111111111111111111111111111111111111111',
      })),
      Contract: jest.fn().mockImplementation(() => mockContract),
    },
    __mockContract: mockContract,
    __mockTx: mockTx,
    __mockReceipt: mockReceipt,
  };
});

const { __mockContract, __mockTx } = require('ethers') as {
  __mockContract: Record<string, jest.Mock>;
  __mockTx: { wait: jest.Mock };
};

function makeSampleUpdates(): PendingUpdate[] {
  return [
    { symbol: 'AAPL', price8: BigInt(19_150_000_000), timestamp: 1716100000, session: SessionState.Open, confidence: 95 },
    { symbol: 'TSLA', price8: BigInt(17_830_000_000), timestamp: 1716100000, session: SessionState.Open, confidence: 90 },
  ];
}

describe('OracleSubmitter', () => {
  let submitter: OracleSubmitter;

  beforeEach(() => {
    jest.clearAllMocks();
    submitter = new OracleSubmitter(
      'http://localhost:8545',
      '0x0000000000000000000000000000000000000001',
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      60000,
    );
  });

  it('submits a batch of price updates', async () => {
    const updates = makeSampleUpdates();
    const result = await submitter.submitBatch(updates);

    expect(__mockContract.batchUpdatePrices).toHaveBeenCalledWith(
      ['AAPL', 'TSLA'],
      [BigInt(19_150_000_000), BigInt(17_830_000_000)],
      [BigInt(1716100000), BigInt(1716100000)],
      [SessionState.Open, SessionState.Open],
      [95, 90],
    );

    expect(result.txHash).toBe('0xabc123');
    expect(result.gasUsed).toBe(BigInt(150000));
    expect(result.symbolCount).toBe(2);
    expect(typeof result.roundTripMs).toBe('number');
  });

  it('throws on empty batch', async () => {
    await expect(submitter.submitBatch([])).rejects.toThrow('Empty batch');
  });

  it('handles null receipt (transaction dropped/replaced)', async () => {
    __mockTx.wait.mockResolvedValueOnce(null);

    await expect(submitter.submitBatch(makeSampleUpdates())).rejects.toThrow(
      'Transaction dropped or replaced',
    );
  });

  it('throws when receipt.status === 0 (reverted on-chain)', async () => {
    // ethers v6 resolves tx.wait with a populated receipt even when the
    // tx reverts on chain — only `status: 0` distinguishes the failure
    // from a successful inclusion. Without this branch the reverted tx
    // is treated as success and the submitter mis-anchors the deviation
    // gate (sibling task 0058).
    __mockTx.wait.mockResolvedValueOnce({
      hash: '0xrevert',
      gasUsed: BigInt(75000),
      status: 0,
    });

    await expect(submitter.submitBatch(makeSampleUpdates())).rejects.toThrow(
      /reverted.*0xrevert/,
    );
  });

  it('error message for reverted tx includes status, gasUsed, and symbol list', async () => {
    __mockTx.wait.mockResolvedValueOnce({
      hash: '0xrevert',
      gasUsed: BigInt(75000),
      status: 0,
    });

    await expect(submitter.submitBatch(makeSampleUpdates())).rejects.toThrow(
      /status: 0.*gasUsed: 75000.*AAPL, TSLA/s,
    );
  });

  it('returns UpdateResult when receipt.status === 1 (back-compat)', async () => {
    const updates = makeSampleUpdates();
    const result = await submitter.submitBatch(updates);
    expect(result.txHash).toBe('0xabc123');
    expect(result.gasUsed).toBe(BigInt(150000));
    expect(result.symbolCount).toBe(2);
  });

  it('passes timeout to tx.wait()', async () => {
    const customTimeout = 30000;
    const sub = new OracleSubmitter(
      'http://localhost:8545',
      '0x0000000000000000000000000000000000000001',
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      customTimeout,
    );

    await sub.submitBatch(makeSampleUpdates());
    expect(__mockTx.wait).toHaveBeenCalledWith(1, customTimeout);
  });

  it('propagates timeout errors from ethers', async () => {
    const timeoutError = new Error('timeout');
    (timeoutError as any).code = 'TIMEOUT';
    __mockTx.wait.mockRejectedValueOnce(timeoutError);

    await expect(submitter.submitBatch(makeSampleUpdates())).rejects.toThrow('timeout');
  });

  it('exposes signer address', () => {
    expect(submitter.signerAddress).toBe('0x1111111111111111111111111111111111111111');
  });

  it('reads on-chain price', async () => {
    const price = await submitter.getPrice('AAPL');
    expect(price).toBe(BigInt(19_150_000_000));
    expect(__mockContract.getPrice).toHaveBeenCalledWith('AAPL');
  });
});
