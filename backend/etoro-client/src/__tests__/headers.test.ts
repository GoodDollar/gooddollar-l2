import axios from 'axios';
import { EtoroClient } from '../index';
import { EtoroCredentials } from '../types';

jest.mock('fs', () => ({
  appendFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

const DEMO_CREDS: EtoroCredentials = {
  apiKey: 'apikey-deadbeef',
  apiSecret: 'apisecret-cafebabe',
  userKey: 'userkey-feedface',
  baseUrl: 'https://public-api.etoro.com/api/v1',
  wsUrl: 'wss://streamer.etoro.com/sapi/demo',
  mode: 'demo-readonly',
};

describe('EtoroClient — outbound HTTP headers', () => {
  it('default axios headers carry x-api-key and x-user-key', () => {
    const client = new EtoroClient({ credentials: DEMO_CREDS });
    const defaults = getHttpInstance(client).defaults.headers as unknown as Record<string, unknown>;
    const flat = flattenHeaders(defaults);
    expect(flat['x-api-key']).toBe(DEMO_CREDS.apiKey);
    expect(flat['x-user-key']).toBe(DEMO_CREDS.userKey);
  });

  it('uses configured baseURL (official public-api.etoro.com host)', () => {
    const client = new EtoroClient({ credentials: DEMO_CREDS });
    expect(getHttpInstance(client).defaults.baseURL).toBe(DEMO_CREDS.baseUrl);
  });

  it('request interceptor stamps a fresh x-request-id from the injected factory', async () => {
    let n = 0;
    const client = new EtoroClient({
      credentials: DEMO_CREDS,
      requestIdFactory: () => `req-${++n}`,
    });
    const a = await runRequestInterceptors(client, { method: 'get', url: '/x' });
    const b = await runRequestInterceptors(client, { method: 'get', url: '/y' });
    expect(a.headers?.['x-request-id']).toBe('req-1');
    expect(b.headers?.['x-request-id']).toBe('req-2');
  });

  it('request interceptor stamps a UUID v4 when no factory is supplied', async () => {
    const client = new EtoroClient({ credentials: DEMO_CREDS });
    const out = await runRequestInterceptors(client, { method: 'get', url: '/x' });
    const id = String(out.headers?.['x-request-id'] ?? '');
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('each outbound request gets a different x-request-id', async () => {
    const client = new EtoroClient({ credentials: DEMO_CREDS });
    const ids = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const cfg = await runRequestInterceptors(client, { method: 'get', url: `/x/${i}` });
      ids.add(String(cfg.headers?.['x-request-id']));
    }
    expect(ids.size).toBe(5);
  });
});

interface RequestLike {
  method?: string;
  url?: string;
  headers?: Record<string, unknown>;
}

function getHttpInstance(client: EtoroClient): ReturnType<typeof axios.create> {
  return (client as unknown as { http: ReturnType<typeof axios.create> }).http;
}

function flattenHeaders(src: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(src)) {
    if (v && typeof v === 'object') {
      for (const [k2, v2] of Object.entries(v as Record<string, unknown>)) {
        out[k2.toLowerCase()] = v2;
      }
    } else {
      out[k.toLowerCase()] = v;
    }
  }
  return out;
}

async function runRequestInterceptors(client: EtoroClient, req: RequestLike): Promise<RequestLike> {
  const instance = getHttpInstance(client);
  let current: RequestLike = { ...req, headers: { ...req.headers } };
  const handlers: Array<{ fulfilled?: (c: RequestLike) => RequestLike | Promise<RequestLike> }> = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (instance.interceptors.request as any).handlers.forEach((h: unknown) => {
    if (h) handlers.push(h as { fulfilled?: (c: RequestLike) => RequestLike | Promise<RequestLike> });
  });
  for (const h of handlers) {
    if (h.fulfilled) current = await h.fulfilled(current);
  }
  return current;
}
