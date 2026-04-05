# MEMORY.md — Long-Term Memory

> Last updated: 2026-03-23. GoodClaw — the Good Wallet product guardian.

## My Domain: Good Wallet (GoodWallet V2)

### Live Deployment
- **URL:** https://wallet.moneyclaw.com
- **Status Dashboard:** https://wallet.moneyclaw.com/status
- **Port:** 3010 (PM2: `goodwallet-v2`)
- **Server:** Hostinger VPS (ID 1340294), 8 vCPU, user `quant`
- **Codebase:** `/home/quant/apps/GoodWalletV2`
- **GitHub:** https://github.com/yoniassia/GoodWalletV2
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Tests:** 41/41 passing (token formatting)
- **SSL:** Let's Encrypt via nginx

### Tech Stack
- **Frontend:** TypeScript, Tailwind CSS, Valtio + SWR
- **Blockchain:** Ethers.js, Alchemy SDK, multi-chain (ETH, Fuse, Celo, Polygon, BNB, Optimism, Base)
- **Swaps:** Li.Fi Protocol (cross-chain)
- **dApp Connect:** WalletConnect v2
- **Predictions:** Polymarket CLOB integration (real, not mock)
- **Auth:** Web3Auth/Torus (social login), Auth0, eToro SSO
- **MPC Wallet:** Sodot (sodot.dev) — no seed phrases
- **Analytics:** Sentry + Amplitude
- **DB:** Drizzle ORM + PGLite (local) + Neon (cloud)

### Feature Status
| Feature | Status |
|---------|--------|
| Multi-Chain Wallet (7 chains) | ✅ Live |
| Send/Receive | ✅ Live |
| Token Swaps (Li.Fi) | ✅ Live |
| QR Code Scanner | ✅ Live |
| GoodDollar UBI Claims | ✅ Live |
| WalletConnect v2 | ✅ Live |
| Prediction Markets (Polymarket) | ✅ ~80% done (needs testing, funding flow) |
| Social Login (Google, Facebook) | ✅ Live |
| Promo/Referrals | ✅ Live |
| Perpetual Futures (Hyperliquid) | ❌ Pure mockup — full plan in reference/ |
| AI Agents | 🟡 UI only, backend incomplete |
| AI Chat | 🟡 UI only, backend incomplete |

### Agent Wallet API (REST)
- **Base:** `https://wallet.moneyclaw.com/api/v1`
- **Auth:** JWT (email/password or eToro SSO)
- **Endpoints:** create wallet, list, balances, swap, bridge, withdraw, predict
- **Supported chains:** ETH (1), Polygon (137), Base (8453), Arbitrum (42161), Optimism (10), BSC (56), Avalanche (43114)
- **Limits:** per-trade max $500, daily $2000
- **Full skill:** `skills/agent-wallet/SKILL.md`

### goodwallet CLI
- `npx goodwallet@0.2.0 auth` → `pair` → `send`
- MPC-signed ETH transactions
- Config: `~/.config/goodwallet/config.json`

### GoodDollar Protocol
- **Token:** G$ (ERC-20/ERC-777) on Celo (primary), Ethereum, Fuse
- **Users:** 640K+ registered, 110K+ weekly active
- **Model:** UBI — daily G$ distribution to verified members (face verification)
- **Founded by:** Yoni Assia (2018)
- **Contract (Celo):** `0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A`
- **Key:** GoodWallet IS the wallet infra; G$ claiming is a core feature

### Deployment
- **Domain:** goodclaw.org (Cloudflare) — ALL GoodDollar projects deploy here
- **NOT** clawz.org — that's QuantClaw's domain
- Cloudflare API token in `.credentials/cloudflare-goodclaw.env`

### Known Issues & Gaps
- Futures page is 100% mock (Hyperliquid plan ready in `reference/wallet-backend-plan.md`)
- AI Agent/Chat backend incomplete
- Security score 6.5/10 — needs API key rotation, CSP headers, rate limiting
- No E2E test suite (only 41 unit tests)
- Removed from QuantClaw active apps list as of 2026-02-28

### Build & Deploy
```bash
cd /home/quant/apps/GoodWalletV2
node .yarn/releases/yarn-4.12.0.cjs build   # ~28s Turbopack
pm2 restart goodwallet-v2
```

## Ecosystem Context

### Sister Bots (Yoni's fleet)
- **QuantClaw (Quant 📈)** — Trading/quant tools, manages the VPS hosting Good Wallet
  - 19 agents, 323 skills, 45+ PM2 apps on same Hostinger VPS
  - Port map: MoneyClaw:3000, ClawX:3005, GoodWallet:3010, FamilyOffice:3021, TerminalX:3030, Tokens:3031, AgentX:3035, PICentral:3040
- **CMOClaw (📈)** — eToro marketing automation
  - 38 agents, 162 skills, Splinter server (NestJS at segmentation.ai.stg.etoro.com)
  - Email Wizard, SFMC integration, eToro brand/rebrand

### Key People
| Person | Role | Contact |
|--------|------|---------|
| Yoni Assia | eToro founder, GoodDollar founder, boss | +972544277789 / +35794329522 |
| Yoav | Human assistant, full access | +34606883771 |
| Nati Levin | Security Engineer, all infra decisions | +972524045682 |
| Shay Heffets | TerminalX driver, production audits | +972546006041 |
| Mariano | Developer (Argentina) | +5492236693631 |

