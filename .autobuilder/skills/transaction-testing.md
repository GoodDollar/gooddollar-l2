# Transaction Testing Skill

## All Testers MUST Execute Real Transactions

Every test run = real `cast send` transactions on devnet. No read-only runs.

## Contract Addresses (source: .autobuilder/addresses.env)
```
RPC=http://localhost:8545
KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
GDT=0x36c02da8a0983159322a80ffe9f24b1acff8b570
UBI=0x976fcd02f7c4773dd89c309fbf55d5923b4c98a1
PERP=0x9be634797af98cb560db23260b5f7c6e98accacf
MF=0xd28f3246f047efd4059b24fa1fa587ed9fa3e77f
VS=0x103a3b128991781ee2c8db0454ca99d67b257923
LEND=0x49fd2be640db2910c2fab69bb8531ab6e76127ff
STABLE=0x5d42ebdbba61412295d7b0302d6f50ac449ddb4f
STOCKS=0x2d13826359803522cce7a4cfa2c1b582303dd0b4
SWAP=0x975ab64f4901af5f0c96636dea0b9de3419d0c2f
```

## Transaction Test Suite Per Protocol

### GoodSwap (Swap Tester)
```bash
# Approve + swap
cast send $GDT 'approve(address,uint256)' $SWAP 1000000000000000000000 --rpc-url $RPC --private-key $KEY
cast send $SWAP 'swapExactTokensForETH(uint256,uint256,address[],address,uint256)' 100000000000000000 0 "[$GDT,0x0000000000000000000000000000000000000000]" $WALLET 99999999999 --rpc-url $RPC --private-key $KEY
```

### GoodPerps (Perps Tester)
```bash
# Deposit margin + open/close position
MARGIN=$(cast call $PERP 'marginVault()(address)' --rpc-url $RPC)
cast send $GDT 'approve(address,uint256)' $MARGIN 10000000000000000000000 --rpc-url $RPC --private-key $KEY
cast send $MARGIN 'deposit(uint256)' 1000000000000000000000 --rpc-url $RPC --private-key $KEY
cast send $PERP 'openPosition(uint256,uint256,bool,uint256)' 0 100000000000000000000 true 10000000000000000000 --rpc-url $RPC --private-key $KEY
cast send $PERP 'closePosition(uint256)' 0 --rpc-url $RPC --private-key $KEY
```

### GoodLend (Lend Tester)
```bash
# Supply + withdraw
cast send $GDT 'approve(address,uint256)' $LEND 5000000000000000000000 --rpc-url $RPC --private-key $KEY
cast send $LEND 'supply(address,uint256)' $GDT 1000000000000000000000 --rpc-url $RPC --private-key $KEY
cast send $LEND 'withdraw(address,uint256)' $GDT 500000000000000000000 --rpc-url $RPC --private-key $KEY
```

### GoodStable (Stable Tester)
```bash
# Deposit collateral + mint gUSD
cast send $GDT 'approve(address,uint256)' $STABLE 5000000000000000000000 --rpc-url $RPC --private-key $KEY
# Mint gUSD with G$ collateral
cast send $STABLE 'mint(uint256)' 100000000000000000000 --rpc-url $RPC --private-key $KEY
```

### ValidatorStaking (Staking Tester)
```bash
# Stake G$
cast send $GDT 'approve(address,uint256)' $VS 1000000000000000000000 --rpc-url $RPC --private-key $KEY
cast send $VS 'stake(uint256,string,string)' 1000000000000000000000 'TestValidator' 'https://test.com' --rpc-url $RPC --private-key $KEY
cast call $VS 'totalStaked()(uint256)' --rpc-url $RPC
```

### Core (ETH + G$ transfers)
```bash
# ETH transfer
cast send 0x000000000000000000000000000000000000dEaD --value 0.001ether --rpc-url $RPC --private-key $KEY
# G$ transfer
cast send $GDT 'transfer(address,uint256)' 0x000000000000000000000000000000000000dEaD 1000000000000000000 --rpc-url $RPC --private-key $KEY
```

## Reporting
Every failure → Paperclip issue (GOO-XXX) + MemClaw outcome
Every success → MemClaw outcome only
