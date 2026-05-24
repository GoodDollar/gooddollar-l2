import * as fs from 'fs';

/**
 * Filesystem kill-switch — when the configured file exists at probe time,
 * the hedge-engine refuses to place any further orders for the rest of the
 * tick (and every tick thereafter, until the file is removed).
 *
 * Design choices:
 *  - Synchronous `fs.statSync`: the probe runs once at tick-start and once
 *    per order; both are well inside a single ≥30s poll interval, so the
 *    extra system call cost is negligible.
 *  - **Fail-safe to halt**: if reading the file fails for any non-ENOENT
 *    reason (permissions, EIO, etc.), we treat the switch as engaged. The
 *    only safe interpretation of "I don't know" is "stop trading".
 *  - An empty / undefined path means the operator has not configured a
 *    kill switch — the probe reports `engaged=false` so the engine can
 *    still run in environments that don't enable this feature.
 */
/** Stat function — injected so tests can simulate EACCES/EIO without spy magic. */
export type StatFn = (p: string) => unknown;

export class KillSwitchProbe {
  private readonly filePath: string | undefined;
  private readonly stat: StatFn;

  constructor(filePath: string | undefined, stat: StatFn = fs.statSync) {
    this.filePath = filePath && filePath.length > 0 ? filePath : undefined;
    this.stat = stat;
  }

  isEngaged(): boolean {
    if (!this.filePath) return false;
    try {
      this.stat(this.filePath);
      return true;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') return false;
      // Any other error = unknown state = halt for safety.
      return true;
    }
  }

  getPath(): string | undefined {
    return this.filePath;
  }
}
