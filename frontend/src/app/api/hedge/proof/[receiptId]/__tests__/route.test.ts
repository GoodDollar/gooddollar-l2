import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as path from 'node:path';

const { mockReadFile, mockRealpath } = vi.hoisted(() => ({
  mockReadFile: vi.fn<(...args: unknown[]) => Promise<string>>(),
  mockRealpath: vi.fn<(...args: unknown[]) => Promise<string>>(),
}));

vi.mock('node:fs/promises', () => ({
  default: {
    readFile: mockReadFile,
    realpath: mockRealpath,
  },
  readFile: mockReadFile,
  realpath: mockRealpath,
}));
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

const PROOF_DIR = path.resolve(
  '.autobuilder/initiatives/0007e-hedging-demo/proofs',
);

function makeReq(id: string): NextRequest {
  return new NextRequest(
    `http://localhost/api/hedge/proof/${encodeURIComponent(id)}`,
  );
}

function makeCtx(id: string) {
  return { params: Promise.resolve({ receiptId: id }) };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  mockReadFile.mockReset();
  mockRealpath.mockReset();
  vi.restoreAllMocks();
});

describe('GET /api/hedge/proof/[receiptId]', () => {
  it('200 JSON when path-style probe resolves a pointer inside PROOF_DIR_ABS', async () => {
    const target = path.join(PROOF_DIR, 'receipt-abc.md');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        path: target,
        timestamp: 1700000000000,
        summary: 'per-receipt proof',
      }),
    );
    mockRealpath.mockResolvedValue(target);
    mockReadFile.mockResolvedValue('# Receipt proof\n\nbody\n');

    const res = await GET(makeReq('abc'), makeCtx('abc'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; markdown: string };
    expect(body.status).toBe('ok');
    expect(body.markdown).toContain('Receipt proof');
  });

  it('falls back to the query-style endpoint when path-style returns 5xx', async () => {
    const target = path.join(PROOF_DIR, 'receipt-fallback.md');
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ error: 'oops' }, 500))
      .mockResolvedValueOnce(
        jsonResponse({
          path: target,
          timestamp: 1700000000001,
          summary: 'fallback',
        }),
      );
    mockRealpath.mockResolvedValue(target);
    mockReadFile.mockResolvedValue('# fallback body\n');
    const res = await GET(makeReq('xyz'), makeCtx('xyz'));
    expect(res.status).toBe(200);
    expect(fetchSpy.mock.calls.length).toBe(2);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('ok');
  });

  it('returns no_proof when every probe returns 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ error: 'not_found' }, 404),
    );
    const res = await GET(makeReq('missing'), makeCtx('missing'));
    expect(res.status).toBe(404);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('no_proof');
  });

  it('returns engine_down when every probe throws (engine unreachable)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    const res = await GET(makeReq('any'), makeCtx('any'));
    expect(res.status).toBe(502);
    const body = (await res.json()) as { status: string; reason: string };
    expect(body.status).toBe('engine_down');
    expect(body.reason).toMatch(/unreachable/i);
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it('returns engine_error with the last upstream status when all probes return 5xx', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ error: 'oops' }, 500))
      .mockResolvedValueOnce(jsonResponse({ error: 'oops' }, 503));
    const res = await GET(makeReq('any'), makeCtx('any'));
    expect(res.status).toBe(502);
    const body = (await res.json()) as { status: string; httpStatus: number };
    expect(body.status).toBe('engine_error');
    expect(body.httpStatus).toBe(503);
  });

  it('returns forbidden when pointer escapes PROOF_DIR_ABS', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        path: '/etc/passwd',
        timestamp: 1700000000000,
        summary: 'evil',
      }),
    );
    mockRealpath.mockResolvedValue('/etc/passwd');
    const res = await GET(makeReq('evil'), makeCtx('evil'));
    expect(res.status).toBe(403);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('forbidden');
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it('returns missing when readFile rejects', async () => {
    const target = path.join(PROOF_DIR, 'receipt-gone.md');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        path: target,
        timestamp: 1700000000000,
        summary: 'gone',
      }),
    );
    mockRealpath.mockResolvedValue(target);
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    const res = await GET(makeReq('gone'), makeCtx('gone'));
    expect(res.status).toBe(502);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('missing');
  });

  it('returns invalid_id when the route receives an empty receipt id', async () => {
    const res = await GET(makeReq(''), makeCtx(''));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('invalid_id');
  });

  it('accepts the params object in both sync and async (Promise) shapes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        path: path.join(PROOF_DIR, 'sync.md'),
        timestamp: 1700000000000,
        summary: 'sync',
      }),
    );
    mockRealpath.mockResolvedValue(path.join(PROOF_DIR, 'sync.md'));
    mockReadFile.mockResolvedValue('# sync\n');
    const sync = await GET(makeReq('s'), { params: { receiptId: 's' } } as never);
    expect(sync.status).toBe(200);
  });
});

describe('POST /api/hedge/proof/[receiptId]', () => {
  it('rejects POST with 405', async () => {
    const req = new NextRequest(
      'http://localhost/api/hedge/proof/abc',
      { method: 'POST' },
    );
    const res = await POST(req);
    expect(res.status).toBe(405);
  });
});
