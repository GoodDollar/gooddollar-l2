import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('demo-proof.ts header docstring', () => {
  it('lists every requireEnv key from main() in the Usage block', () => {
    const src = readFileSync(
      resolve(__dirname, '..', '..', 'scripts', 'demo-proof.ts'),
      'utf8',
    );
    const headerEnd = src.indexOf('*/');
    expect(headerEnd).toBeGreaterThan(0);
    const header = src.slice(0, headerEnd);
    const required = Array.from(
      src.matchAll(/requireEnv\(['"]([A-Z_]+)['"]\)/g),
    ).map((m) => m[1]);
    expect(required.length).toBeGreaterThan(0);
    for (const key of required) {
      expect(header).toContain(key);
    }
  });
});
