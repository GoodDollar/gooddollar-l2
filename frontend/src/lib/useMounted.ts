import { useEffect, useState } from 'react'

// Returns true once the component has mounted in the browser.
// Use to gate client-only UI (e.g. chart libraries that touch `window`
// or rely on layout dimensions) without resorting to `next/dynamic`
// with `ssr: false`, which on Next.js 14 dynamic route segments emits
// a client-reference manifest whose module IDs don't exist in the
// page's webpack runtime → `TypeError: Cannot read properties of
// undefined (reading 'call')` and a hard HTTP 500 on the route.
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return mounted
}
