/**
 * Live WebSocket broadcaster description shipped on `GET /` and
 * `GET /health`. The `url` field is rebuilt per request from a
 * deploy-pinned hostname (or, when unset, the validated `Host:` header
 * filtered through an allowlist — see task 0062) plus the broadcaster's
 * bound port so it stays accurate across deployments without hardcoding
 * `localhost` and without trusting an attacker-supplied header.
 *
 * `frames` is the readonly tuple of frame `type` discriminators so
 * an integrator can switch on `data.type` without parsing the
 * `snapshot` / `quote` documentation strings.
 *
 * `hostnameSource` records which gate produced the hostname so an
 * operator scanning `/health` can confirm the deploy is fenced
 * against `Host:` header poisoning.
 */
export type WsHostnameSource = 'env-pinned' | 'allowlist-default' | 'host-header';

export interface WsAdvertisement {
  url: string;
  port: number;
  frames: readonly ['snapshot', 'quote'];
  snapshot: string;
  quote: string;
  hostnameSource: WsHostnameSource;
}
