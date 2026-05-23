/**
 * Live WebSocket broadcaster description shipped on `GET /` and
 * `GET /health`. The `url` field is rebuilt per request from the
 * `Host:` header + the broadcaster's bound port so it stays accurate
 * across deployments without hardcoding `localhost`.
 *
 * `frames` is the readonly tuple of frame `type` discriminators so
 * an integrator can switch on `data.type` without parsing the
 * `snapshot` / `quote` documentation strings.
 */
export interface WsAdvertisement {
  url: string;
  port: number;
  frames: readonly ['snapshot', 'quote'];
  snapshot: string;
  quote: string;
}
