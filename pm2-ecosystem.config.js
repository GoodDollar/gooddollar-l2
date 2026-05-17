// PM2 Ecosystem Config — GoodDollar L2 Services
// Usage: pm2 start pm2-ecosystem.config.js && pm2 save && pm2 startup
//
// Before running: kill unsupervised GoodSwap PIDs 735615 735627 735628
module.exports = {
  apps: [
    {
      // goodswap: Next.js production server. The ONLY supported way to
      // roll a new build into this app is `cd frontend && npm run deploy`,
      // which runs `next build` and then `pm2 reload goodswap --update-env`.
      // Running `next build` without the reload leaves a stale BUILD_ID in
      // this process and breaks all CSS site-wide (HTTP 400 on
      // _next/static/css/*.css). See:
      //   .autobuilder/initiatives/0002-security-hardening/tasks/
      //     0060-fix-frontend-deploy-stale-buildid-pm2-reload.md
      //
      // The `script` below is `pm2-launch-next.mjs`, a structural fence that
      // validates `.next/` integrity (BUILD_ID, build-manifest.json, chunk
      // sampling) before spawning `next start`. If validation fails, the
      // launcher exits non-zero so PM2 keeps the previous instance running
      // and surfaces a clear error in `pm2 logs goodswap --err`. See:
      //   .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
      //     0018-iter18-blocker-frontend-build-regression-fence.md
      name: 'goodswap',
      script: 'scripts/pm2-launch-next.mjs',
      args: '--port 3100',
      interpreter: 'node',
      cwd: '/home/goodclaw/gooddollar-l2/frontend',
      restart_delay: 3000,
      max_restarts: 10,
      kill_timeout: 5000,
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'goodperps',
      script: 'dist/index.js',
      cwd: '/home/goodclaw/gooddollar-l2/backend/perps',
      restart_delay: 3000,
      max_restarts: 10,
      env: { NODE_ENV: 'production', PORT: '8082' },
    },
    {
      name: 'goodpredict',
      script: 'dist/index.js',
      cwd: '/home/goodclaw/gooddollar-l2/backend/predict',
      restart_delay: 3000,
      max_restarts: 10,
      env: { NODE_ENV: 'production' },
    },
  ],
};
