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

const dummyReq = new NextRequest('http://localhost/api/hedge/proof/latest');

const PROOF_DIR = path.resolve(
  '.autobuilder/initiatives/0007e-hedging-demo/proofs',
);

beforeEach(() => {
  mockReadFile.mockReset();
  mockRealpath.mockReset();
});

describe('GET /api/hedge/proof/latest', () => {
  it('200 markdown when pointer resolves inside HEDGE_PROOF_DIR_FRONTEND', async () => {
    const targetPath = path.join(PROOF_DIR, 'run-2026-05-23.md');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          path: targetPath,
          timestamp: 1700000000000,
          summary: 'demo — 1 receipts (1 ok, 0 failed)',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    mockRealpath.mockResolvedValue(targetPath);
    mockReadFile.mockResolvedValue('# Hedge proof\n\nbody\n');

    const res = await GET(dummyReq);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/markdown');
    const text = await res.text();
    expect(text).toContain('Hedge proof');
    expect(mockReadFile).toHaveBeenCalledWith(targetPath, 'utf8');
  });

  it('404 markdown when engine returns no_proof_yet', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'no_proof_yet' }), { status: 404 }),
    );

    const res = await GET(dummyReq);
    expect(res.status).toBe(404);
    expect(res.headers.get('Content-Type')).toContain('text/markdown');
    const text = await res.text();
    expect(text).toContain('No hedge proof yet');
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it('502 markdown when the engine is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

    const res = await GET(dummyReq);
    expect(res.status).toBe(502);
    expect(res.headers.get('Content-Type')).toContain('text/markdown');
    const text = await res.text();
    expect(text).toMatch(/Hedge engine unreachable|unreachable/i);
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it('403 markdown when the pointer path resolves outside HEDGE_PROOF_DIR_FRONTEND', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          path: '/etc/passwd',
          timestamp: 1700000000000,
          summary: 'malicious',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    mockRealpath.mockResolvedValue('/etc/passwd');

    const res = await GET(dummyReq);
    expect(res.status).toBe(403);
    expect(res.headers.get('Content-Type')).toContain('text/markdown');
    const text = await res.text();
    expect(text).toMatch(/forbidden|outside/i);
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it('502 markdown when readFile throws (proof file missing)', async () => {
    const targetPath = path.join(PROOF_DIR, 'run-missing.md');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          path: targetPath,
          timestamp: 1700000000000,
          summary: 'missing',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    mockRealpath.mockResolvedValue(targetPath);
    mockReadFile.mockRejectedValue(new Error('ENOENT'));

    const res = await GET(dummyReq);
    expect(res.status).toBe(502);
    expect(res.headers.get('Content-Type')).toContain('text/markdown');
  });
});

describe('POST /api/hedge/proof/latest', () => {
  it('rejects POST with 405', async () => {
    const req = new NextRequest('http://localhost/api/hedge/proof/latest', {
      method: 'POST',
    });
    const res = await POST(req);
    expect(res.status).toBe(405);
  });
});
