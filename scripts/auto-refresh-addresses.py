#!/usr/bin/env python3
"""
Automated Address Refresh System for GoodDollar L2
Prevents DEVNET_DRIFT by auto-refreshing contract addresses post-deployment.

Features:
- Post-deployment automatic address refresh
- Preflight bytecode validation
- Auto-retry mechanism on drift detection
- Health monitoring and alerting
- Zero DEVNET_DRIFT target with >90% success rate

Usage:
  python3 scripts/auto-refresh-addresses.py --mode post-deploy     # Run after deployment
  python3 scripts/auto-refresh-addresses.py --mode monitor        # Continuous monitoring
  python3 scripts/auto-refresh-addresses.py --mode validate       # Preflight validation
"""

import argparse
import json
import logging
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import urllib.request
import urllib.error

# Configuration
REPO_ROOT = Path(__file__).resolve().parent.parent
REFRESH_SCRIPT = REPO_ROOT / "scripts" / "refresh-addresses.py"
RPC_URL = "http://localhost:8545"
CHAIN_ID = 42069
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds
HEALTH_CHECK_INTERVAL = 30  # seconds

# Required contracts for system operation
REQUIRED_CONTRACTS = ["GDT", "UBI", "PERP", "VAULT", "MF", "LEND", "STABLE", "STOCKS", "SWAP", "GUSD", "FEE_SPLITTER"]

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(REPO_ROOT / "logs" / "auto-refresh.log", "a"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class AddressRefreshAutomation:
    """Automated address refresh and drift prevention system."""

    def __init__(self):
        self.success_count = 0
        self.failure_count = 0
        self.drift_detected_count = 0

        # Ensure log directory exists
        (REPO_ROOT / "logs").mkdir(exist_ok=True)

    def rpc_call(self, method: str, params: List) -> Optional[Dict]:
        """Make JSON-RPC call to blockchain."""
        try:
            body = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode()
            req = urllib.request.Request(RPC_URL, data=body, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                return json.loads(resp.read())
        except Exception as e:
            logger.error(f"RPC call failed: {e}")
            return None

    def has_code(self, address: str) -> bool:
        """Check if contract has bytecode at address."""
        result = self.rpc_call("eth_getCode", [address, "latest"])
        if not result or "error" in result:
            return False
        code = result.get("result", "0x")
        return code not in ("0x", "0x0", "", None) and len(code) > 4

    def validate_blockchain_connectivity(self) -> bool:
        """Validate blockchain is responsive and accessible."""
        logger.info("Validating blockchain connectivity...")

        # Check if RPC is responding
        result = self.rpc_call("eth_blockNumber", [])
        if not result or "error" in result:
            logger.error("Blockchain RPC is not responding")
            return False

        # Check chain ID
        chain_result = self.rpc_call("eth_chainId", [])
        if not chain_result or "error" in chain_result:
            logger.error("Cannot verify chain ID")
            return False

        actual_chain_id = int(chain_result["result"], 16)
        if actual_chain_id != CHAIN_ID:
            logger.error(f"Wrong chain ID: expected {CHAIN_ID}, got {actual_chain_id}")
            return False

        logger.info(f"Blockchain connectivity validated (chain {actual_chain_id})")
        return True

    def run_refresh_script(self, check_mode: bool = False) -> Tuple[bool, str]:
        """Execute the refresh-addresses.py script."""
        try:
            cmd = [sys.executable, str(REFRESH_SCRIPT)]
            if check_mode:
                cmd.append("--check")

            result = subprocess.run(
                cmd,
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                timeout=60
            )

            success = result.returncode == 0
            output = f"STDOUT:\n{result.stdout}\n\nSTDERR:\n{result.stderr}"

            if success:
                logger.info("Address refresh script completed successfully")
                self.success_count += 1
            else:
                logger.error(f"Address refresh script failed with code {result.returncode}")
                self.failure_count += 1
                if "DEVNET_DRIFT" in result.stderr or "has no bytecode" in result.stderr:
                    self.drift_detected_count += 1

            return success, output

        except subprocess.TimeoutExpired:
            logger.error("Address refresh script timed out")
            self.failure_count += 1
            return False, "Script execution timed out"
        except Exception as e:
            logger.error(f"Failed to run refresh script: {e}")
            self.failure_count += 1
            return False, str(e)

    def detect_drift(self) -> bool:
        """Detect if address drift has occurred."""
        logger.info("Checking for address drift...")
        success, output = self.run_refresh_script(check_mode=True)

        if not success:
            # Check if failure is due to drift vs other issues
            if "DEVNET_DRIFT" in output or "has no bytecode" in output:
                logger.warning("Address drift detected!")
                self.drift_detected_count += 1
                return True
            else:
                logger.error(f"Drift check failed for other reasons: {output}")
        else:
            logger.info("No address drift detected")

        return False

    def preflight_validation(self) -> bool:
        """Perform preflight validation before deployment operations."""
        logger.info("Starting preflight validation...")

        # 1. Validate blockchain connectivity
        if not self.validate_blockchain_connectivity():
            return False

        # 2. Check if refresh script exists and is executable
        if not REFRESH_SCRIPT.exists():
            logger.error(f"Refresh script not found: {REFRESH_SCRIPT}")
            return False

        # 3. Test refresh script in check mode
        logger.info("Testing refresh script functionality...")
        success, output = self.run_refresh_script(check_mode=True)
        if not success and "DEVNET_DRIFT" not in output:
            logger.error("Refresh script test failed with non-drift error")
            return False

        # 4. Validate required directories exist
        for path in [REPO_ROOT / ".autobuilder", REPO_ROOT / "op-stack", REPO_ROOT / "broadcast"]:
            if not path.exists():
                logger.warning(f"Required directory missing: {path}")
                path.mkdir(parents=True, exist_ok=True)
                logger.info(f"Created directory: {path}")

        logger.info("Preflight validation completed successfully")
        return True

    def auto_retry_refresh(self, max_retries: int = MAX_RETRIES) -> bool:
        """Auto-retry address refresh with exponential backoff."""
        logger.info(f"Starting auto-retry refresh (max {max_retries} attempts)...")

        for attempt in range(1, max_retries + 1):
            logger.info(f"Refresh attempt {attempt}/{max_retries}")

            success, output = self.run_refresh_script()
            if success:
                logger.info(f"Address refresh succeeded on attempt {attempt}")
                return True

            if attempt < max_retries:
                wait_time = RETRY_DELAY * (2 ** (attempt - 1))  # Exponential backoff
                logger.warning(f"Attempt {attempt} failed, retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                logger.error(f"All {max_retries} refresh attempts failed")
                logger.error(f"Final error output: {output}")

        return False

    def post_deployment_refresh(self) -> bool:
        """Execute post-deployment address refresh with validation."""
        logger.info("=== POST-DEPLOYMENT ADDRESS REFRESH ===")

        # Brief delay to ensure deployment transactions are mined
        logger.info("Waiting for deployment transactions to be mined...")
        time.sleep(10)

        # Validate system state first
        if not self.validate_blockchain_connectivity():
            logger.error("Blockchain validation failed, cannot refresh addresses")
            return False

        # Attempt refresh with retry logic
        success = self.auto_retry_refresh()

        if success:
            logger.info("Post-deployment address refresh completed successfully")
            # Validate that all required contracts are now available
            return self.validate_required_contracts()
        else:
            logger.error("Post-deployment address refresh failed")
            return False

    def validate_required_contracts(self) -> bool:
        """Validate that all required contracts are properly deployed."""
        logger.info("Validating required contract deployments...")

        # Read the addresses.env file to get current addresses
        addresses_file = REPO_ROOT / ".autobuilder" / "addresses.env"
        if not addresses_file.exists():
            logger.error("Addresses file does not exist")
            return False

        addresses = {}
        try:
            with open(addresses_file, 'r') as f:
                for line in f:
                    if '=' in line and not line.strip().startswith('#'):
                        key, value = line.strip().split('=', 1)
                        addresses[key] = value
        except Exception as e:
            logger.error(f"Failed to read addresses file: {e}")
            return False

        missing_contracts = []
        invalid_contracts = []

        for contract in REQUIRED_CONTRACTS:
            if contract not in addresses:
                missing_contracts.append(contract)
            else:
                address = addresses[contract]
                if not self.has_code(address):
                    invalid_contracts.append(f"{contract}={address}")

        if missing_contracts:
            logger.error(f"Missing required contracts: {missing_contracts}")
            return False

        if invalid_contracts:
            logger.error(f"Invalid contract addresses (no bytecode): {invalid_contracts}")
            return False

        logger.info(f"All {len(REQUIRED_CONTRACTS)} required contracts validated successfully")
        return True

    def continuous_monitoring(self, check_interval: int = HEALTH_CHECK_INTERVAL):
        """Continuous monitoring mode for drift detection and auto-correction."""
        logger.info(f"=== CONTINUOUS MONITORING MODE (interval: {check_interval}s) ===")

        while True:
            try:
                # Check for drift
                if self.detect_drift():
                    logger.warning("Address drift detected, attempting auto-correction...")
                    success = self.auto_retry_refresh()
                    if success:
                        logger.info("Auto-correction successful")
                    else:
                        logger.error("Auto-correction failed - manual intervention required")

                # Log current statistics
                total_checks = self.success_count + self.failure_count
                success_rate = (self.success_count / total_checks * 100) if total_checks > 0 else 0

                logger.info(f"Stats: {self.success_count} success, {self.failure_count} failures, "
                           f"{self.drift_detected_count} drift events, {success_rate:.1f}% success rate")

                # Sleep until next check
                time.sleep(check_interval)

            except KeyboardInterrupt:
                logger.info("Monitoring stopped by user")
                break
            except Exception as e:
                logger.error(f"Monitoring error: {e}")
                time.sleep(check_interval)

    def get_success_rate(self) -> float:
        """Calculate current success rate percentage."""
        total = self.success_count + self.failure_count
        return (self.success_count / total * 100) if total > 0 else 0

def main():
    parser = argparse.ArgumentParser(description="Automated Address Refresh System")
    parser.add_argument("--mode", choices=["post-deploy", "monitor", "validate"], required=True,
                      help="Operation mode")
    parser.add_argument("--check-interval", type=int, default=HEALTH_CHECK_INTERVAL,
                      help="Monitoring check interval in seconds")
    parser.add_argument("--max-retries", type=int, default=MAX_RETRIES,
                      help="Maximum retry attempts")

    args = parser.parse_args()

    automation = AddressRefreshAutomation()

    if args.mode == "validate":
        success = automation.preflight_validation()
        sys.exit(0 if success else 1)

    elif args.mode == "post-deploy":
        success = automation.post_deployment_refresh()
        sys.exit(0 if success else 1)

    elif args.mode == "monitor":
        automation.continuous_monitoring(args.check_interval)

        # Print final statistics when monitoring stops
        success_rate = automation.get_success_rate()
        logger.info(f"Final success rate: {success_rate:.1f}%")
        target_achieved = success_rate >= 90.0
        logger.info(f"Target >90% success rate: {'✅ ACHIEVED' if target_achieved else '❌ NOT ACHIEVED'}")
        sys.exit(0 if target_achieved else 1)

if __name__ == "__main__":
    main()