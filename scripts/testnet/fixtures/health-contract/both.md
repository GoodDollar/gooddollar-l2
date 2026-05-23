# Test fixture: oracle-signer in REQUIRED and EXCLUDED both

## Required services in `/api/status`

| service          | role           |
|------------------|----------------|
| `oracle-signer`  | testnet signer |

## Documented exclusions (warn but pass)

| service          | reason           | owner iter |
|------------------|------------------|------------|
| `oracle-signer`  | stale row        | lane7      |
