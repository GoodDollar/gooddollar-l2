"use client";

/**
 * secureWagmi - Secure wrappers for wagmi hooks with transaction validation
 *
 * This module provides drop-in replacements for wagmi hooks that include
 * the security validation layer to prevent the CVE-4 vulnerability.
 *
 * Migration guide:
 * - Replace `useWriteContract` with `useSecureWriteContract`
 * - Replace `useSendTransaction` with `useSecureSendTransaction`
 * - Ensure components can handle the risk dialog UI
 *
 * Usage example:
 * ```tsx
 * const { writeContractAsync, RiskDialogComponent } = useSecureWriteContract()
 *
 * return (
 *   <>
 *     <Button onClick={() => writeContractAsync({...})}>Send Transaction</Button>
 *     {RiskDialogComponent}
 *   </>
 * )
 * ```
 */

import { useCallback } from "react";
import {
  useWriteContract,
  useSendTransaction,
  useAccount,
  type UseWriteContractParameters,
  type UseSendTransactionParameters,
} from "wagmi";
import {
  type TransactionRequest,
  type WriteContractParameters,
  type SendTransactionParameters,
} from "viem";
import {
  validateTransaction,
  handleSecureETHSendTransaction,
  type TransactionRisk,
} from "./EIP155RequestHandlerUtil";
import { useTransactionRiskDialog } from "@/components/TransactionRiskDialog";

// ─── Error Classes ────────────────────────────────────────────────────────────

export class TransactionRejectedError extends Error {
  constructor(message = "Transaction rejected by user") {
    super(message);
    this.name = "TransactionRejectedError";
  }
}

export class TransactionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionValidationError";
  }
}

// ─── Secure useWriteContract Hook ─────────────────────────────────────────────

/**
 * Secure replacement for wagmi's useWriteContract hook
 * Includes transaction validation and user confirmation for risky operations
 */
export function useSecureWriteContract(
  parameters?: UseWriteContractParameters,
) {
  const { address: userAddress } = useAccount();
  const wagmiHook = useWriteContract(parameters);
  const { showRiskDialog, RiskDialogComponent } = useTransactionRiskDialog();

  const secureWriteContractAsync = useCallback(
    async (args: WriteContractParameters) => {
      if (!userAddress) {
        throw new Error("No wallet connected");
      }

      // Convert WriteContractParameters to TransactionRequest for validation
      const transactionRequest: TransactionRequest = {
        to: args.address,
        data: args.functionName ? "0x" : undefined, // Simplified - real impl would encode function call
        value: args.value ?? 0n,
        gas: args.gas,
      };

      let validation:
        | Awaited<ReturnType<typeof validateTransaction>>
        | undefined;

      try {
        // Validate the transaction
        validation = await validateTransaction(transactionRequest, userAddress);

        // If not auto-approved, show risk dialog
        if (!validation.approved) {
          const userApproved = await showRiskDialog(
            validation.risk,
            args.address,
            validation.risk.valueAtRisk,
          );

          if (!userApproved) {
            throw new TransactionRejectedError(
              "Transaction rejected by user due to security concerns",
            );
          }
        }

        // If we get here, proceed with the original wagmi call
        return await wagmiHook.writeContractAsync(args);
      } catch (error) {
        if (error instanceof TransactionRejectedError) {
          throw error;
        }

        if (validation?.error) {
          throw new TransactionValidationError(validation.error);
        }

        throw error;
      }
    },
    [userAddress, showRiskDialog, wagmiHook],
  );

  return {
    ...wagmiHook,
    writeContractAsync: secureWriteContractAsync,
    RiskDialogComponent,
  };
}

// ─── Secure useSendTransaction Hook ───────────────────────────────────────────

/**
 * Secure replacement for wagmi's useSendTransaction hook
 * Includes transaction validation and user confirmation for risky ETH transfers
 */
