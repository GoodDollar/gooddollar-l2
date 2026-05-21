/**
 * Minimal ABI fragments for reading UnifiedRiskEngine on-chain.
 * We only need the read functions — no state-changing calls.
 */
export const UNIFIED_RISK_ENGINE_ABI = [
  'function getNetExposure(bytes32 symbol) external view returns (int256)',
  'function symbolCaps(bytes32 symbol) external view returns (uint256)',
  'function protocolCap() external view returns (uint256)',
  'function checkRisk(bytes32 symbol, int256 additionalDelta) external view returns (bool)',
] as const;
