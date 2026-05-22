import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { loadConfig } from '../config.js';
import { BotService } from '../core/bot-service.js';
import { log } from '../util/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const publicDir = path.join(root, 'public');

const cfg = loadConfig();
const bot = new BotService(cfg);
await bot.init();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(publicDir));

app.get('/api/snapshot', (_req, res) => res.json(bot.getSnapshot()));
app.get('/api/health', async (_req, res, next) => { try { res.json(await bot.health()); } catch (e) { next(e); } });
app.post('/api/scan', async (_req, res, next) => { try { res.json(await bot.scan()); } catch (e) { next(e); } });
app.post('/api/start', (_req, res) => { bot.start(); res.json({ ok: true, running: true }); });
app.post('/api/stop', (_req, res) => { bot.stop(); res.json({ ok: true, running: false }); });
app.post('/api/execute/:id', async (req, res, next) => { try { res.json(await bot.execute(req.params.id)); } catch (e) { next(e); } });

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  log.error({ err }, 'api error');
  res.status(500).json({ error: message });
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => log.info({ port, dryRun: cfg.DRY_RUN }, 'GoodChain arb UI listening'));
