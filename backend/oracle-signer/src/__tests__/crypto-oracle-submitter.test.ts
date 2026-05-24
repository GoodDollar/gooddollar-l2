import { CryptoOracleSubmitter } from '../crypto-oracle-submitter';
import { PendingCryptoUpdate } from '../types';

jest.mock('ethers', () => {
  const mockReceipt = {
    hash: '0xcrypto1',
    blockNumber: 1234,
    gasUsed: BigInt(120000),
  };

  const mockTx = {
    hash: '0xcrypto1',
    wait: jest.fn().mockResolvedValue(mockReceipt),
  };

  const mockContract = {
    batchUpdatePrices: jest.fn().mockResolvedValue(mockTx),
    getPriceUnsafe: jest.fn().mockResolvedValue([BigInt(350_000_000_000), BigInt(1700000000)]),
  };

  return {
    ethers: {
      JsonRpcProvider: jest.fn(),
      Wallet: jest.fn().mockImplementation(() => ({
        address: '0x2222222222222222222222222222222222222222',
      })),
      Contract: jest.fn().mockImplementation(() => mockContract),
      isAddress: (s: unknown) => typeof s === 'string' && /^0x[a-fA-F0-9]{40}$/.test(s as string),
      getAddress: (s: string) => s,
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

const WETH = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const USDC = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

function makeSampleUpdates(): PendingCryptoUpdate[] {
  return [
    { symbol: 'WETH', address: WETH, price8: BigInt(350_000_000_000), timestamp: 1716100000 },
    { symbol: 'USDC', address: USDC, price8: BigInt(100_000_000), timestamp: 1716100000 },
  ];
}

describe('CryptoOracleSubmitter', () => {
  let submitter: CryptoOracleSubmitter;

  beforeEach(() => {
    jest.clearAllMocks();
    submitter = new CryptoOracleSubmitter(
      'http://localhost:8545',
      '0x0000000000000000000000000000000000000099',
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      60000,
    );
  });

  it('submits batch with (address[], uint256[]) signature only — no timestamps', async () => {
    const updates = makeSampleUpdates();
    const result = await submitter.submitBatch(updates);

    expect(__mockContract.batchUpdatePrices).toHaveBeenCalledTimes(1);
    expect(__mockContract.batchUpdatePrices).toHaveBeenCalledWith(
      [WETH, USDC],
      [BigInt(350_000_000_000), BigInt(100_000_000)],
    );
    expect(result.txHash).toBe('0xcrypto1');
    expect(result.gasUsed).toBe(BigInt(120000));
    expect(result.symbolCount).toBe(2);
    expect(result.blockNumber).toBe(1234);
    expect(typeof result.roundTripMs).toBe('number');
  });

  it('throws on empty batch', async () => {
    await expect(submitter.submitBatch([])).rejects.toThrow('Empty batch');
  });

  it('handles null receipt as dropped/replaced tx', async () => {
    __mockTx.wait.mockResolvedValueOnce(null);
    await expect(submitter.submitBatch(makeSampleUpdates())).rejects.toThrow(
      'Transaction dropped or replaced',
    );
  });

  it('exposes signer address', () => {
    expect(submitter.signerAddress).toBe('0x2222222222222222222222222222222222222222');
  });

  it('reads on-chain price via getPriceUnsafe', async () => {
    const [price, ts] = await submitter.getPriceUnsafe(WETH);
    expect(price).toBe(BigInt(350_000_000_000));
    expect(ts).toBe(BigInt(1700000000));
  });
});
