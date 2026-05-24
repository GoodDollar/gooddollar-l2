'use client'

import { PropsWithChildren, createContext, useContext } from 'react'
import {
  ProofPipelineAxesState,
  UseProofPipelineAxesOptions,
  useProofPipelineAxes,
} from './useProofPipelineAxes'

const ProofPipelineAxesContext = createContext<ProofPipelineAxesState | null>(null)

export type ProofPipelineAxesProviderProps = PropsWithChildren<UseProofPipelineAxesOptions>

/**
 * Mount once near the top of the proof page. Every child that calls
 * `useProofPipelineAxesContext()` then reads the same `{ axes, verdict,
 * lastFullyAliveAt }` reference in the same render frame, eliminating
 * the race that previously let the AlivenessRollup commit to "no
 * on-chain prices" (degraded chip) while the flow nodes still rendered
 * the "unknown" gray-pulse tone on the same screen — see task
 * lane6-pipeline-flow-onchain-nodes-render-unknown-while-rollup-says-degraded
 * (0050).
 */
export function ProofPipelineAxesProvider({
  children,
  ...opts
}: ProofPipelineAxesProviderProps) {
  const value = useProofPipelineAxes(opts)
  return (
    <ProofPipelineAxesContext.Provider value={value}>
      {children}
    </ProofPipelineAxesContext.Provider>
  )
}

export function useProofPipelineAxesContext(): ProofPipelineAxesState {
  const ctx = useContext(ProofPipelineAxesContext)
  if (ctx === null) {
    throw new Error(
      'useProofPipelineAxesContext must be used inside <ProofPipelineAxesProvider>',
    )
  }
  return ctx
}

/**
 * Test-only provider: hands a fully-formed `{ axes, verdict,
 * lastFullyAliveAt }` value directly to consumers without mounting the
 * underlying hook. Lets unit tests assert rendering output for any
 * combination of axis states without driving the wagmi/fetch mocks.
 */
export function TestProofPipelineAxesProvider({
  value,
  children,
}: PropsWithChildren<{ value: ProofPipelineAxesState }>) {
  return (
    <ProofPipelineAxesContext.Provider value={value}>
      {children}
    </ProofPipelineAxesContext.Provider>
  )
}
