export type OrderSubmissionMode = 'real-market' | 'unsupported-limit' | 'unsupported-network'

export interface OrderSubmissionState {
  mode: OrderSubmissionMode
  /** True when the form should actually call the on-chain mint/redeem. */
  canSubmitOnChain: boolean
  /** Short inline helper text shown above the submit button, or null when nothing to show. */
  unsupportedMessage: string | null
}

export interface OrderSubmissionInput {
  isDeployed: boolean
  orderType: 'market' | 'limit'
}

const LIMIT_UNSUPPORTED_MESSAGE = 'Limit orders are not yet supported on this network.'
const NETWORK_UNSUPPORTED_MESSAGE = 'Trading is not yet enabled on this network.'

/**
 * Decide whether a stocks order submission can actually mint/redeem on-chain,
 * or whether the form should refuse and show a helper message instead.
 *
 * Limit orders always win over network state — even on a deployed network we
 * cannot honor a limit price, so the UI must say so explicitly instead of
 * silently faking success.
 */
export function computeOrderSubmissionState(input: OrderSubmissionInput): OrderSubmissionState {
  if (input.orderType === 'limit') {
    return {
      mode: 'unsupported-limit',
      canSubmitOnChain: false,
      unsupportedMessage: LIMIT_UNSUPPORTED_MESSAGE,
    }
  }

  if (!input.isDeployed) {
    return {
      mode: 'unsupported-network',
      canSubmitOnChain: false,
      unsupportedMessage: NETWORK_UNSUPPORTED_MESSAGE,
    }
  }

  return {
    mode: 'real-market',
    canSubmitOnChain: true,
    unsupportedMessage: null,
  }
}
