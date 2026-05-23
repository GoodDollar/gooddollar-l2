# Test fixture: name collides with public-surface row

## Required public surfaces (gate fails if any breaks)

| Surface              | Required behavior |
|----------------------|-------------------|
| `https://example/api`| HTTP 200          |
| `oracle-signer`      | service-name collision (contract bug) |

## Documented exclusions (warn but pass)

| service       | reason           | owner iter |
|---------------|------------------|------------|
| `swap-oracle` | flapping         | 4          |
