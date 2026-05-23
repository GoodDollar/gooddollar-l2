# Test fixture: oracle-signer in REQUIRED only

## Required services in `/api/status`

| service          | role              |
|------------------|-------------------|
| `swap-oracle`    | swap pricing      |
| `oracle-signer`  | testnet signer    |

## Documented exclusions (warn but pass)

| service             | reason                          | owner iter |
|---------------------|---------------------------------|------------|
| `activity-reporter` | flapping waiting restart        | 4          |
