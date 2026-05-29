import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  GOODCHAIN_RPC_URL: z.string().url().default(process.env.GOODCLAW_RPC_URL ?? 'https://rpc.goodclaw.org'),
  GOODCHAIN_CHAIN_ID: z.coerce.number().int().positive().default(Number(process.env.GOODCLAW_CHAIN_ID ?? 42069)),
  GOODCHAIN_STATUS_URL: z.string().url().default(process.env.GOODCLAW_STATUS_URL ?? 'https://goodswap.goodclaw.org/api/status'),
  PRIVATE_KEY: z.string().optional().default(''),
  DRY_RUN: z.coerce.boolean().default(true),
  POLL_INTERVAL_MS: z.coerce.number().int().positive().default(10_000),
  MAX_TRADE_USD: z.coerce.number().positive().default(10),
  MIN_PROFIT_USD: z.coerce.number().nonnegative().default(0.05),
  MIN_PROFIT_BPS: z.coerce.number().nonnegative().default(30),
  MAX_SLIPPAGE_BPS: z.coerce.number().nonnegative().default(50),
  GAS_BUFFER_BPS: z.coerce.number().nonnegative().default(120),
  MARKETS_FILE: z.string().default('./markets.example.json'),
});

export type BotConfig = z.infer<typeof EnvSchema>;

export function loadConfig(): BotConfig {
  const cfg = EnvSchema.parse(process.env);
  if (!cfg.DRY_RUN && !cfg.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY is required when DRY_RUN=false');
  }
  return cfg;
}
