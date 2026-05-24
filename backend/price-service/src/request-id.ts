import crypto from 'crypto';
import type { Request, RequestHandler, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      /**
       * Correlation ID set by `requestIdMiddleware`. Echoed from a
       * safe `X-Request-Id` request header or generated server-side
       * when absent / unsafe. Always present after the middleware
       * fires; the optional `?` is for the (untyped) BEFORE-middleware
       * state in unit tests that bypass the wiring.
       */
      requestId?: string;
    }
  }
}

/**
 * Default fixed Allow-Headers set used by the CORS preflight response
 * when the client didn't send `Access-Control-Request-Headers`. Shared
 * with task 0079's `cors.ts` — kept here for now so task 0078 can wire
 * `X-Request-Id` into the preflight without a second module. Task 0079
 * folds this constant under `cors.ts` and extends with the broader
 * client header set (`Authorization`, `Cache-Control`, `Accept`, …).
 */
export const DEFAULT_CORS_ALLOW_HEADERS: readonly string[] = Object.freeze([
  'Content-Type',
  'X-Request-Id',
]);

/**
 * Safe character class for echoing a client-supplied request ID back
 * verbatim. Rejects whitespace, CR/LF, colons, slashes, and control
 * characters so a hostile `X-Request-Id: foo\r\nSet-Cookie: x` value
 * can't smuggle a header through Node's `res.setHeader`. Length cap
 * (128) bounds log-line growth.
 */
export const REQUEST_ID_REGEX = /^[a-zA-Z0-9_\-]{1,128}$/;

/**
 * Shape regex for SERVER-generated IDs: lowercase base36 timestamp
 * prefix + `-` + 8 hex chars. Documented on the wire so consumers can
 * recognise their own request without echoing it back.
 */
export const GENERATED_REQUEST_ID_REGEX = /^[a-z0-9]+-[a-f0-9]{8}$/;

export interface GenerateRequestIdOptions {
  now?: () => number;
  randomHex?: () => string;
}

/**
 * Build a fresh `<base36-ts>-<8-hex>` correlation ID. Both factory
 * inputs are injectable so tests can pin the ID for assertion. Pure
 * (no I/O outside the injected factories).
 */
export function generateRequestId(opts?: GenerateRequestIdOptions): string {
  const ts = (opts?.now ?? Date.now)().toString(36);
  const tail = (opts?.randomHex ?? defaultRandomHex)();
  return `${ts}-${tail}`;
}

function defaultRandomHex(): string {
  return crypto.randomBytes(4).toString('hex');
}

function readClientHeader(req: Request): string | undefined {
  const raw = req.headers['x-request-id'];
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0];
  return undefined;
}

/**
 * Echo a client-supplied request ID when it matches the safe regex,
 * otherwise generate a fresh server-side ID. Used by the middleware
 * and exposed so unit tests can exercise the decision boundary
 * without spinning up an Express server.
 */
export function resolveRequestId(
  client: string | undefined,
  opts?: GenerateRequestIdOptions,
): string {
  if (client !== undefined && REQUEST_ID_REGEX.test(client)) return client;
  return generateRequestId(opts);
}

/**
 * Express middleware: read `X-Request-Id` from the request, decide
 * echo-or-generate, stash on `req.requestId`, and set the same value
 * on the response header so the wire surface ALWAYS carries one.
 *
 * MUST run as the first middleware in the pipeline so the OPTIONS
 * 204 short-circuit (which `return`s without `next()`) and the
 * compression layer both see the header set. The `next()` exit is
 * unconditional — this middleware never throws or short-circuits.
 */
export function requestIdMiddleware(
  opts?: GenerateRequestIdOptions,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = resolveRequestId(readClientHeader(req), opts);
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
  };
}
