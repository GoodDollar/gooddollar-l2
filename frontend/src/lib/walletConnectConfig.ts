import { validateWcProjectId } from './wagmi-helpers'

const rawWcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID

export const validatedWcProjectId = validateWcProjectId(rawWcProjectId)
export const isWalletConnectConfigured = validatedWcProjectId !== ''
