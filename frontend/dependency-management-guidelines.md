# Dependency Management Guidelines
**GoodDollar L2 Frontend - 2026-05-17**

## Overview
This document establishes best practices for managing dependencies in the GoodDollar L2 frontend to maintain security, performance, and stability.

## Dependency Categories & Policies

### Production Dependencies
**Policy**: Minimize surface area, prioritize security and bundle size impact

#### Web3 & Blockchain
```json
{
  "@rainbow-me/rainbowkit": "^2.x.x",  // Wallet connection UI
  "wagmi": "^2.x.x",                   // React hooks for Ethereum
  "viem": "^2.x.x"                     // TypeScript Ethereum library
}
```
- **Update Policy**: Patch updates automatic, minor updates reviewed, major updates planned
- **Bundle Impact**: High - isolated in async web3-vendor chunk

#### UI Components  
```json
{
  "@radix-ui/react-*": "^1.x.x",      // Accessibility-first primitives
  "lucide-react": "^1.x.x",           // Icon library
  "framer-motion": "^12.x.x"          // Animation library
}
```
- **Update Policy**: Patch/minor automatic, major planned
- **Bundle Impact**: Medium - grouped in ui-vendor chunk
- **Note**: Only install Radix components actually used

#### Core Framework
```json
{
  "next": "^14.x.x",                  // Main framework
  "react": "^18.x.x",                 // React core
  "react-dom": "^18.x.x"              // React DOM
}
```
- **Update Policy**: Conservative - test thoroughly before major updates
- **Security Priority**: High - monitor for security patches

### Development Dependencies
**Policy**: Support developer experience without impacting production bundle

#### Testing & Quality
```json
{
  "vitest": "^4.x.x",                 // Unit testing
  "@playwright/test": "^1.x.x",       // E2E testing
  "@axe-core/playwright": "^4.x.x",   // Accessibility testing
  "@testing-library/react": "^16.x.x" // React testing utilities
}
```

#### Build & Development Tools
```json
{
  "typescript": "^5.x.x",             // Type checking
  "eslint": "^8.x.x",                 // Linting
  "@next/bundle-analyzer": "^16.x.x", // Bundle analysis
  "tailwindcss": "^3.x.x"             // CSS framework
}
```

## Version Management Strategy

### Pinning Rules
```json
{
  // Caret ranges for stable packages
  "next": "^14.2.0",
  
  // Tilde for cautious updates
  "some-unstable-package": "~1.2.3",
  
  // Exact pins for security-critical packages
  "crypto-sensitive-lib": "2.1.4"
}
```

### Update Cadence
- **Daily**: Automated security patches (Dependabot/Renovate)
- **Weekly**: Review and approve patch/minor updates  
- **Monthly**: Evaluate major version updates
- **Quarterly**: Comprehensive dependency audit

## Security Management

### Vulnerability Response
```bash
# Daily security check
npm audit --audit-level=moderate

# Address high/critical immediately
npm audit fix --force  # Only for low-risk packages

# Manual review for complex vulnerabilities
npm ls --depth=0 [vulnerable-package]
```

### Security Overrides
```json
{
  "overrides": {
    "glob": ">=10.4.0",              // CVE fixes
    "vulnerable-dep": ">=1.2.3"     // Security patches
  }
}
```

### Security Monitoring
- **Automated**: GitHub Security Advisories
- **Manual**: Monthly npm audit reviews
- **External**: Snyk/Dependabot integration

## Bundle Optimization Guidelines

### Dependency Impact Assessment
Before adding any dependency:

1. **Bundle Size Check**:
   ```bash
   npm install [package] --dry-run
   npm run analyze  # Check bundle impact
   ```

2. **Tree Shaking Verification**:
   - Prefer packages with ES modules
   - Check for side effects in package.json
   - Verify webpack can tree-shake unused exports

3. **Alternative Analysis**:
   - Can this be implemented with existing dependencies?
   - Are there lighter alternatives?
   - Is the functionality critical enough to justify bundle size?

### Bundle Budgets
```javascript
// next.config.js webpack optimization
experimental: {
  optimizePackageImports: [
    'viem',           // Critical for tree-shaking
    'wagmi',
    '@rainbow-me/rainbowkit',
    '@tanstack/react-query',
  ],
}
```

