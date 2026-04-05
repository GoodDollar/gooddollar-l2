"use strict";
/**
 * Revenue Tracker Keeper — Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib");
beforeEach(() => {
    (0, lib_1.resetLastReported)();
});
// ─── computeDelta Tests ──────────────────────────────────────────────────────
describe('computeDelta', () => {
    it('returns full report for first-time protocol with fees', () => {
        const report = {
            protocolId: 99,
            name: 'TestProtocol',
            totalFees: 1000n * 10n ** 18n,
            ubiPortion: 330n * 10n ** 18n,
            txCount: 50n,
        };
        const delta = (0, lib_1.computeDelta)(report);
        expect(delta).not.toBeNull();
        expect(delta.fees).toBe(1000n * 10n ** 18n);
        expect(delta.ubi).toBe(330n * 10n ** 18n);
        expect(delta.txs).toBe(50n);
    });
    it('returns null for first-time protocol with zero fees', () => {
        const report = {
            protocolId: 100,
            name: 'EmptyProtocol',
            totalFees: 0n,
            ubiPortion: 0n,
            txCount: 0n,
        };
        const delta = (0, lib_1.computeDelta)(report);
        expect(delta).toBeNull();
    });
    it('computes incremental delta after first report', () => {
        // First report
        (0, lib_1.setLastReported)(0, 1000n, 10n);
        const report = {
            protocolId: 0,
            name: 'GoodSwap',
            totalFees: 1500n,
            ubiPortion: 495n,
            txCount: 15n,
        };
        const delta = (0, lib_1.computeDelta)(report);
        expect(delta).not.toBeNull();
        expect(delta.fees).toBe(500n); // 1500 - 1000
        expect(delta.txs).toBe(5n); // 15 - 10
        expect(delta.ubi).toBe(165n); // 500 * 33 / 100
    });
    it('returns null when no change since last report', () => {
        (0, lib_1.setLastReported)(1, 500n, 20n);
        const report = {
            protocolId: 1,
            name: 'GoodPerps',
            totalFees: 500n,
            ubiPortion: 165n,
            txCount: 20n,
        };
        const delta = (0, lib_1.computeDelta)(report);
        expect(delta).toBeNull();
    });
    it('handles fees decreasing (resets — treats as zero delta)', () => {
        (0, lib_1.setLastReported)(2, 1000n, 50n);
        const report = {
            protocolId: 2,
            name: 'GoodPredict',
            totalFees: 800n, // decreased (should not happen but handle gracefully)
            ubiPortion: 264n,
            txCount: 50n,
        };
        const delta = (0, lib_1.computeDelta)(report);
        expect(delta).toBeNull(); // 0 delta on both
    });
});
// ─── calcUBI Tests ───────────────────────────────────────────────────────────
describe('calcUBI', () => {
    it('33% of 10000 G$ = 3300 G$', () => {
        const fees = 10000n * 10n ** 18n;
        expect((0, lib_1.calcUBI)(fees)).toBe(3300n * 10n ** 18n);
    });
    it('33% rounds down for non-divisible amounts', () => {
        expect((0, lib_1.calcUBI)(100n)).toBe(33n);
    });
    it('handles zero fees', () => {
        expect((0, lib_1.calcUBI)(0n)).toBe(0n);
    });
    it('handles 1 wei', () => {
        expect((0, lib_1.calcUBI)(1n)).toBe(0n); // floor(0.33)
    });
    it('handles large numbers', () => {
        const oneBillion = 1000000000n * 10n ** 18n;
        expect((0, lib_1.calcUBI)(oneBillion)).toBe(330000000n * 10n ** 18n);
    });
});
// ─── Protocol Configuration Tests ────────────────────────────────────────────
describe('PROTOCOLS configuration', () => {
    it('has 7 registered protocols', () => {
        expect(lib_1.PROTOCOLS).toHaveLength(7);
    });
    it('protocol IDs are sequential 0-6', () => {
        lib_1.PROTOCOLS.forEach((p, i) => {
            expect(p.id).toBe(i);
        });
    });
    it('all protocols have name and category', () => {
        lib_1.PROTOCOLS.forEach(p => {
            expect(p.name).toBeTruthy();
            expect(p.category).toBeTruthy();
        });
    });
    it('protocol categories match expected set', () => {
        const expectedCategories = ['swap', 'perps', 'predict', 'lend', 'stable', 'stocks', 'bridge'];
        const actualCategories = lib_1.PROTOCOLS.map(p => p.category);
        expect(actualCategories).toEqual(expectedCategories);
    });
    it('protocol names match expected set', () => {
        const names = lib_1.PROTOCOLS.map(p => p.name);
        expect(names).toContain('GoodSwap');
        expect(names).toContain('GoodPerps');
        expect(names).toContain('GoodPredict');
        expect(names).toContain('GoodLend');
        expect(names).toContain('GoodStable');
        expect(names).toContain('GoodStocks');
        expect(names).toContain('GoodBridge');
    });
    it('GoodSwap has 3 pool contracts', () => {
        const swap = lib_1.PROTOCOLS.find(p => p.name === 'GoodSwap');
        expect(swap.contracts).toHaveLength(3);
    });
    it('GoodBridge has no direct contracts (event-based)', () => {
        const bridge = lib_1.PROTOCOLS.find(p => p.name === 'GoodBridge');
        expect(bridge.contracts).toHaveLength(0);
    });
    it('contract addresses are valid hex strings', () => {
        lib_1.PROTOCOLS.forEach(p => {
            p.contracts.forEach(c => {
                expect(c.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
            });
        });
    });
    it('all fee-generating protocols have feeField or txField', () => {
        lib_1.PROTOCOLS.filter(p => p.contracts.length > 0).forEach(p => {
            p.contracts.forEach(c => {
                expect(c.feeField || c.txField).toBeTruthy();
            });
        });
    });
});
//# sourceMappingURL=revenue-tracker.test.js.map