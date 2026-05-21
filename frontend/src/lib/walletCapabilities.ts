import { validateWcProjectId } from './wagmi-helpers'

const rawWcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID
const validatedWcProjectId = validateWcProjectId(rawWcProjectId)

export const walletConnectProjectId = validatedWcProjectId
export const isWalletConnectEnabled = validatedWcProjectId !== ''
export const mobileWalletUnavailableMessage =
  'Mobile wallet connectors are unavailable in this environment. Browser extension wallets still work.'
