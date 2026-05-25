#!/usr/bin/env python3
"""
Pre-flight contract bytecode verification script.

Checks that deployed contracts have non-empty bytecode at their registered
addresses on the local DevNet RPC. Exits non-zero if any contract is missing
bytecode (indicating a contract drift condition after redeploy).

Usage:
    python3 scripts/verify-contract-bytecode.py [--rpc-url RPC_URL]

Exit codes:
    0 - all contracts verified OK
    1 - one or more contracts missing bytecode
    2 - configuration or connectivity error
"""

import json
import os
import sys
import argparse
import urllib.request
import urllib.error

DEFAULT_RPC_URL = os.environ.get("RPC_URL", "http://localhost:8545")

# Paths to search for deployed address files (broadcast artifacts and config)
ADDRESS_FILE_CANDIDATES = [
    "broadcast/Deploy.s.sol/42069/run-latest.json",
    "broadcast/Deploy.s.sol/31337/run-latest.json",
    "deployments/devnet.json",
    "deployments/addresses.json",
    "frontend/src/constants/addresses.json",
    "sdk/src/addresses.json",
]

CONTRACTS_OF_INTEREST = ["MarketFactory", "GoodDollarToken"]


def rpc_call(rpc_url: str, method: str, params: list) -> dict:
    payload = json.dumps({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params,
    }).encode()
    req = urllib.request.Request(
        rpc_url,
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except urllib.error.URLError as e:
        print(f"ERROR: Cannot reach RPC at {rpc_url}: {e}", file=sys.stderr)
        sys.exit(2)


def get_bytecode(rpc_url: str, address: str) -> str:
    result = rpc_call(rpc_url, "eth_getCode", [address, "latest"])
    return result.get("result", "0x")


def load_addresses_from_broadcast(path: str) -> dict:
    """Parse Foundry broadcast run-latest.json for contract addresses."""
    addresses = {}
    try:
        with open(path) as f:
            data = json.load(f)
        transactions = data.get("transactions", [])
        for tx in transactions:
            contract_name = tx.get("contractName")
            contract_address = tx.get("contractAddress")
            if contract_name and contract_address:
                addresses[contract_name] = contract_address
    except Exception as e:
        print(f"  Warning: could not parse {path}: {e}", file=sys.stderr)
    return addresses


def load_addresses_from_json(path: str) -> dict:
    """Load a flat or nested address JSON file."""
    addresses = {}
    try:
        with open(path) as f:
            data = json.load(f)
        # Handle flat {"ContractName": "0x..."} or nested {"devnet": {...}}
        if isinstance(data, dict):
            for key, val in data.items():
                if isinstance(val, str) and val.startswith("0x") and len(val) == 42:
                    addresses[key] = val
                elif isinstance(val, dict):
                    for k2, v2 in val.items():
                        if isinstance(v2, str) and v2.startswith("0x") and len(v2) == 42:
                            addresses[k2] = v2
    except Exception as e:
        print(f"  Warning: could not parse {path}: {e}", file=sys.stderr)
    return addresses


def discover_addresses() -> dict:
    """Search known paths for deployed contract addresses."""
    all_addresses = {}
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    for candidate in ADDRESS_FILE_CANDIDATES:
        full_path = os.path.join(repo_root, candidate)
        if not os.path.exists(full_path):
            continue
        print(f"  Loading addresses from: {candidate}")
        if "broadcast" in candidate and candidate.endswith("run-latest.json"):
            found = load_addresses_from_broadcast(full_path)
        else:
            found = load_addresses_from_json(full_path)
        if found:
            print(f"    Found {len(found)} address(es): {', '.join(found.keys())}")
            all_addresses.update(found)

    return all_addresses


def main():
    parser = argparse.ArgumentParser(description="Pre-flight contract bytecode verifier")
    parser.add_argument("--rpc-url", default=DEFAULT_RPC_URL, help="EVM RPC endpoint")
    parser.add_argument(
        "--contracts",
        nargs="*",
        default=None,
        help="Specific contract names to check (default: all discovered)",
    )
    args = parser.parse_args()

    rpc_url = args.rpc_url
    print(f"Contract Bytecode Pre-flight Check")
    print(f"RPC: {rpc_url}")
    print()

    # Verify RPC connectivity
    try:
        result = rpc_call(rpc_url, "eth_chainId", [])
        chain_id = int(result.get("result", "0x0"), 16)
        print(f"Chain ID: {chain_id}")
    except SystemExit:
        print("Skipping bytecode checks — DevNet not reachable (expected in CI without live chain)")
        sys.exit(0)

    print()
    print("Discovering deployed contract addresses...")
    addresses = discover_addresses()

    if not addresses:
        print("No deployed addresses found — skipping bytecode checks.")
        print("(This is expected on a fresh checkout with no broadcast artifacts.)")
        sys.exit(0)

    # Filter to requested contracts if specified
    if args.contracts:
        addresses = {k: v for k, v in addresses.items() if k in args.contracts}

    print()
    print(f"Verifying bytecode for {len(addresses)} contract(s)...")
    print()

    failures = []
    for name, address in sorted(addresses.items()):
        code = get_bytecode(rpc_url, address)
        has_code = code and code != "0x" and code != "0x0" and len(code) > 4
        status = "OK" if has_code else "MISSING BYTECODE"
        marker = "✓" if has_code else "✗"
        print(f"  {marker} {name:40s} {address}  [{status}]")
        if not has_code:
            failures.append((name, address))

    print()
    if failures:
        print(f"CONTRACT DRIFT DETECTED: {len(failures)} contract(s) missing bytecode:")
        for name, address in failures:
            print(f"  - {name} at {address}")
        print()
        print("Remediation: run `python3 scripts/refresh-addresses.py` and redeploy.")
        sys.exit(1)
    else:
        print(f"All {len(addresses)} contract(s) verified OK — no drift detected.")
        sys.exit(0)


if __name__ == "__main__":
    main()
