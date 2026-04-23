#!/usr/bin/env python3
"""Deploy ValidatorStakingDevnet to devnet with reduced minimum stake."""
import subprocess, os, sys

FORGE = "/home/goodclaw/.foundry/bin/forge"
CWD   = "/home/goodclaw/gooddollar-l2"

env = dict(os.environ)
env["PATH"] = "/home/goodclaw/.foundry/bin:" + env.get("PATH", "")
env.setdefault("PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")

print("=== GOO-547 Fix: Deploying ValidatorStakingDevnet ===")
print("Script: DeployValidatorStakingDevnet.s.sol")
print("Min stake: 10k GDT (reduced from 1M GDT)")

result = subprocess.run(
    [FORGE, "script", "script/DeployValidatorStakingDevnet.s.sol:DeployValidatorStakingDevnet",
     "--rpc-url", "http://localhost:8545",
     "--broadcast", "--legacy"],
    cwd=CWD,
    env=env,
    capture_output=False,
    text=True,
)

if result.returncode == 0:
    print("\n✅ ValidatorStakingDevnet deployment completed successfully!")
    print("Next step: Update VS address in .autobuilder/addresses.env")
else:
    print(f"\n❌ Deployment failed with exit code {result.returncode}")

sys.exit(result.returncode)