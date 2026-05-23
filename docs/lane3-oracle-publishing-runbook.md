# Lane 3 — On-Chain Oracle Publishing Runbook

Operator playbook for `lane3-oracle-publishing`: the off-chain `oracle-signer`
that consumes `price-service` quotes and publishes batched updates to
`StockOracleV2` (stocks rail) and `SwapPriceOracle` (crypto rail).

> ⚠️ **Devnet only.** The default keys and chain-id allowlist are scoped to
> local anvil. Never reuse the well-known anvil key in any non-devnet
> context.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/) — `anvil` + `forge` + `cast` (tested
  on 1.5.1)
- Node 20+ and `npm`
- The `ws` package is already on the workspace root `node_modules`
- Repository checked out at the root with `foundry.toml` present

## Quick smoke (one command)

```bash
bash scripts/testnet/lane3-oracle-publishing-smoke.sh
```

That script:

1. Boots `anvil` on `:18545` (chain id 31337).
2. Deploys `StockOracleV2` + `SwapPriceOracle` via the existing
   `script/Deploy*.s.sol` files.
3. Starts `scripts/testnet/lane3-mock-price-source.mjs` (deterministic WS
   feed for `AAPL`, `TSLA`, `WETH`, `USDC`).
4. Starts the `oracle-signer` with both rails enabled.
5. Polls `http://localhost:19107/proof` for ≥1 stocks tx and ≥1 crypto tx
   (≤30s by default; override with `SMOKE_TIMEOUT_S=60`).
6. Reads back `StockOracleV2.getPrice("AAPL")` and
   `SwapPriceOracle.getPriceUnsafe(WETH)` to confirm publication.
7. Writes `.autobuilder/lane-proof/lane3-oracle-publishing.json`.

Expected steady-state output (≈4s on a warm tree):

```
[smoke] anvil ready
[smoke] StockOracleV2 @ 0x5FbDB2…aa3
[smoke] SwapPriceOracle @ 0x59b67…57b
[smoke] proof observed: stocks + crypto rails both published
[smoke] OK — proof written to .autobuilder/lane-proof/lane3-oracle-publishing.json
```

## Manual rebuild from scratch (without the smoke)

### 1. Deploy the contracts

