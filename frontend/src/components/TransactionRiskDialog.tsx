'use client'

/**
 * TransactionRiskDialog - UI component for detailed transaction risk assessment
 *
 * Provides users with detailed information about transaction risks and allows
 * them to make informed decisions about whether to proceed with potentially
 * dangerous transactions.
 *
 * Features:
 * - Visual risk level indicators (low/medium/high/critical)
 * - Detailed risk reasons and warnings
 * - Gas and value impact display
 * - Contract verification status
 * - Clear approve/reject actions
 */

import { useState } from 'react'
import { AlertTriangle, Shield, X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { type TransactionRisk, type RiskLevel } from '@/lib/EIP155RequestHandlerUtil'

interface TransactionRiskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  risk: TransactionRisk
  onApprove: () => void
  onReject: () => void
  to?: `0x${string}`
  value?: string
  loading?: boolean
}

// ─── Risk Level Styling ──────────────────────────────────────────────────────

const getRiskConfig = (level: RiskLevel) => {
  switch (level) {
    case 'low':
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        iconColor: 'text-green-600',
        title: 'Low Risk Transaction',
        description: 'This transaction appears safe to proceed.',
      }
    case 'medium':
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: AlertCircle,
        iconColor: 'text-yellow-600',
        title: 'Medium Risk Transaction',
        description: 'Please review the details carefully before proceeding.',
      }
    case 'high':
      return {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: AlertTriangle,
        iconColor: 'text-orange-600',
        title: 'High Risk Transaction',
        description: 'This transaction has potentially dangerous characteristics.',
      }
    case 'critical':
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: X,
        iconColor: 'text-red-600',
        title: 'CRITICAL RISK TRANSACTION',
        description: 'This transaction could result in significant loss of funds.',
      }
  }
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TransactionRiskDialog({
  open,
  onOpenChange,
  risk,
  onApprove,
  onReject,
  to,
  value,
  loading = false,
}: TransactionRiskDialogProps) {
  const [userAcknowledged, setUserAcknowledged] = useState(false)
  const riskConfig = getRiskConfig(risk.level)
  const RiskIcon = riskConfig.icon

  const handleApprove = () => {
    onApprove()
    setUserAcknowledged(false) // Reset for next time
  }

  const handleReject = () => {
    onReject()
    setUserAcknowledged(false) // Reset for next time
  }

  const requiresAcknowledgment = risk.level === 'high' || risk.level === 'critical'
  const canProceed = !requiresAcknowledgment || userAcknowledged

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RiskIcon className={`h-5 w-5 ${riskConfig.iconColor}`} />
            {riskConfig.title}
          </DialogTitle>
          <DialogDescription>
            {riskConfig.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Risk Level Badge */}
          <div className="flex justify-center">
            <Badge className={`${riskConfig.color} px-3 py-1 text-sm font-semibold`}>
              {risk.level.toUpperCase()} RISK
            </Badge>
          </div>

          {/* Transaction Details */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="text-sm">
              <span className="font-medium text-gray-700">To:</span>
              <span className="ml-2 font-mono text-gray-900">
                {to ? formatAddress(to) : 'Unknown'}
              </span>
            </div>

            {value && value !== '0 ETH' && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Value:</span>
                <span className="ml-2 font-semibold text-gray-900">{value}</span>
              </div>
            )}

            <div className="text-sm">
              <span className="font-medium text-gray-700">Est. Gas:</span>
              <span className="ml-2 text-gray-900">{risk.gasEstimate.toString()}</span>
            </div>

            <div className="text-sm flex items-center">
              <span className="font-medium text-gray-700">Contract:</span>
              <span className="ml-2 flex items-center">
                {risk.contractVerified ? (
                  <>
                    <Shield className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-green-600 text-xs">Verified</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 text-orange-600 mr-1" />
                    <span className="text-orange-600 text-xs">Unverified</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Risk Reasons */}
          {risk.reasons.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Factors:</h4>
              <ul className="space-y-1">
                {risk.reasons.map((reason, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <AlertTriangle className="h-3 w-3 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {risk.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Security Warnings:
              </h4>
              <ul className="space-y-1">
                {risk.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-yellow-700">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Critical Risk Acknowledgment */}
          {requiresAcknowledgment && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={userAcknowledged}
                  onChange={(e) => setUserAcknowledged(e.target.checked)}
                />
                <span className="text-sm text-red-800">
                  I understand the risks and have verified the transaction details.
                  I acknowledge that this transaction could result in loss of funds.
                </span>
              </label>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={loading}
            className="flex-1"
          >
            Cancel Transaction
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading || !canProceed}
            className={`flex-1 ${
              risk.level === 'critical'
                ? 'bg-red-600 hover:bg-red-700'
                : risk.level === 'high'
                ? 'bg-orange-600 hover:bg-orange-700'
                : ''
            }`}
          >
            {loading ? 'Processing...' : 'Approve Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Hook for using TransactionRiskDialog ────────────────────────────────────

export function useTransactionRiskDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentRisk, setCurrentRisk] = useState<TransactionRisk | null>(null)
  const [resolvePromise, setResolvePromise] = useState<((approved: boolean) => void) | null>(null)
  const [to, setTo] = useState<`0x${string}` | undefined>()
  const [value, setValue] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  const showRiskDialog = (
    risk: TransactionRisk,
    transactionTo?: `0x${string}`,
    transactionValue?: string
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setCurrentRisk(risk)
      setTo(transactionTo)
      setValue(transactionValue)
      setResolvePromise(() => resolve)
      setIsOpen(true)
    })
  }

  const handleApprove = () => {
    if (resolvePromise) {
      setLoading(true)
      resolvePromise(true)
      setIsOpen(false)
      setLoading(false)
      setResolvePromise(null)
    }
  }

  const handleReject = () => {
    if (resolvePromise) {
      resolvePromise(false)
      setIsOpen(false)
      setResolvePromise(null)
    }
  }

  const RiskDialogComponent = currentRisk ? (
    <TransactionRiskDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      risk={currentRisk}
      onApprove={handleApprove}
      onReject={handleReject}
      to={to}
      value={value}
      loading={loading}
    />
  ) : null

  return {
    showRiskDialog,
    RiskDialogComponent,
  }
}