/**
 * Activity Reporter — Entry point
 *
 * Starts the ActivityReporter daemon that watches all GoodDollar L2
 * protocol contracts for trading events and auto-reports them to
 * the AgentRegistry contract.
 */

import { ActivityReporter } from './reporter';
import { startHealthServer } from './healthServer';

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

  try {
    await reporter.start();
  } catch (err) {
    process.env.SERVICE_HEALTH_STATUS = 'degraded';
    process.env.SERVICE_DISABLED_REASON = 'AgentRegistry unavailable; activity reporting loop disabled';
    console.error('Activity reporter disabled:', err);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