```bash
anvil --port 8545 --chain-id 31337 --silent &
forge script script/DeployStockOracleV2.s.sol --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
forge script script/DeploySwapPriceOracle.s.sol --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

Note the two addresses logged by each forge script — they become
`STOCK_ORACLE_V2_ADDRESS` and `SWAP_PRICE_ORACLE_ADDRESS` for the signer.

### 2. Required env for the signer

```bash
export ORACLE_SIGNER_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80   # ⚠️ devnet only
export L2_RPC_URL=http://localhost:8545
export PRICE_SERVICE_URL=ws://localhost:9301
export STOCK_ORACLE_V2_ADDRESS=0x...                                # from forge output
export SWAP_PRICE_ORACLE_ADDRESS=0x...                              # from forge output
export CRYPTO_SYMBOL_MAP='WETH=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512,USDC=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0,WBTC=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9,G$=0x5FbDB2315678afecb367f032d93F642f64180aa3'
export ORACLE_SIGNER_ALLOWED_CHAIN_IDS=31337                        # defence-in-depth devnet allowlist
```

⚠️ **Never paste a funded key here.** The signer key only ever holds gas-only
devnet funds. If the env var leaks, the chain-guard still refuses to publish
to any chain id outside `ORACLE_SIGNER_ALLOWED_CHAIN_IDS` (default
`31337,1337`).

### 3. Run

```bash
cd backend/oracle-signer
npm install
npm run build && node dist/index.js
```

Health and proof endpoints:

```bash
curl -s http://localhost:9107/health | jq .
curl -s http://localhost:9107/proof  | jq .
curl -s http://localhost:3123/api/oracle/status | jq .   # frontend-merged view
```

The frontend status route merges price-service freshness with the signer's
proof tail and degrades gracefully (single-upstream outage still returns
200 with an empty `proof` or `quotes`).

## Common failure modes

| Symptom | Likely cause | Fix |
|---|---|---|
| `/health` reports `degraded` with `refused: non-devnet chain id N` | `L2_RPC_URL` points at a chain not in the allowlist | Either point at devnet or extend `ORACLE_SIGNER_ALLOWED_CHAIN_IDS` (devnet-only) |
| `[oracle-signer:crypto] symbol XYZ has no address in CRYPTO_SYMBOL_MAP` | Symbol missing from `CRYPTO_SYMBOL_MAP` | Add `XYZ=0x…` to the map. The warn is once-per-symbol — restart the signer for the second log to reappear. |
| Stocks rail OK, crypto rail never publishes | `SWAP_PRICE_ORACLE_ADDRESS` empty or `CRYPTO_SYMBOL_MAP` empty | Both must be set for the crypto rail to enable. |
| `Submission failed: nonce has already been used` | Two signer instances racing on the same key | Only run one signer per key. The two rails inside a single signer process share a `NonceManager`-wrapped wallet and do not collide. |
| `Submission failed: …deviation` | Mock prices moved >10% (StockOracleV2's deviation guard) or >25% (SwapPriceOracle's) | The mock walks 0.1% per tick by design; if you raised it, scale back. |

### Interpreting `/api/oracle/status`

The frontend status route merges both upstreams and reports per-rail
`{ status, reason? }` objects so you can triage without ssh-ing into either box:

```bash
curl -s http://localhost:3123/api/oracle/status | jq '.upstreams'
```

**Both upstreams down (HTTP 503):**

```json
{
  "priceService": { "status": "down", "reason": "ECONNREFUSED: fetch failed" },
  "oracleSigner": { "status": "down", "reason": "upstream http://localhost:9107/proof returned 503" }
}
```

**Signer refusing on chain-guard (HTTP 200, degraded):**

```json
{
  "priceService": { "status": "ok" },
  "oracleSigner": { "status": "down", "reason": "upstream http://localhost:9107/proof returned 503" }
}
```

The signer's own `/health` body will also include `chainCheck.refused: "non-devnet chain id …"` — read both endpoints together when diagnosing.

**Signer key missing (HTTP 200, degraded):** identical to chain-guard refusal above —
the signer keeps the health port alive and returns 503 from `/proof` with
`signer disabled (no ORACLE_SIGNER_KEY)` in the body. Inspect the signer's
`/health` to disambiguate.

**Reason field guarantees:** newlines collapsed to spaces, `0x`-prefixed hex
of length ≥40 (signer keys / addresses) replaced with `<redacted-hex>`,
length clamped to ≤200 chars. Safe to forward to logs / dashboards.

## Where the proof lives

```
.autobuilder/lane-proof/lane3-oracle-publishing.json
```

Sample (live values vary):

```json
{
  "lane": "lane3-oracle-publishing",
  "generatedAt": 1779542816,
  "chainId": 31337,
  "stockOracleV2": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "swapPriceOracle": "0x59b670e9fA9D0A427751Af201D676719a970857b",
  "stockTx": "0xb84a073aea607dc1c74b0767880150584a6e790331cbec59822a5c0adb1ccf52",
  "swapTx": "0x5e6ad7f761dfd0cafb4cb6b6341ee6e1329b57dd9aceba6ebc4b2a17cb036203",
  "aaplPrice8": 19156121741,
  "wethPrice8": 349890118424
}
```

The audit log lives in `.autobuilder/logs/oracle-signer/YYYY-MM-DD.jsonl`
(also gitignored) with one line per `submit_ok` / `submit_fail` / `refused`
/ `startup` / `shutdown` event.

## CI / regression gate

The default `npm test` in `backend/oracle-signer` stays fast (no anvil).
The smoke gate is opt-in:

```bash
RUN_LANE3_SMOKE=1 npx jest -i backend/oracle-signer/src/__tests__/lane3-smoke.test.ts
```

It calls the same bash script, asserts exit 0, and validates the proof
JSON shape (chainId, tx-hash regexes, positive price fields).