### Hard-Won Rules (from QuantClaw)
- GoodWallet: standalone pages need `position:fixed` overlay + `z-index:9999`
- Use GoodDollar/mpc-agent-wallet as dependency, NEVER fork
- Wallet: two-step swap (quote→execute)
- Yoni's agent wallet: agt_e1b5167a184708b3, address 0x3C48...D9Ef
- `fuser PORT/tcp` before assigning new ports
- Sub-agents truncate large files — write critical UI in main session
- Tests > bug reports (lesson from Mariano catching 4 production bugs)

### Credentials & Security
- **Gmail:** goodclaw2@gmail.com
- **Social accounts:** Gmail, LinkedIn, X (@GClaw39851), Discord (goodclaw2), YouTube (@GoodClaw), GitHub (eToroMKT/GoodClaw) — creds in `.credentials/social-accounts.md`
- All creds in `.credentials/` on VPS (gitignored)
- eToro portfolio data is PRIVATE (Yoni only, direct chat only)
- Sub-agents get public API keys only
- Financial Datasets API key: `f4cd5217-2afe-4d8e-9031-1328633c8532`

### MemClawz (Fleet Shared Memory)
- **Proxy URL:** http://134.98.157.143:13500/api/v1
- **Agent ID:** goodclaw
- **Auth:** Bearer token required — write key configured ✅, full-access (search) key pending (YA to DM)
- **Caura MemClaw Proxy:** http://134.98.157.143:18080/api/memories (write), /api/search (search)
- **Caura Token:** configured ✅ (write-only)
- **Caura params:** tenant_id=yoniclaw, fleet_id=yoniclaw-fleet
- **Imported:** 17 memories to Caura MemClaw on 2026-03-30
- **GoodClaw IP (152.70.55.73):** allowlisted ✅
- **Proxy status:** running, health check OK (v11.3.0)
- **Valid memory types:** `fact`, `decision`, `episode`, `outcome`, `action`, `semantic`, `task`, `plan`, `commitment`, `preference`
- **Rules:** search before acting, write when something matters, update don't duplicate, always include dates
- **Plugin option:** `~/.openclaw/plugins/memclaw/` (native tools: memclaw_write, memclaw_search, memclaw_brief)
- **Search all agents:** `GET /search?q=<query>&limit=10` (with Bearer auth)
- **Write:** `POST /add` with `{"content":"...","agent_id":"goodclaw","memory_type":"fact","user_id":"yoni"}` (with Bearer auth)

## Group Chats
- **Good Agent Wallet** (120363425013941160@g.us) — My primary group. ALWAYS answer here, no mention required.

## Authorized Contacts (Fleet & Team)
See USER.md for full list. All contacts below are allowlisted for interaction.

## Vision
- Every PI gets their own AI agent + wallet
- GoodDollar = futures + predictions + AI trading
- 1M agents by 2027
- Good Wallet is the wallet layer for the entire agent ecosystem

## R&D Pipeline (2026-04-03)

### Research Completed — All 5 Verticals
| Vertical | Research File | Lines | Key Output |
|----------|--------------|-------|------------|
| GoodLend (Aave V3) | research/aave-v3/RESEARCH.md | 1,317 | Fork Aave V3, set AToken treasury → UBIFeeSplitter. Minimal changes needed. |
| GoodStable (DAI) | research/maker-dai/RESEARCH.md | 933 | gUSD stablecoin, CDP mechanics, Liquity-style StabilityPool. 6 contracts written. |
| GoodPerps (Hyperliquid) | research/hyperliquid/RESEARCH.md | 890 | Off-chain CLOB + on-chain settlement. Backend code: order book, matching engine, keepers. |
| GoodPredict (Polymarket) | research/polymarket/RESEARCH.md | 662 | CLOB matching with complementary orders. Backend: 12 tests passing. |
| GoodSwap (Uniswap V4) | research/uniswap-v4/RESEARCH.md | 894 | UBI fee = 33% of LP fee (not output). 3 deploy scripts written. |

### Backend Code Written
- `backend/perps/` — Order book, matching engine, Hyperliquid/Pyth feeds, WebSocket, liquidation keeper
- `backend/predict/` — CLOB engine, Polymarket feed, market resolver, 12 unit tests

### Key Design Decisions
- **GoodLend:** Minimal Aave V3 fork — only change is setting AToken `_treasury` to UBIFeeSplitter
- **GoodStable:** Hybrid MakerDAO + Liquity approach. gUSD backed by ETH (150%), G$ (200%), USDC (101% PSM)
- **GoodSwap:** Take 33% of LP fee, NOT 33% of output. User pays 0.30%, LP gets 0.20%, UBI gets 0.10%
- **All protocols:** 33% of fees → UBI pool. Non-negotiable.

### Autobuilder Scope Updated
- 8 active workstreams: Swap, Perps, Predict, Lend, Stable, Stocks, Bridge, Infrastructure
- Vision doc: docs/VISION.md — "One chain where AI agents do everything in finance"
