'use client'

import { validateWcProjectId } from './wagmi-helpers'

export function isWalletConnectConfigured(): boolean {
  return validateWcProjectId(process.env.NEXT_PUBLIC_WC_PROJECT_ID) !== ''
}

