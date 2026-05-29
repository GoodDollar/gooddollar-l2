import { JsonRpcProvider } from 'ethers';

export async function checkGoodChain(provider: JsonRpcProvider, expectedChainId: number, statusUrl: string) {
  const [network, block, statusRes] = await Promise.all([
    provider.getNetwork(),
    provider.getBlockNumber(),
    fetch(statusUrl, { signal: AbortSignal.timeout(8_000) }).catch(err => err),
  ]);
  const chainId = Number(network.chainId);
  const statusOk = statusRes instanceof Response && statusRes.ok;
  let status: unknown = null;
  if (statusOk) {
    try { status = await statusRes.json(); } catch { status = await statusRes.text(); }
  }
  return { chainId, expectedChainId, chainOk: chainId === expectedChainId, block, statusOk, status };
}
