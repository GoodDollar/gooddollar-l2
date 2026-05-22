import { useBlockNumber } from 'wagmi'

const BLOCK_REFETCH_MS = 10_000

export function useThrottledBlockNumber(): number | null {
  const { data } = useBlockNumber({ query: { refetchInterval: BLOCK_REFETCH_MS } })
  return data != null ? Number(data) : null
}
