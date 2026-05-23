# Test fixture: oracle-signer absent from both

## Required services in `/api/status`

| service       | role         |
|---------------|--------------|
| `swap-oracle` | swap pricing |

## Documented exclusions (warn but pass)

| service          | reason            | owner iter |
|------------------|-------------------|------------|
| `harvest-keeper` | flapping restart  | 4          |
