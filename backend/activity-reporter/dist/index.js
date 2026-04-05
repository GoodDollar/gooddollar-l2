"use strict";
/**
 * Activity Reporter — Entry point
 *
 * Starts the ActivityReporter daemon that watches all GoodDollar L2
 * protocol contracts for trading events and auto-reports them to
 * the AgentRegistry contract.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const reporter_1 = require("./reporter");
async function main() {
    console.log('═══════════════════════════════════════════════');
    console.log('  GoodDollar L2 — Activity Reporter Keeper');
    console.log('═══════════════════════════════════════════════');
    const reporter = new reporter_1.ActivityReporter();
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
//# sourceMappingURL=index.js.map