import { AuditLogger, WritableLike } from '../audit-logger';
import { NormalizedQuote, computeSpread } from '../types';

function makeQuote(): NormalizedQuote {
  return computeSpread({
    source: 'etoro' as const,
    symbol: 'AAPL',
    instrumentId: 'AAPL-1',
    bid: 1,
    ask: 1.1,
    mid: 1.05,
    last: 1.05,
    timestamp: 0,
    sessionState: 'open' as const,
    confidence: 1,
    stale: false,
  });
}

function makeCaptureStream(): { stream: WritableLike; written: string[] } {
  const written: string[] = [];
  const stream: WritableLike = {
    write(chunk, cb) {
      written.push(chunk);
      cb?.();
      return true;
    },
    once: () => undefined,
    on: () => undefined,
  };
  return { stream, written };
}

describe('AuditLogger optional requestId field (task 0078)', () => {
  it('records JSONL with the requestId field when supplied', async () => {
    const { stream, written } = makeCaptureStream();
    const logger = new AuditLogger({ stream });
    logger.record({ accepted: true, quote: makeQuote(), requestId: 'trace-abc' });
    await logger.flush();
    const line = JSON.parse(written[0]) as Record<string, unknown>;
    expect(line.requestId).toBe('trace-abc');
  });

  it('omits the requestId field when not supplied', async () => {
    const { stream, written } = makeCaptureStream();
    const logger = new AuditLogger({ stream });
    logger.record({ accepted: true, quote: makeQuote() });
    await logger.flush();
    const line = JSON.parse(written[0]) as Record<string, unknown>;
    expect('requestId' in line).toBe(false);
  });

  it('does not affect ingest stats counters when requestId is set', async () => {
    const { stream } = makeCaptureStream();
    const logger = new AuditLogger({ stream });
    logger.record({ accepted: true, quote: makeQuote(), requestId: 'x' });
    logger.record({ accepted: false, reason: 'stale-spread:42ms', quote: makeQuote(), requestId: 'y' });
    await logger.flush();
    const stats = logger.stats();
    expect(stats.ingested).toBe(1);
    expect(stats.rejected).toBe(1);
  });
});
