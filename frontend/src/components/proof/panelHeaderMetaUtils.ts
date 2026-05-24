/**
 * Pure helpers consumed by the proof-page header rails. Kept in a
 * separate module from `PanelHeaderMeta.tsx` so the component file
 * only exports components (fast-refresh friendly).
 */

/** Render an address as `0x{first4}…{last4}` for inline rail metadata. */
export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

/** Trim a long file path to its last two `/`-separated segments. */
export function shortenSourcePath(path: string): string {
  if (!path) return path
  const parts = path.split('/').filter(Boolean)
  if (parts.length <= 2) return parts.join('/')
  return parts.slice(-2).join('/')
}
