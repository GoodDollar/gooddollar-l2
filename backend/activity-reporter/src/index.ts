/**
 * Activity Reporter — Entry point
 *
 * Starts the ActivityReporter daemon that watches all GoodDollar L2
 * protocol contracts for trading events and auto-reports them to
 * the AgentRegistry contract.
 */

import { ActivityReporter } from './reporter';
import { startHealthServer } from '../../shared/healthServer';

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  GoodDollar L2 — Activity Reporter Keeper');
  console.log('═══════════════════════════════════════════════');

  const reporter = new ActivityReporter();

  startHealthServer({
    name: 'activity-reporter',
    port: parseInt(process.env.HEALTH_PORT ?? '9101', 10),
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    reporter.stop();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    reporter.stop();
    process.exit(0);
  });

  await reporter.start();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