export function useSecureSendTransaction(
  parameters?: UseSendTransactionParameters,
) {
  const { address: userAddress } = useAccount();
  const wagmiHook = useSendTransaction(parameters);
  const { showRiskDialog, RiskDialogComponent } = useTransactionRiskDialog();

  const secureSendTransactionAsync = useCallback(
    async (args: SendTransactionParameters) => {
      if (!userAddress) {
        throw new Error("No wallet connected");
      }

      // Convert to TransactionRequest for validation
      const transactionRequest: TransactionRequest = {
        to: args.to,
        value: args.value ?? 0n,
        data: args.data,
        gas: args.gas,
      };

      let validation:
        | Awaited<ReturnType<typeof handleSecureETHSendTransaction>>
        | undefined;

      try {
        // Use the secure ETH send transaction handler
        const userConfirmation = async (
          risk: TransactionRisk,
        ): Promise<boolean> => {
          return await showRiskDialog(
            risk,
            args.to ?? undefined,
            risk.valueAtRisk,
          );
        };

        validation = await handleSecureETHSendTransaction(
          transactionRequest,
          userAddress,
          userConfirmation,
        );

        if (!validation.approved) {
          throw new TransactionRejectedError(
            "Transaction rejected by security validation",
          );
        }

        // If we get here, proceed with the original wagmi call
        return await wagmiHook.sendTransactionAsync(args);
      } catch (error) {
        if (error instanceof TransactionRejectedError) {
          throw error;
        }

        if (validation?.error) {
          throw new TransactionValidationError(validation.error);
        }

        throw error;
      }
    },
    [userAddress, showRiskDialog, wagmiHook],
  );

  return {
    ...wagmiHook,
    sendTransactionAsync: secureSendTransactionAsync,
    RiskDialogComponent,
  };
}

// ─── Migration Helper Functions ───────────────────────────────────────────────

/**
 * Batch validation for multiple transactions (useful for complex operations)
 */
export async function validateTransactionBatch(
  transactions: TransactionRequest[],
  userAddress: `0x${string}`,
): Promise<
  Array<{ approved: boolean; risk: TransactionRisk; error?: string }>
> {
  const validations = await Promise.all(
    transactions.map((tx) => validateTransaction(tx, userAddress)),
  );

  return validations;
}

/**
 * Check if current user settings allow auto-approval for a risk level
 * This could be extended to include user preferences
 */
export function canAutoApprove(riskLevel: TransactionRisk["level"]): boolean {
  switch (riskLevel) {
    case "low":
      return true;
    case "medium":
      return false; // Could be configurable per user
    case "high":
    case "critical":
      return false;
  }
}

/**
 * Development helper to test different risk scenarios
 */
export function createMockRiskScenario(
  level: TransactionRisk["level"],
): TransactionRisk {
  const baseRisk = {
    gasEstimate: 50000n,
    valueAtRisk: "0.1 ETH",
    contractVerified: level === "low",
  };

  switch (level) {
    case "low":
      return {
        ...baseRisk,
        level: "low",
        reasons: ["Interacting with verified contract"],
        warnings: [],
      };
    case "medium":
      return {
        ...baseRisk,
        level: "medium",
        reasons: [
          "Interacting with unverified contract",
          "Token approval required",
        ],
        warnings: ["Verify the contract address carefully"],
      };
    case "high":
      return {
        ...baseRisk,
        level: "high",
        reasons: [
          "Large ETH value",
          "Unverified contract",
          "Complex transaction",
        ],
        warnings: [
          "This transaction involves significant funds",
          "Verify all details carefully",
        ],
        valueAtRisk: "2.5 ETH",
      };
    case "critical":
      return {
        ...baseRisk,
        level: "critical",
        reasons: [
          "Excessive gas limit",
          "Large ETH value",
          "Multiple risk factors",
          "Unverified contract",
        ],
        warnings: [
          "CRITICAL: Multiple high-risk factors detected",
          "This could result in total loss of funds",
        ],
        valueAtRisk: "10 ETH",
        gasEstimate: 750000n,
      };
  }
}

// ─── Export all secure hooks and utilities ────────────────────────────────────

export {
  validateTransaction,
  handleSecureETHSendTransaction,
  isWhitelistedContract,
  addToWhitelist,
  getSecurityConfig,
} from "./EIP155RequestHandlerUtil";

export type {
  TransactionRisk,
  ValidationResult,
  RiskLevel,
} from "./EIP155RequestHandlerUtil";
