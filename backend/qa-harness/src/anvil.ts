import { ChildProcess, spawn, spawnSync } from 'child_process';
import { ethers } from 'ethers';
import net from 'net';

export interface AnvilHandle {
  port: number;
  rpcUrl: string;
  /** Anvil's well-known first dev account (deterministic). */
  deployerKey: string;
  deployerAddress: string;
  stop: () => Promise<void>;
}

const DEV_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const DEV_ADDR = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

export function isAnvilInstalled(): boolean {
  try {
    const r = spawnSync('anvil', ['--version'], { encoding: 'utf8' });
    return r.status === 0;
  } catch {
    return false;
  }
}

export async function startAnvil(opts: { port?: number; silent?: boolean } = {}): Promise<AnvilHandle> {
  if (!isAnvilInstalled()) {
    throw new Error('anvil is not installed (foundry required for the on-chain integration tests)');
  }
  const port = opts.port ?? (await pickFreePort());
  const args = ['--port', String(port), '--host', '127.0.0.1', '--silent'];

  const child: ChildProcess = spawn('anvil', args, {
    stdio: opts.silent === false ? 'inherit' : 'ignore',
    detached: false,
  });

  child.on('error', (err) => {
    console.error('[anvil] spawn error:', err);
  });

  const rpcUrl = `http://127.0.0.1:${port}`;
  await waitForRpcReady(rpcUrl, 15_000);

  return {
    port,
    rpcUrl,
    deployerKey: DEV_KEY,
    deployerAddress: DEV_ADDR,
    stop: async () => {
      if (!child.killed) {
        child.kill('SIGTERM');
        await new Promise<void>((resolve) => {
          if (child.exitCode !== null) return resolve();
          child.once('exit', () => resolve());
          setTimeout(() => {
            try {
              child.kill('SIGKILL');
            } catch {
              // ignore
            }
            resolve();
          }, 2000);
        });
      }
    },
  };
}

export async function pickFreePort(start = 38_000, end = 39_000): Promise<number> {
  for (let i = 0; i < 50; i++) {
    const port = start + Math.floor(Math.random() * (end - start));
    if (await isPortFree(port)) return port;
  }
  throw new Error('no free port available');
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, '127.0.0.1');
  });
}

async function waitForRpcReady(rpcUrl: string, timeoutMs: number): Promise<void> {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const start = Date.now();
  let lastErr: unknown;
  while (Date.now() - start < timeoutMs) {
    try {
      await provider.getBlockNumber();
      return;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error(`anvil RPC at ${rpcUrl} did not become ready in ${timeoutMs}ms: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
}
