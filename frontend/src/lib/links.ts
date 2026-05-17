/**
 * Canonical external links for the GoodDollar L2 frontend.
 *
 * Centralises URLs that point outside the running app (GitHub repo,
 * canonical doc files, issue tracker) so they cannot drift between pages.
 *
 * `GITHUB_REPO_URL` matches `git remote get-url origin` for this repo
 * (less the `.git` suffix, which browsers do not want).
 */

export const GITHUB_REPO_URL = 'https://github.com/GoodDollar/gooddollar-l2'

const GITHUB_BLOB_MAIN = `${GITHUB_REPO_URL}/blob/main`

export const GITHUB_LINKS = {
  repo: GITHUB_REPO_URL,
  addressesJson: `${GITHUB_BLOB_MAIN}/op-stack/addresses.json`,
  architectureDoc: `${GITHUB_BLOB_MAIN}/docs/ARCHITECTURE.md`,
  testnetReadme: `${GITHUB_BLOB_MAIN}/docs/TESTNET_README.md`,
  newTestnetIssue: `${GITHUB_REPO_URL}/issues/new?labels=testnet-feedback`,
} as const
