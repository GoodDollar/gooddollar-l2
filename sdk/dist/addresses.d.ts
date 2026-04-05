/**
 * Deployed contract addresses on GoodDollar L2 devnet (chain ID 42069)
 */
export declare const ADDRESSES: {
    readonly GoodDollarToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    readonly MockUSDC: "0x0B306BF915C4d645ff596e518fAf3F9669b97016";
    readonly MockWETH: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1";
    readonly UBIFeeSplitter: "0xC0BF43A4Ca27e0976195E6661b099742f10507e5";
    readonly ValidatorStaking: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    readonly UBIFeeHook: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
    readonly FundingRate: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
    readonly MarginVault: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
    readonly PriceOracle: "0x0165878A594ca255338adfa4d48449f69242Eb8F";
    readonly PerpEngine: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
    readonly ConditionalTokens: "0x332De1995E0d7e340255833B95AE33F2fe844287";
    readonly MarketFactory: "0xD28F3246f047Efd4059B24FA1fa587eD9fa3e77F";
    readonly StocksPriceOracle: "0x20d7B364E8Ed1F4260b5B90C41c2deC3C1F6D367";
    readonly CollateralVault: "0xCa57C1d3c2c35E667745448Fef8407dd25487ff8";
    readonly SyntheticAssetFactory: "0x2d13826359803522cCe7a4Cfa2c1b582303DD0B4";
    readonly GoodLendPool: "0x322813Fd9A801c5507C9de605D63ceA4f2Ce6C44";
    readonly UBIRevenueTracker: "0x1D3EDBa836caB11C26A186873abf0fFeB8bbaE63";
    readonly VaultFactory: "0x0b27a79cb9C0B38eE06Ca3d94DAA68e0Ed17F953";
    readonly ETHLendingVault: "0xa6AB86f760ae5D6fbF06056a7887b816610A4668";
    readonly GUSDStabilityVault: "0x6BdBEc8Be23eB0F4A1aeF4B4dDf85bdfF0BdbF97";
    readonly GDLendingVault: "0xAD438cEf9a586FcCF01a521bce9465e500a4259E";
    readonly AgentRegistry: "0xA9d0Fb5837f9c42c874e16da96094b14Af0e2784";
};
export type ContractName = keyof typeof ADDRESSES;
/** Chain configuration */
export declare const CHAIN_CONFIG: {
    readonly id: 42069;
    readonly name: "GoodDollar L2";
    readonly rpcUrl: "http://localhost:8545";
    readonly explorerUrl: "https://explorer.goodclaw.org";
};
