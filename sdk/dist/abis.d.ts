/**
 * Contract ABIs for all GoodDollar L2 protocols
 * Extracted from frontend/src/lib/abi.ts — canonical source
 */
export declare const ERC20ABI: readonly [{
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
    }];
    readonly name: "balanceOf";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "name";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "symbol";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "decimals";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint8";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "approve";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "transfer";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly name: "spender";
        readonly type: "address";
    }];
    readonly name: "allowance";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "totalSupply";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export declare const PerpEngineABI: readonly [{
    readonly inputs: readonly [{
        readonly name: "marketId";
        readonly type: "uint256";
    }, {
        readonly name: "size";
        readonly type: "uint256";
    }, {
        readonly name: "isLong";
        readonly type: "bool";
    }, {
        readonly name: "minPrice";
        readonly type: "uint256";
    }];
    readonly name: "openPosition";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "marketId";
        readonly type: "uint256";
    }];
    readonly name: "closePosition";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "marketId";
        readonly type: "uint256";
    }];
    readonly name: "markets";
    readonly outputs: readonly [{
        readonly name: "key";
        readonly type: "bytes32";
    }, {
        readonly name: "maxLeverage";
        readonly type: "uint256";
    }, {
        readonly name: "isActive";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "marketCount";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "marketId";
        readonly type: "uint256";
    }];
    readonly name: "positions";
    readonly outputs: readonly [{
        readonly name: "size";
        readonly type: "uint256";
    }, {
        readonly name: "entryPrice";
        readonly type: "uint256";
    }, {
        readonly name: "isLong";
        readonly type: "bool";
    }, {
        readonly name: "collateral";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "marketId";
        readonly type: "uint256";
    }];
    readonly name: "unrealizedPnL";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "int256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export declare const MarketFactoryABI: readonly [{
    readonly inputs: readonly [{
        readonly name: "question";
        readonly type: "string";
    }, {
        readonly name: "endTime";
        readonly type: "uint256";
    }, {
        readonly name: "resolver";
        readonly type: "address";
    }];
    readonly name: "createMarket";
    readonly outputs: readonly [{
        readonly name: "marketId";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "marketId";
        readonly type: "uint256";
    }, {
        readonly name: "isYES";
        readonly type: "bool";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "buy";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "marketId";
        readonly type: "uint256";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "redeem";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "marketId";
        readonly type: "uint256";
    }];
    readonly name: "getMarket";
    readonly outputs: readonly [{
        readonly name: "question";
        readonly type: "string";
    }, {
        readonly name: "endTime";
        readonly type: "uint256";
    }, {
        readonly name: "status";
        readonly type: "uint8";
    }, {
        readonly name: "totalYES";
        readonly type: "uint256";
    }, {
        readonly name: "totalNO";
        readonly type: "uint256";
    }, {
        readonly name: "collateral";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "marketCount";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "marketId";
        readonly type: "uint256";
    }];
    readonly name: "impliedProbabilityYES";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export declare const GoodLendPoolABI: readonly [{
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "supply";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "withdraw";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "borrow";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "repay";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }];
    readonly name: "getUserAccountData";
    readonly outputs: readonly [{
        readonly name: "healthFactor";
        readonly type: "uint256";
    }, {
        readonly name: "totalCollateralUSD";
        readonly type: "uint256";
    }, {
        readonly name: "totalDebtUSD";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
    }];
    readonly name: "getReserveData";
    readonly outputs: readonly [{
        readonly name: "totalDeposits";
        readonly type: "uint256";
    }, {
        readonly name: "totalBorrows";
        readonly type: "uint256";
    }, {
        readonly name: "liquidityIndex";
        readonly type: "uint256";
    }, {
        readonly name: "borrowIndex";
        readonly type: "uint256";
    }, {
        readonly name: "supplyRate";
        readonly type: "uint256";
    }, {
        readonly name: "borrowRate";
        readonly type: "uint256";
    }, {
        readonly name: "accruedToTreasury";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export declare const CollateralVaultABI: readonly [{
    readonly inputs: readonly [{
        readonly name: "ticker";
        readonly type: "string";
    }, {
        readonly name: "collateralAmount";
        readonly type: "uint256";
    }, {
        readonly name: "syntheticAmount";
        readonly type: "uint256";
    }];
    readonly name: "depositAndMint";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "ticker";
        readonly type: "string";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "burn";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "ticker";
        readonly type: "string";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "withdrawCollateral";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "ticker";
        readonly type: "string";
    }];
    readonly name: "getPosition";
    readonly outputs: readonly [{
        readonly name: "userCollateral";
        readonly type: "uint256";
    }, {
        readonly name: "userDebt";
        readonly type: "uint256";
    }, {
        readonly name: "ratio";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "ticker";
        readonly type: "string";
    }];
    readonly name: "getCollateralRatio";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export declare const SyntheticAssetFactoryABI: readonly [{
    readonly inputs: readonly [{
        readonly name: "ticker";
        readonly type: "string";
    }];
    readonly name: "getAsset";
    readonly outputs: readonly [{
        readonly name: "tokenAddress";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "allTickers";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string[]";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export declare const MarginVaultABI: readonly [{
    readonly inputs: readonly [{
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "deposit";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "withdraw";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }];
    readonly name: "balances";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export declare const UBIRevenueTrackerABI: readonly [{
    readonly inputs: readonly [];
    readonly name: "getDashboardData";
    readonly outputs: readonly [{
        readonly name: "_totalFees";
        readonly type: "uint256";
    }, {
        readonly name: "_totalUBI";
        readonly type: "uint256";
    }, {
        readonly name: "_totalTx";
        readonly type: "uint256";
    }, {
        readonly name: "_protocolCount";
        readonly type: "uint256";
    }, {
        readonly name: "_activeProtocols";
        readonly type: "uint256";
    }, {
        readonly name: "_splitterFees";
        readonly type: "uint256";
    }, {
        readonly name: "_splitterUBI";
        readonly type: "uint256";
    }, {
        readonly name: "_snapshotCount";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "getAllProtocols";
    readonly outputs: readonly [{
        readonly name: "result";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "name";
            readonly type: "string";
        }, {
            readonly name: "category";
            readonly type: "string";
        }, {
            readonly name: "feeSource";
            readonly type: "address";
        }, {
            readonly name: "totalFees";
            readonly type: "uint256";
        }, {
            readonly name: "ubiContribution";
            readonly type: "uint256";
        }, {
            readonly name: "txCount";
            readonly type: "uint256";
        }, {
            readonly name: "lastUpdateBlock";
            readonly type: "uint256";
        }, {
            readonly name: "active";
            readonly type: "bool";
        }];
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "count";
        readonly type: "uint256";
    }];
    readonly name: "getSnapshots";
    readonly outputs: readonly [{
        readonly name: "result";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "timestamp";
            readonly type: "uint256";
        }, {
            readonly name: "totalUBI";
            readonly type: "uint256";
        }, {
            readonly name: "totalFees";
            readonly type: "uint256";
        }, {
            readonly name: "protocolCount";
            readonly type: "uint256";
        }];
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "id";
        readonly type: "uint256";
    }];
    readonly name: "getProtocol";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "name";
            readonly type: "string";
        }, {
            readonly name: "category";
            readonly type: "string";
        }, {
            readonly name: "feeSource";
            readonly type: "address";
        }, {
            readonly name: "totalFees";
            readonly type: "uint256";
        }, {
            readonly name: "ubiContribution";
            readonly type: "uint256";
        }, {
            readonly name: "txCount";
            readonly type: "uint256";
        }, {
            readonly name: "lastUpdateBlock";
            readonly type: "uint256";
        }, {
            readonly name: "active";
            readonly type: "bool";
        }];
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "totalUBITracked";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "totalFeesTracked";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "totalTxTracked";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "protocolCount";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export declare const UBIFeeHookABI: readonly [{
    readonly inputs: readonly [{
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "calculateUBIFee";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "totalSwapsProcessed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
    }];
    readonly name: "totalUBIFees";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export declare const VaultFactoryABI: readonly [{
    readonly type: "function";
    readonly name: "allVaults";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "vaultCount";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "totalTVL";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "tvl";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "totalUBIFunded";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "total";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "isVault";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getVaultsByAsset";
    readonly inputs: readonly [{
        readonly name: "_asset";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}];
export declare const GoodVaultABI: readonly [{
    readonly type: "function";
    readonly name: "name";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "symbol";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "asset";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "totalAssets";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "totalSupply";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "balanceOf";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "convertToShares";
    readonly inputs: readonly [{
        readonly name: "assets";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "convertToAssets";
    readonly inputs: readonly [{
        readonly name: "shares";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "deposit";
    readonly inputs: readonly [{
        readonly name: "assets";
        readonly type: "uint256";
    }, {
        readonly name: "receiver";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "shares";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "withdraw";
    readonly inputs: readonly [{
        readonly name: "assets";
        readonly type: "uint256";
    }, {
        readonly name: "receiver";
        readonly type: "address";
    }, {
        readonly name: "owner";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "shares";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "redeem";
    readonly inputs: readonly [{
        readonly name: "shares";
        readonly type: "uint256";
    }, {
        readonly name: "receiver";
        readonly type: "address";
    }, {
        readonly name: "owner";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "assets";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "harvest";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "profit";
        readonly type: "uint256";
    }, {
        readonly name: "loss";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "depositCap";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "totalDebt";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "totalGainSinceInception";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "totalUBIFunded";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "paused";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "strategy";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "performanceFeeBPS";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "managementFeeBPS";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}];
export declare const AgentRegistryABI: readonly [{
    readonly type: "function";
    readonly name: "getDashboardStats";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "_totalAgents";
        readonly type: "uint256";
    }, {
        readonly name: "_totalTrades";
        readonly type: "uint256";
    }, {
        readonly name: "_totalVolume";
        readonly type: "uint256";
    }, {
        readonly name: "_totalUBI";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getTopAgents";
    readonly inputs: readonly [{
        readonly name: "count";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "topAddrs";
        readonly type: "address[]";
    }, {
        readonly name: "topNames";
        readonly type: "string[]";
    }, {
        readonly name: "topUBI";
        readonly type: "uint256[]";
    }, {
        readonly name: "topVolume";
        readonly type: "uint256[]";
    }, {
        readonly name: "topTrades";
        readonly type: "uint256[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getAgentInfo";
    readonly inputs: readonly [{
        readonly name: "agent";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "profile";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "name";
            readonly type: "string";
        }, {
            readonly name: "avatarURI";
            readonly type: "string";
        }, {
            readonly name: "strategy";
            readonly type: "string";
        }, {
            readonly name: "owner";
            readonly type: "address";
        }, {
            readonly name: "registeredAt";
            readonly type: "uint256";
        }, {
            readonly name: "active";
            readonly type: "bool";
        }];
    }, {
        readonly name: "agentStats";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "totalTrades";
            readonly type: "uint256";
        }, {
            readonly name: "totalVolume";
            readonly type: "uint256";
        }, {
            readonly name: "totalFeesGenerated";
            readonly type: "uint256";
        }, {
            readonly name: "ubiContribution";
            readonly type: "uint256";
        }, {
            readonly name: "totalPnL";
            readonly type: "uint256";
        }, {
            readonly name: "pnlPositive";
            readonly type: "bool";
        }, {
            readonly name: "lastActiveAt";
            readonly type: "uint256";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getAgentProtocolStats";
    readonly inputs: readonly [{
        readonly name: "agent";
        readonly type: "address";
    }, {
        readonly name: "protocol";
        readonly type: "string";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "trades";
            readonly type: "uint256";
        }, {
            readonly name: "volume";
            readonly type: "uint256";
        }, {
            readonly name: "fees";
            readonly type: "uint256";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getAgentCount";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "registerAgent";
    readonly inputs: readonly [{
        readonly name: "agent";
        readonly type: "address";
    }, {
        readonly name: "name";
        readonly type: "string";
    }, {
        readonly name: "avatarURI";
        readonly type: "string";
    }, {
        readonly name: "strategy";
        readonly type: "string";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "recordActivity";
    readonly inputs: readonly [{
        readonly name: "agent";
        readonly type: "address";
    }, {
        readonly name: "protocol";
        readonly type: "string";
    }, {
        readonly name: "volume";
        readonly type: "uint256";
    }, {
        readonly name: "fees";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}];
