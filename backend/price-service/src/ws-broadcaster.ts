import WebSocket, { WebSocketServer } from 'ws';
import { QuoteCache } from './quote-cache';
import { NormalizedQuote, RiskFilterResult } from './types';
import {
  redactSourceReason,
  sanitizeSourceStatus,
  SanitizedSourceStatus,
} from './source-status';
import { isoFromMs } from './iso';
import {
  computeDegraded,
  DEGRADED_NO_CACHE_MESSAGE,
  SourceStatusGetter,
} from './degraded';

export type { SourceStatusGetter };

/**
 * On-connect frame summarising the current cache state. `timestampIso`
 * mirrors the REST envelope's task-0023 invariant
 * (`new Date(timestamp).toISOString() === timestampIso`) so consumers
 * subscribed to BOTH WS and REST surfaces handle one timestamp shape.
 * Field order matches the REST envelope tail convention from task 0041:
 * `..., source?, degraded?, message?, timestamp, timestampIso`.
 *
 * `degraded` rides whenever a `sourceStatusGetter` is wired so a
 * frontend can branch on `frame.degraded` directly — matching the
 * REST `/quotes` body shape (task 0064 unified the verdict, task
 * 0076 unified the wire). `message` rides ONLY when `degraded:true`
 * and is byte-identical to the REST 503 message via the shared
 * `DEGRADED_NO_CACHE_MESSAGE` constant.
 */
interface SnapshotFrame {
  type: 'snapshot';
  data: NormalizedQuote[];
  count: number;
  source?: SanitizedSourceStatus;
  degraded?: boolean;
  message?: string;
  timestamp: number;
  timestampIso: string;
}

/**
 * Per-tick broadcast frame. Same `{timestamp, timestampIso}` pair as the
 * snapshot so the producer's `Date.now()` instant is reproducible on
 * both REST and WS surfaces (task 0048).
 */
interface QuoteFrame {
  type: 'quote';
  data: NormalizedQuote;
  timestamp: number;
  timestampIso: string;
}

/**
 * Live bind state of the broadcaster. `listening` is `true` only after the
 * `WebSocketServer` has actually bound — the previous "log immediately
 * after `start()`" pattern lied when the bind failed asynchronously, which
 * is why `/health` could keep advertising a dead `ws://` URL behind a green
 * status. The HTTP surface reads this via `getStatus()`.
 */
export interface WsStatus {
  listening: boolean;
  bindError: string | null;
  port: number | null;
}

export class WsBroadcaster {
  private wss: WebSocketServer | null = null;
  private unsubscribe?: () => void;
  private status: WsStatus = { listening: false, bindError: null, port: null };

  /** Snapshot of bind state. Returns a fresh object so callers can't mutate. */
  getStatus(): WsStatus {
    return { ...this.status };
  }

  /**
   * Subscribe to WS server events without reaching into the private
   * `WebSocketServer` instance. Internal listeners (registered first by
   * `start()`) update `this.status` before any external listener runs, so
   * a caller logging on `'listening'` can read `getStatus()` and see the
   * already-flipped value.
   */
  on(event: 'listening' | 'error', listener: () => void): void {
    this.wss?.on(event, listener);
  }

  start(
    port: number,
    cache: QuoteCache,
    sourceStatusGetter?: SourceStatusGetter,
  ): WebSocketServer {
    this.wss = new WebSocketServer({ port });

    // Track real bind state so `/health` and `/` only advertise a `ws://`
    // URL when the broadcaster has actually bound. Internal listeners
    // register before `start()` returns, so an external listener attached
    // via `on()` sees the already-updated status.
    this.wss.on('listening', () => {
      const addr = this.wss?.address();
      const boundPort =
        typeof addr === 'object' && addr !== null && 'port' in addr
          ? (addr as { port: number }).port
          : port;
      this.status = { listening: true, bindError: null, port: boundPort };
    });

    // Attach an `'error'` listener so a server-level fault doesn't bubble
    // up as an unhandled emitter error (which would crash the process).
    // Bind faults (EADDRINUSE / EACCES) are collapsed to the stable
    // `ws-bind-failed` slug so the wire reason is searchable; everything
    // else flows through `redactSourceReason` to strip stacks/paths.
    this.wss.on('error', (err: unknown) => {
      const code = (err as NodeJS.ErrnoException | undefined)?.code;
      const reason =
        code === 'EADDRINUSE' || code === 'EACCES'
          ? 'ws-bind-failed'
          : redactSourceReason(err);
      this.status = { listening: false, bindError: reason, port };
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[price-service] WS server error: ${msg}`);
    });

    this.wss.on('connection', (client) => {
      // Per-client `'error'` listener for the same reason as above.
      client.on('error', (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[price-service] WS client error: ${msg}`);
      });

      // Send the current fresh-quote snapshot immediately so a fresh
      // (or reconnecting) consumer is never starved between live ticks.
      // `now` is hoisted so `timestamp` and `timestampIso` describe the
      // same instant (task 0048 invariant).
      const fresh = cache.getFresh();
      const now = Date.now();
      const degradedInfo = sourceStatusGetter
        ? computeDegraded(cache, sourceStatusGetter)
        : undefined;
      const snapshot: SnapshotFrame = {
        type: 'snapshot',
        data: fresh,
        count: fresh.length,
        ...(degradedInfo?.src !== undefined && { source: degradedInfo.src }),
        ...(degradedInfo !== undefined && { degraded: degradedInfo.degraded }),
        ...(degradedInfo?.degraded === true && fresh.length === 0 && {
          message: DEGRADED_NO_CACHE_MESSAGE,
        }),
        timestamp: now,
        timestampIso: isoFromMs(now)!,
      };
      this.safeSend(client, JSON.stringify(snapshot));
    });

    this.unsubscribe = cache.onUpdate((_symbol: string, result: RiskFilterResult) => {
      if (!result.accepted) return;
      const now = Date.now();
      const frame: QuoteFrame = {
        type: 'quote',
        data: result.quote,
        timestamp: now,
        timestampIso: isoFromMs(now)!,
      };
      this.broadcast(JSON.stringify(frame));
    });

    return this.wss;
  }

  /**
   * Send to one client, swallowing synchronous errors so a single bad
   * socket cannot drop the rest of the broadcast loop. Best-effort
   * terminates the broken connection so the server can free its slot.
   */
  private safeSend(client: WebSocket, message: string): void {
    if (client.readyState !== WebSocket.OPEN) return;
    try {
      client.send(message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[price-service] WS send failed: ${msg}`);
      try {
        client.terminate();
      } catch {
        // best-effort cleanup
      }
    }
  }

  private broadcast(message: string): void {
    if (!this.wss) return;
    for (const client of this.wss.clients) {
      this.safeSend(client, message);
    }
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.status = { listening: false, bindError: null, port: null };
  }

  get clientCount(): number {
    if (!this.wss) return 0;
    let count = 0;
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) count++;
    }
    return count;
  }
}
