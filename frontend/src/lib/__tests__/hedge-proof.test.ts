import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { resolveSafePath } from '@/lib/hedge-proof';

let baseDir: string;
let proofDir: string;
let outsideDir: string;
let insideFile: string;
let outsideFile: string;
let symlinkFile: string;

beforeAll(async () => {
  baseDir = await mkdtemp(path.join(os.tmpdir(), 'hedge-proof-test-'));
  proofDir = path.join(baseDir, 'proofs');
  outsideDir = path.join(baseDir, 'outside');
  await mkdir(proofDir, { recursive: true });
  await mkdir(outsideDir, { recursive: true });
  insideFile = path.join(proofDir, 'good.md');
  outsideFile = path.join(outsideDir, 'bad.md');
  symlinkFile = path.join(proofDir, 'link.md');
  await writeFile(insideFile, '# good\n');
  await writeFile(outsideFile, '# bad\n');
  await symlink(outsideFile, symlinkFile);
});

afterAll(async () => {
  await rm(baseDir, { recursive: true, force: true });
});

describe('resolveSafePath', () => {
  it('resolves a path inside the proof dir to an absolute path', async () => {
    const result = await resolveSafePath(insideFile, proofDir);
    expect(result).toBe(insideFile);
  });

  it('rejects the proof dir itself', async () => {
    expect(await resolveSafePath(proofDir, proofDir)).toBeNull();
  });

  it('rejects a `..` traversal that escapes the proof dir', async () => {
    const traversal = path.join(proofDir, '..', 'outside', 'bad.md');
    expect(await resolveSafePath(traversal, proofDir)).toBeNull();
  });

  it('rejects an absolute path outside the proof dir', async () => {
    expect(await resolveSafePath(outsideFile, proofDir)).toBeNull();
  });

  it('rejects a symlink that points outside the proof dir', async () => {
    expect(await resolveSafePath(symlinkFile, proofDir)).toBeNull();
  });

  it('rejects a relative path that resolves outside the proof dir', async () => {
    const sibling = path.relative(process.cwd(), outsideFile);
    expect(await resolveSafePath(sibling, proofDir)).toBeNull();
  });
});