## Maintenance Procedures

### Weekly Dependency Review
```bash
# Check for outdated packages
npm outdated

# Security audit
npm audit

# Bundle size verification
npm run check:perf
```

### Monthly Deep Audit
1. **Unused Dependency Detection**:
   ```bash
   npx depcheck --skip-missing
   ```

2. **Duplicate Dependency Analysis**:
   ```bash
   npm ls --depth=0 | grep -E "├──|└──"
   ```

3. **Bundle Composition Review**:
   ```bash
   npm run analyze
   # Review webpack-bundle-analyzer reports
   ```

### Quarterly Architecture Review  
1. **Major Version Roadmap**: Plan breaking change migrations
2. **Performance Benchmarking**: Compare bundle sizes over time
3. **Security Posture**: Review dependency security practices
4. **Technology Evaluation**: Assess new tools/libraries

## Upgrade Procedures

### Patch Updates (Automatic)
```bash
# Patch updates (1.2.3 → 1.2.4)
npm update

# Verify no breaking changes
npm test
npm run build
```

### Minor Updates (Weekly Review)
```bash
# Minor updates (1.2.0 → 1.3.0) 
npm install package@^1.3.0

# Test suite verification
npm run test:e2e
npm run check:perf
```

### Major Updates (Planned Migration)
```bash
# Create feature branch
git checkout -b upgrade/next-15

# Install with exact version first
npm install next@15.0.0 --save-exact

# Test thoroughly
npm test
npm run build
npm run test:e2e

# Check for breaking changes
# Review migration guides
# Update related dependencies
```

## Troubleshooting Guide

### Common Issues

#### Peer Dependency Conflicts
```bash
# Check dependency tree
npm ls

# Resolve with overrides
npm pkg set overrides.conflicting-dep="version"
```

#### Bundle Size Increases
```bash
# Identify large additions
npm run analyze

# Compare before/after
npm run check:landing-bundle
```

#### Security Vulnerability Conflicts
```bash
# Check vulnerability path
npm audit --json | jq '.vulnerabilities'

# Use overrides for deep dependencies
npm pkg set overrides.deep-vulnerable-dep=">=fixed-version"
```

## Development Workflow Integration

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm audit && npm run check:perf"
    }
  }
}
```

### CI/CD Integration
```yaml
# .github/workflows/dependencies.yml
- name: Dependency Security Audit
  run: npm audit --audit-level=moderate

- name: Bundle Size Check  
  run: npm run check:perf

- name: Outdated Dependencies Report
  run: npm outdated || true
```

## Emergency Procedures

### Critical Security Vulnerability
1. **Immediate Assessment**: Evaluate vulnerability impact
2. **Hotfix Branch**: Create emergency fix branch
3. **Minimal Change**: Apply smallest possible fix
4. **Expedited Testing**: Run critical test paths
5. **Emergency Deploy**: Deploy with monitoring
6. **Follow-up**: Plan comprehensive fix in next sprint

### Broken Build from Dependency Update
1. **Revert**: `git revert` the problematic commit
2. **Pin Version**: Add exact version constraint
3. **Investigation**: Identify breaking change
4. **Staged Fix**: Plan proper migration
5. **Communication**: Document issue for team

## Success Metrics

### Performance KPIs
- Landing page bundle < 1500KB
- No web3-vendor on marketing pages
- Individual chunks < 200KB
- Build time < 2 minutes

### Security KPIs  
- Zero high/critical vulnerabilities
- < 7 day resolution time for security issues
- 100% automated security scanning

### Maintenance KPIs
- < 10% outdated dependencies
- Zero unused dependencies
- Monthly dependency review completion

## Tools & Resources

### Required Tools
- **npm audit**: Security scanning
- **depcheck**: Unused dependency detection  
- **webpack-bundle-analyzer**: Bundle composition
- **npm outdated**: Update availability

### Recommended Extensions
- **Dependabot**: Automated dependency PRs
- **Snyk**: Advanced security scanning
- **Renovate**: Intelligent dependency updates

## Conclusion
These guidelines ensure the GoodDollar L2 frontend maintains its excellent bundle optimization while staying secure and maintainable. Regular adherence to these practices prevents technical debt accumulation and maintains world-class performance standards.