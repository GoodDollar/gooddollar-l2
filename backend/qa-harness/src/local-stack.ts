import { spawnSync } from 'child_process';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { AnvilHandle, isAnvilInstalled, pickFreePort, startAnvil } from './anvil';
import { repoRoot } from './evidence';

export interface DeployedOracle {
  address: string;
}

const ORACLE_ABI = [
  'function owner() external view returns (address)',
  'function registerSymbol(string calldata symbol, uint256 maxStalenessSeconds, uint256 maxDeviationBps) external',
  'function batchUpdatePrices(string[] calldata symbols, uint256[] calldata prices8, uint256[] calldata timestamps, uint8[] calldata sessions, uint8[] calldata confidences) external',
  'function updatePrice(string calldata symbol, uint256 price8, uint256 timestamp, uint8 session, uint8 confidence) external',
  'function getPrice(string calldata symbol) external view returns (uint256)',
  'function getPriceData(string calldata symbol) external view returns (tuple(uint256 price8, uint256 timestamp, uint8 session, uint8 confidence, uint8 signerCount))',
  'event PriceUpdated(bytes32 indexed symbolHash, string symbol, uint256 price8, uint256 timestamp, uint8 session, uint8 confidence, uint8 signerCount)',
];

const REGISTERED_SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'META', 'AMZN', 'GOOGL', 'SPY', 'QQQ'];

export interface LocalChainHandle {
  anvil: AnvilHandle;
  oracle: DeployedOracle;
  provider: ethers.JsonRpcProvider;
  signer: ethers.Wallet;
  contract: ethers.Contract;
  abi: typeof ORACLE_ABI;
  stop: () => Promise<void>;
}

/**
 * Boots a fresh anvil + deploys StockOracleV2 via the forge-compiled artifact,
 * registers the harness symbols, and returns a connected ethers contract.
 *
 * Caller is responsible for `handle.stop()` in `afterAll`.
 */
export async function bootLocalChain(opts: { port?: number; symbols?: string[] } = {}): Promise<LocalChainHandle> {
  if (!isAnvilInstalled()) {
    throw new Error('foundry/anvil is required to boot the local chain');
  }

  const port = opts.port ?? (await pickFreePort());
  const anvil = await startAnvil({ port });

  try {
    const artifact = loadOracleArtifact();
    const provider = new ethers.JsonRpcProvider(anvil.rpcUrl);
    const signer = new ethers.Wallet(anvil.deployerKey, provider);

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
    const contract = await factory.deploy(
      signer.address,
      [signer.address],
      1,
    );
    await contract.waitForDeployment();
    const address = await contract.getAddress();

    const oracle = new ethers.Contract(address, ORACLE_ABI, signer);

    const syms = opts.symbols ?? REGISTERED_SYMBOLS;
    for (const sym of syms) {
      const tx = await oracle.registerSymbol(sym, 30, 1000);
      await tx.wait();
    }

    return {
      anvil,
      oracle: { address },
      provider,
      signer,
      contract: oracle,
      abi: ORACLE_ABI,
      stop: async () => {
        await anvil.stop();
      },
    };
  } catch (err) {
    await anvil.stop();
    throw err;
  }
}

interface ForgeArtifact {
  abi: ReadonlyArray<unknown>;
  bytecode: string;
}

function loadOracleArtifact(): ForgeArtifact {
  const root = repoRoot();
  const artifactPath = path.join(root, 'out', 'StockOracleV2.sol', 'StockOracleV2.json');
  if (!fs.existsSync(artifactPath)) {
    const r = spawnSync('forge', ['build', 'src/oracle/StockOracleV2.sol', '--silent'], {
      cwd: root,
      encoding: 'utf8',
    });
    if (r.status !== 0) {
      throw new Error(`forge build StockOracleV2 failed:\n${r.stdout}\n${r.stderr}`);
    }
  }
  const raw = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const bytecode: string =
    typeof raw.bytecode === 'string'
      ? raw.bytecode
      : raw.bytecode?.object ?? '';
  if (!bytecode || bytecode === '0x') {
    throw new Error(`StockOracleV2 artifact has no bytecode at ${artifactPath}`);
  }
  return { abi: raw.abi, bytecode };
}

