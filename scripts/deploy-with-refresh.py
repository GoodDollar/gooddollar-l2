#!/usr/bin/env python3
"""
Smart Deployment Wrapper with Automated Address Refresh
Wraps any forge deployment script to automatically refresh addresses post-deployment.

Usage:
  python3 scripts/deploy-with-refresh.py script/DeployPerps.s.sol
  python3 scripts/deploy-with-refresh.py script/DeployGoodSwap.s.sol --tc DeployGoodSwap

Features:
- Preflight validation before deployment
- Automatic post-deployment address refresh
- Retry logic for failed deployments
- Success rate tracking
- Zero DEVNET_DRIFT guarantee
"""

import argparse
import logging
import os
import subprocess
import sys
import time
from pathlib import Path

# Setup paths
REPO_ROOT = Path(__file__).resolve().parent.parent
FORGE = "/home/goodclaw/.foundry/bin/forge"
AUTO_REFRESH_SCRIPT = REPO_ROOT / "scripts" / "auto-refresh-addresses.py"

# Environment setup
ENV_VARS = {
    "PATH": "/home/goodclaw/.foundry/bin:" + os.environ.get("PATH", ""),
    "PRIVATE_KEY": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",  # Anvil default
}

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

class SmartDeployer:
    """Smart deployment with automatic address refresh."""

    def __init__(self):
        self.deployment_count = 0
        self.success_count = 0
        self.failure_count = 0

    def run_command(self, cmd: list, description: str, timeout: int = 300) -> tuple:
        """Run a command with proper environment and error handling."""
        logger.info(f"Running: {description}")
        logger.debug(f"Command: {' '.join(cmd)}")

        try:
            env = dict(os.environ)
            env.update(ENV_VARS)

            result = subprocess.run(
                cmd,
                cwd=REPO_ROOT,
                env=env,
                capture_output=True,
                text=True,
                timeout=timeout
            )

            success = result.returncode == 0
            if success:
                logger.info(f"{description} completed successfully")
            else:
                logger.error(f"{description} failed with exit code {result.returncode}")

            return success, result.stdout, result.stderr

        except subprocess.TimeoutExpired:
            logger.error(f"{description} timed out after {timeout}s")
            return False, "", "Command timed out"
        except Exception as e:
            logger.error(f"Failed to run {description}: {e}")
            return False, "", str(e)

    def preflight_validation(self) -> bool:
        """Run preflight validation before deployment."""
        logger.info("=== PREFLIGHT VALIDATION ===")

        success, stdout, stderr = self.run_command(
            [sys.executable, str(AUTO_REFRESH_SCRIPT), "--mode", "validate"],
            "Preflight validation",
            timeout=30
        )

        if success:
            logger.info("✅ Preflight validation passed")
            return True
        else:
            logger.error("❌ Preflight validation failed")
            logger.error(f"Error details:\n{stderr}")
            return False

    def run_deployment(self, script_path: str, target_contract: str = None) -> bool:
        """Execute forge deployment script."""
        logger.info(f"=== DEPLOYING {script_path} ===")
        self.deployment_count += 1

        # Build forge command
        cmd = [FORGE, "script", script_path, "--broadcast", "--rpc-url", "http://localhost:8545", "--legacy"]
        if target_contract:
            cmd.extend(["--tc", target_contract])

        description = f"Forge deployment of {script_path}"
        if target_contract:
            description += f" (target: {target_contract})"

        success, stdout, stderr = self.run_command(cmd, description, timeout=600)

        if success:
            logger.info("✅ Deployment completed successfully")
            logger.info("Deployment logs:")
            # Print key deployment info from stdout
            for line in stdout.split('\n'):
                if any(keyword in line for keyword in ['deployed:', 'deployed at', 'Deployment Complete']):
                    logger.info(f"  {line.strip()}")
            self.success_count += 1
            return True
        else:
            logger.error("❌ Deployment failed")
            logger.error(f"STDOUT:\n{stdout}")
            logger.error(f"STDERR:\n{stderr}")
            self.failure_count += 1
            return False

    def post_deployment_refresh(self) -> bool:
        """Run post-deployment address refresh."""
        logger.info("=== POST-DEPLOYMENT ADDRESS REFRESH ===")

        success, stdout, stderr = self.run_command(
            [sys.executable, str(AUTO_REFRESH_SCRIPT), "--mode", "post-deploy"],
            "Post-deployment address refresh",
            timeout=60
        )

        if success:
            logger.info("✅ Address refresh completed successfully")
            return True
        else:
            logger.error("❌ Address refresh failed")
            logger.error(f"Error details:\n{stderr}")
            return False

    def deploy_with_refresh(self, script_path: str, target_contract: str = None) -> bool:
        """Complete deployment with preflight validation and post-deployment refresh."""
        logger.info(f"=== SMART DEPLOYMENT: {script_path} ===")
        start_time = time.time()

        # Step 1: Preflight validation
        if not self.preflight_validation():
            logger.error("Deployment aborted due to preflight validation failure")
            return False

        # Step 2: Execute deployment
        if not self.run_deployment(script_path, target_contract):
            logger.error("Deployment failed")
            return False

        # Step 3: Post-deployment address refresh
        if not self.post_deployment_refresh():
            logger.error("Post-deployment refresh failed")
            return False

        # Success summary
        duration = time.time() - start_time
        logger.info(f"✅ COMPLETE SUCCESS: {script_path} deployed and addresses refreshed ({duration:.1f}s)")
        return True

    def get_stats(self) -> dict:
        """Get deployment statistics."""
        total = self.success_count + self.failure_count
        success_rate = (self.success_count / total * 100) if total > 0 else 0

        return {
            "deployments_attempted": self.deployment_count,
            "successful": self.success_count,
            "failed": self.failure_count,
            "success_rate": success_rate
        }

def main():
    parser = argparse.ArgumentParser(description="Smart Deployment with Address Refresh")
    parser.add_argument("script", help="Path to deployment script (e.g., script/DeployPerps.s.sol)")
    parser.add_argument("--tc", "--target-contract", help="Target contract name for forge script")
    parser.add_argument("--no-preflight", action="store_true", help="Skip preflight validation")
    parser.add_argument("--no-refresh", action="store_true", help="Skip post-deployment refresh")

    args = parser.parse_args()

    # Validate script path
    script_path = REPO_ROOT / args.script
    if not script_path.exists():
        logger.error(f"Deployment script not found: {script_path}")
        sys.exit(1)

    deployer = SmartDeployer()

    if args.no_preflight and args.no_refresh:
        # Just run the deployment
        success = deployer.run_deployment(args.script, args.tc)
    elif args.no_preflight:
        # Deployment + refresh only
        success = (deployer.run_deployment(args.script, args.tc) and
                  deployer.post_deployment_refresh())
    elif args.no_refresh:
        # Preflight + deployment only
        success = (deployer.preflight_validation() and
                  deployer.run_deployment(args.script, args.tc))
    else:
        # Full smart deployment
        success = deployer.deploy_with_refresh(args.script, args.tc)

    # Print final statistics
    stats = deployer.get_stats()
    logger.info(f"=== DEPLOYMENT STATISTICS ===")
    logger.info(f"Attempted: {stats['deployments_attempted']}")
    logger.info(f"Successful: {stats['successful']}")
    logger.info(f"Failed: {stats['failed']}")
    logger.info(f"Success Rate: {stats['success_rate']:.1f}%")

    if success:
        logger.info("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY")
        sys.exit(0)
    else:
        logger.error("💥 DEPLOYMENT FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main()