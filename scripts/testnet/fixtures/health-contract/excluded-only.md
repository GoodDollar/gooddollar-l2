# Test fixture: oracle-signer in EXCLUDED only

## Required services in `/api/status`

| service       | role         |
|---------------|--------------|
| `swap-oracle` | swap pricing |

## Documented exclusions (warn but pass)

| service          | reason                | owner iter |
|------------------|-----------------------|------------|
| `oracle-signer`  | health-only mode      | lane7      |
