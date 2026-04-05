"use strict";
/**
 * ActivityReporter — Core engine
 *
 * Polls protocol contracts for trading events (Swap, PositionOpened, Supply, etc.)
 * and calls AgentRegistry.recordActivity() to update on-chain agent stats.
 *
 * Architecture:
 *   1. For each protocol, create an ethers.Contract with its event ABI
 *   2. Every POLL_INTERVAL_MS, query getLogs from lastBlock+1 to latest
 *   3. Parse each log → extract (trader, volume, fee)
 *   4. Batch-call recordActivity on AgentRegistry
 *   5. Track lastProcessedBlock in memory (and optionally to disk)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityReporter = void 0;
const ethers_1 = require("ethers");
const config_1 = require("./config");
const abis_1 = require("./abis");
// ─── ABI Mapping ──────────────────────────────────────────────────────────────
const PROTOCOL_ABIS = {
    [config_1.ADDRESSES.GoodSwapRouter]: abis_1.GoodSwapRouterABI,
    [config_1.ADDRESSES.PerpEngine]: abis_1.PerpEngineABI,
    [config_1.ADDRESSES.GoodLendPool]: abis_1.GoodLendPoolABI,
    [config_1.ADDRESSES.MarketFactory]: abis_1.MarketFactoryABI,
    [config_1.ADDRESSES.CollateralVault]: abis_1.CollateralVaultABI,
};
// ─── Reporter Class ───────────────────────────────────────────────────────────
class ActivityReporter {
    provider;
    signer;
    registry;
    protocolContracts = new Map();
    lastBlock = 0;
    running = false;
    stats;
    constructor(rpcUrl = config_1.RPC_URL, reporterKey = config_1.REPORTER_KEY) {
        this.provider = new ethers_1.JsonRpcProvider(rpcUrl);
        this.signer = new ethers_1.Wallet(reporterKey, this.provider);
        this.registry = new ethers_1.Contract(config_1.ADDRESSES.AgentRegistry, abis_1.AgentRegistryABI, this.signer);
        // Create contract instances for each protocol
        for (const proto of config_1.PROTOCOLS) {
            const abi = PROTOCOL_ABIS[proto.address];
            if (abi) {
                this.protocolContracts.set(proto.address, new ethers_1.Contract(proto.address, abi, this.provider));
            }
        }
        this.stats = {
            totalReported: 0,
            totalErrors: 0,
            lastBlock: 0,
            startedAt: Date.now(),
            protocols: {},
        };
    }
    // ─── Lifecycle ────────────────────────────────────────────────────────────
    async start() {
        console.log('🔍 ActivityReporter starting...');
        console.log(`   RPC: ${config_1.RPC_URL}`);
        console.log(`   Registry: ${config_1.ADDRESSES.AgentRegistry}`);
        console.log(`   Protocols: ${config_1.PROTOCOLS.map((p) => p.name).join(', ')}`);
        // Ensure we're authorized as a reporter
        await this.ensureReporter();
        // Set initial block
        const currentBlock = await this.provider.getBlockNumber();
        this.lastBlock = Math.max(0, currentBlock - config_1.INITIAL_LOOKBACK);
        console.log(`   Scanning from block ${this.lastBlock} (current: ${currentBlock})`);
        this.running = true;
        this.poll();
    }
    stop() {
        this.running = false;
        console.log('🛑 ActivityReporter stopped');
    }
    getStats() {
        return { ...this.stats, lastBlock: this.lastBlock };
    }
    // ─── Core Loop ────────────────────────────────────────────────────────────
    async poll() {
        while (this.running) {
            try {
                await this.scanAndReport();
            }
            catch (err) {
                console.error('❌ Poll error:', err.message);
                this.stats.totalErrors++;
            }
            await sleep(config_1.POLL_INTERVAL_MS);
        }
    }
    async scanAndReport() {
        const currentBlock = await this.provider.getBlockNumber();
        if (currentBlock <= this.lastBlock)
            return [];
        const fromBlock = this.lastBlock + 1;
        const toBlock = currentBlock;
        const allRecords = [];
        for (const proto of config_1.PROTOCOLS) {
            const contract = this.protocolContracts.get(proto.address);
            if (!contract)
                continue;
            for (const eventDef of proto.events) {
                try {
                    const records = await this.scanProtocolEvent(proto, eventDef, contract, fromBlock, toBlock);
                    allRecords.push(...records);
                }
                catch (err) {
                    console.error(`  ❌ Error scanning ${proto.name}/${eventDef.signature}:`, err.message);
                    this.stats.totalErrors++;
                }
            }
        }
        // Batch report to AgentRegistry
        if (allRecords.length > 0) {
            await this.batchReport(allRecords);
        }
        this.lastBlock = toBlock;
        this.stats.lastBlock = toBlock;
        return allRecords;
    }
    // ─── Event Scanning ───────────────────────────────────────────────────────
    async scanProtocolEvent(proto, eventDef, contract, fromBlock, toBlock) {
        // Get the event fragment from the contract interface
        const eventName = eventDef.signature.split('(')[0];
        const fragment = contract.interface.getEvent(eventName);
        if (!fragment)
            return [];
        const topicHash = contract.interface.getEvent(eventName).topicHash;
        // Query logs
        const logs = await this.provider.getLogs({
            address: proto.address,
            topics: [topicHash],
            fromBlock,
            toBlock,
        });
        const records = [];
        for (const log of logs) {
            try {
                const parsed = contract.interface.parseLog({
                    topics: log.topics,
                    data: log.data,
                });
                if (!parsed)
                    continue;
                const trader = this.extractTrader(parsed, eventDef);
                const volume = this.extractVolume(parsed, eventDef);
                const fees = this.computeFees(parsed, eventDef, volume);
                if (trader && volume > 0n) {
                    records.push({
                        protocol: proto.name,
                        trader,
                        volume,
                        fees,
                        txHash: log.transactionHash,
                        blockNumber: log.blockNumber,
                        eventName: parsed.name,
                    });
                }
            }
            catch (err) {
                // Skip unparseable logs
            }
        }
        return records;
    }
    extractTrader(parsed, eventDef) {
        const val = parsed.args[eventDef.traderField];
        return typeof val === 'string' ? val : val?.toString() || '';
    }
    extractVolume(parsed, eventDef) {
        const val = parsed.args[eventDef.volumeField];
        if (typeof val === 'bigint')
            return val;
        try {
            return BigInt(val.toString());
        }
        catch {
            return 0n;
        }
    }
    computeFees(parsed, eventDef, volume) {
        // If there's a direct fee field in the event, use it
        if (eventDef.feeField) {
            const val = parsed.args[eventDef.feeField];
            if (typeof val === 'bigint')
                return val;
            try {
                return BigInt(val.toString());
            }
            catch {
                return 0n;
            }
        }
        // Otherwise, compute from feeBPS
        if (eventDef.feeBPS && eventDef.feeBPS > 0) {
            return (volume * BigInt(eventDef.feeBPS)) / 10000n;
        }
        return 0n;
    }
    // ─── Reporting ────────────────────────────────────────────────────────────
    async batchReport(records) {
        console.log(`📊 Reporting ${records.length} activities to AgentRegistry...`);
        for (const record of records) {
            try {
                const tx = await this.registry.recordActivity(record.trader, record.protocol, record.volume, record.fees);
                await tx.wait();
                this.stats.totalReported++;
                this.stats.protocols[record.protocol] =
                    (this.stats.protocols[record.protocol] || 0) + 1;
                console.log(`  ✅ ${record.protocol}: ${record.eventName} by ${record.trader.slice(0, 10)}... vol=${ethers_1.ethers.formatEther(record.volume)} fees=${ethers_1.ethers.formatEther(record.fees)}`);
            }
            catch (err) {
                console.error(`  ❌ Failed to report ${record.protocol}/${record.eventName}: ${err.message}`);
                this.stats.totalErrors++;
            }
        }
    }
    // ─── Setup ────────────────────────────────────────────────────────────────
    async ensureReporter() {
        const myAddress = await this.signer.getAddress();
        const isReporter = await this.registry.authorizedReporters(myAddress);
        if (!isReporter) {
            console.log(`  🔑 Adding ${myAddress} as authorized reporter...`);
            const tx = await this.registry.addReporter(myAddress);
            await tx.wait();
            console.log(`  ✅ Reporter authorized`);
        }
        else {
            console.log(`  ✅ Already authorized as reporter`);
        }
    }
}
exports.ActivityReporter = ActivityReporter;
// ─── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=reporter.js.map