import { ChildProcess, spawn, spawnSync } from 'child_process';
import http from 'http';
import net from 'net';

export interface AnvilHandle {
  port: number;
  rpcUrl: string;
  /** Anvil's well-known first dev account (deterministic). */
  deployerKey: string;
  deployerAddress: string;
  /**
   * A second pre-funded anvil dev account. Used by the harness to run the
   * OracleSubmitter so its wallet starts at nonce 0 (deployer's nonces are
   * already consumed by contract deployment + symbol registrations).
   */
  signerKey: string;
  signerAddress: string;
  stop: () => Promise<void>;
}

const DEV_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const DEV_ADDR = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const DEV_KEY_2 = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const DEV_ADDR_2 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

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
    signerKey: DEV_KEY_2,
    signerAddress: DEV_ADDR_2,
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

/**
 * Asks the kernel for a free port by binding 0.0.0.0:0 — the returned port is
 * guaranteed unused at the moment of return. Caller must bind it immediately.
 * Optional start/end are accepted for API compat but ignored — kernel choice
 * is strictly safer than a random range that could collide.
 */
export async function pickFreePort(_start?: number, _end?: number): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const tester = net.createServer();
    tester.once('error', reject);
    tester.listen(0, '127.0.0.1', () => {
      const addr = tester.address();
      if (addr && typeof addr === 'object' && typeof addr.port === 'number') {
        const port = addr.port;
        tester.close(() => resolve(port));
      } else {
        tester.close(() => reject(new Error('failed to read assigned port')));
      }
    });
  });
}

async function waitForRpcReady(rpcUrl: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  let lastErr: unknown;
  while (Date.now() - start < timeoutMs) {
    try {
      await rawJsonRpcCall(rpcUrl, 'eth_blockNumber');
      return;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 150));
    }
  }
  throw new Error(`anvil RPC at ${rpcUrl} did not become ready in ${timeoutMs}ms: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
}

function rawJsonRpcCall(rpcUrl: string, method: string, params: unknown[] = []): Promise<string> {
  const url = new URL(rpcUrl);
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
  return new Promise<string>((resolve, reject) => {
    const req = http.request(
      {
        hostname: url.hostname,
        port: Number(url.port),
        path: url.pathname || '/',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body).toString() },
        timeout: 1_000,
      },
      (res) => {
        let buf = '';
        res.setEncoding('utf8');
        res.on('data', (c) => {
          buf += c;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(buf) as { result?: string; error?: { message?: string } };
            if (parsed.error) reject(new Error(parsed.error.message ?? 'rpc error'));
            else if (typeof parsed.result === 'string') resolve(parsed.result);
            else reject(new Error('rpc no result'));
          } catch (err) {
            reject(err as Error);
          }
        });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('rpc timeout'));
    });
    req.write(body);
    req.end();
  });
}
