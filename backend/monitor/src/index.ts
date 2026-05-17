/**
 * GoodDollar L2 Monitor — continuous health monitoring with REST API.
 *
 * Runs periodic checks on chain, contracts, and services.
 * Exposes results via API on port 4201.
 *
 * Endpoints:
 *   GET /api/health     — latest check results
 *   GET /api/history    — check history (last 100 runs)
 *   GET /api/alerts     — active alerts (warn/error results)
 */
import dotenv from "dotenv";
dotenv.config();

import path from "node:path";
import express from "express";
import {
  CheckResult,
  checkChainRPC,
  checkChainBalance,
  checkContract,
  checkHTTPService,
  checkExplorer,
} from "./checks";
import { loadContracts } from "./addresses";

const RPC = process.env.RPC_URL || "http://localhost:8545";
const EXPLORER = process.env.EXPLORER_URL || "https://explorer.goodclaw.org";
const PORT = parseInt(process.env.MONITOR_PORT || "4201", 10);
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL_MS || "30000", 10);
const DEPLOYER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// Canonical contract addresses come from op-stack/addresses.json
// (non-negotiable #7 of initiative 0004). The previous hardcoded Anvil
// devnet constants caused every contract check to fail on the real chain.
// Resolved from repo root regardless of pm_cwd, with env override for tests.
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const ADDRESSES_PATH =
  process.env.ADDRESSES_FILE || path.join(REPO_ROOT, "op-stack", "addresses.json");
const CONTRACTS: [string, string][] = loadContracts(ADDRESSES_PATH);
console.log(
  `[Monitor] loaded ${CONTRACTS.length} contracts from ${ADDRESSES_PATH}: ${CONTRACTS.map(
    ([n]) => n
  ).join(", ")}`
);

const SERVICES: [string, string][] = [
  ["Indexer API", "http://localhost:4200/api/health"],
];

// State
let latestResults: CheckResult[] = [];
let lastCheckTime = 0;
const history: { timestamp: number; results: CheckResult[] }[] = [];

async function runAllChecks(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // Chain
  results.push(await checkChainRPC(RPC));
  results.push(await checkChainBalance(RPC, DEPLOYER, "Deployer"));

  // Contracts (parallel)
  const contractChecks = await Promise.all(
    CONTRACTS.map(([name, addr]) => checkContract(RPC, name, addr))
  );
  results.push(...contractChecks);

  // Services (parallel)
  const serviceChecks = await Promise.all(
    SERVICES.map(([name, url]) => checkHTTPService(url, name))
  );
  results.push(...serviceChecks);

  // Explorer
  results.push(await checkExplorer(EXPLORER));

  return results;
}

async function checkLoop() {
  while (true) {
    try {
      latestResults = await runAllChecks();
      lastCheckTime = Date.now();

      // Store in history (keep last 100)
      history.push({ timestamp: lastCheckTime, results: latestResults });
      if (history.length > 100) history.shift();

      const errors = latestResults.filter((r) => r.status === "error");
      const warns = latestResults.filter((r) => r.status === "warn");

      if (errors.length > 0) {
        console.log(`[Monitor] ❌ ${errors.length} errors: ${errors.map((e) => e.name).join(", ")}`);
      } else if (warns.length > 0) {
        console.log(`[Monitor] ⚠️ ${warns.length} warnings: ${warns.map((w) => w.name).join(", ")}`);
      } else {
        console.log(`[Monitor] ✅ All ${latestResults.length} checks passed`);
      }
    } catch (err: any) {
      console.error(`[Monitor] Check loop error:`, err.message);
    }

    await new Promise((r) => setTimeout(r, CHECK_INTERVAL));
  }
}

// API
const app = express();
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/health", (_req, res) => {
  const err = latestResults.filter((r) => r.status === "error").length;
  res.json({
    status: err === 0 ? "ok" : "degraded",
    service: "monitor",
    uptime: process.uptime(),
    lastCheck: lastCheckTime ? new Date(lastCheckTime).toISOString() : null,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (_req, res) => {
  const ok = latestResults.filter((r) => r.status === "ok").length;
  const warn = latestResults.filter((r) => r.status === "warn").length;
  const err = latestResults.filter((r) => r.status === "error").length;

  res.json({
    ok: err === 0,
    service: "gooddollar-monitor",
    lastCheck: lastCheckTime ? new Date(lastCheckTime).toISOString() : null,
    summary: { ok, warn, error: err, total: latestResults.length },
    results: latestResults,
  });
});

app.get("/api/history", (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  res.json({
    ok: true,
    count: Math.min(limit, history.length),
    data: history.slice(-limit).reverse(),
  });
});

app.get("/api/alerts", (_req, res) => {
  const alerts = latestResults.filter((r) => r.status !== "ok");
  res.json({ ok: true, count: alerts.length, alerts });
});

app.listen(PORT, () => {
  console.log(`[Monitor] GoodDollar L2 Monitor API on port ${PORT}`);
});

// Start check loop
checkLoop();
