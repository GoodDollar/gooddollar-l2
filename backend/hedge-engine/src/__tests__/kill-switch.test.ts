import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { KillSwitchProbe } from '../kill-switch';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hedge-killswitch-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('KillSwitchProbe', () => {
  it('returns engaged=false when the configured file does not exist', () => {
    const probe = new KillSwitchProbe(path.join(tmpDir, 'does-not-exist'));
    expect(probe.isEngaged()).toBe(false);
  });

  it('returns engaged=true when the file exists', () => {
    const file = path.join(tmpDir, 'kill');
    fs.writeFileSync(file, '');
    const probe = new KillSwitchProbe(file);
    expect(probe.isEngaged()).toBe(true);
  });

  it('re-evaluates on every isEngaged() call (no caching)', () => {
    const file = path.join(tmpDir, 'kill');
    const probe = new KillSwitchProbe(file);
    expect(probe.isEngaged()).toBe(false);
    fs.writeFileSync(file, '');
    expect(probe.isEngaged()).toBe(true);
    fs.unlinkSync(file);
    expect(probe.isEngaged()).toBe(false);
  });

  it('treats an empty / undefined path as disabled (engaged=false)', () => {
    expect(new KillSwitchProbe(undefined).isEngaged()).toBe(false);
    expect(new KillSwitchProbe('').isEngaged()).toBe(false);
  });

  it('fail-safe: stat error (e.g. EACCES) → engaged=true', () => {
    const file = path.join(tmpDir, 'kill');
    const stat = () => {
      const err = new Error('EACCES') as NodeJS.ErrnoException;
      err.code = 'EACCES';
      throw err;
    };
    const probe = new KillSwitchProbe(file, stat);
    expect(probe.isEngaged()).toBe(true);
  });
});
