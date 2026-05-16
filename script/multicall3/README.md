# Vendored Multicall3 (devnet-only)

`Multicall3.sol` is a portable, no-assembly variant of the canonical
[mds1/multicall](https://github.com/mds1/multicall) `Multicall3`
contract. It exposes the same external ABI (function selectors and
struct layout) so wagmi/viem tooling works against it without changes.

It is only used on the local Anvil devnet, where
`script/deploy-multicall3-devnet.sh` injects its runtime bytecode at
the canonical address `0xcA11bde05977b3631167028862bE2a173976CA11`
via `anvil_setCode`. On real networks (mainnet, OP Mainnet, OP
Sepolia, Base, etc.) the canonical Multicall3 is already deployed at
the same address; we never deploy this variant there.

Why no assembly: the upstream Multicall3 was tuned for `solc 0.8.12`
and uses inline assembly tricks (`calldataload(add(calli, 0x20))`)
whose calldata layout assumptions can shift under different solc
versions and `via_ir` settings. This repo runs `via_ir = true` in
`foundry.toml`, so we use a plain-Solidity variant that compiles
cleanly on any modern solc + via-IR combination. Off-chain consumers
of Multicall3 only depend on the external ABI, which is preserved.

Why we need this at all: see
`.autobuilder/initiatives/0002-security-hardening/tasks/0059-deploy-multicall3-and-wire-chain-batching.md`.
TL;DR: without Multicall3 at `0xcA11…CA11`, wagmi's
`useReadContracts` silently falls back to N parallel `eth_call`
requests, which is exactly what we observed on `/stocks`, `/perps`,
`/lend`, and the sidebar wallet widget.
