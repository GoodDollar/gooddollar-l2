# GoodDollar L2 Testnet Guide

Welcome to the GoodDollar L2 testnet! This guide walks you through connecting, getting test tokens, and trying every protocol.

## Prerequisites

- **MetaMask** (or any EVM wallet)
- A desktop browser (Chrome, Firefox, Brave)

## 1. Add GoodChain Testnet to MetaMask

| Field         | Value                              |
|---------------|------------------------------------|
| Network Name  | GoodChain Testnet                  |
| RPC URL       | http://localhost:8545               |
| Chain ID      | 42069                              |
| Currency      | G$ (GoodDollar)                    |
| Explorer      | —                                  |

**Steps:**
1. Open MetaMask → Settings → Networks → Add Network
2. Enter the details above
3. Click Save

## 2. Get Test G$

Visit the **Faucet** page in the app to claim free test G$ and WETH:
- Navigate to `/faucet` in the app
- Connect your wallet
- Click "Claim Test Tokens"
- You'll receive 10,000 G$ and 1 WETH

---

## Test Scenarios

### Scenario 1: First Swap (WETH → G$)

**Goal:** Execute your first token swap on GoodSwap.

**Steps:**
1. Navigate to **Swap** (top nav)
2. Select **WETH** as the input token
3. Enter `0.1` WETH
4. Select **G$** as the output token
5. Click **Swap** and confirm in MetaMask

**Expected outcome:**
- Your WETH balance decreases by 0.1
- Your G$ balance increases (amount shown in the preview)
- A success toast appears with the transaction hash
- The UBI fee counter on the UBI Impact page increments

**What to verify:**
- Check the transaction on the explorer
- Verify the UBI fee was routed (20% of the swap fee goes to UBI)

---

### Scenario 2: Open a Perps Position (Long BTC)

**Goal:** Deposit margin and open a leveraged BTC long.

**Steps:**
1. Navigate to **Perps**
2. Click **Deposit Margin**
3. Enter `1000` G$ and confirm
4. Select the **BTC/USD** market
5. Choose **Long**, set leverage to **2x**
6. Enter position size: `500` G$
7. Click **Open Position** and confirm

**Expected outcome:**
- Your margin account shows 1000 G$ deposited
- An open position appears: BTC Long, 2x leverage, 500 G$ size
- Entry price matches the current oracle price
- Funding rate is displayed

**What to verify:**
- Check the position details match your inputs
- Wait 1 minute and verify funding accrues
- Try closing the position and verify PnL calculation

---

### Scenario 3: Create a Prediction Market

**Goal:** Create a binary prediction market and place a bet.

**Steps:**
1. Navigate to **Predict**
2. Click **Create Market**
3. Enter a question: "Will ETH be above $4000 by end of month?"
4. Set the end date to 7 days from now
5. Deposit `100` G$ as initial collateral
6. Confirm creation

**Expected outcome:**
- A new market card appears on the Predict page
- The market shows your question, end date, and initial odds (50/50)

**Placing a bet:**
1. Click on your new market
2. Choose **YES** and enter `50` G$
3. Confirm — you receive YES tokens

**What to verify:**
- Your G$ balance decreased by 50
- You hold YES tokens (visible in portfolio)
- The market odds shifted from 50/50

---

### Scenario 4: Supply to GoodLend and Borrow

**Goal:** Supply G$ to earn interest, then borrow WETH against it.

**Steps:**
1. Navigate to **Lend**
2. Click **Supply** on the G$ market
3. Enter `5000` G$ and confirm
4. You receive gGD tokens (receipt tokens)
5. Click **Borrow** on the WETH market
6. Enter `0.1` WETH and confirm

**Expected outcome:**
- Your G$ supply appears in the dashboard
- Supply APY is displayed (e.g., 3.8%)
- Your WETH borrow appears with the borrow APY
- Health factor is calculated and shown (should be > 1.5)

**What to verify:**
- gGD token balance matches your supply
- Borrow limit reflects your collateral value
- After 1 block, interest starts accruing on both supply and borrow

---

### Scenario 5: Mint GoodStable (gUSD)

**Goal:** Deposit collateral and mint the stablecoin gUSD.

**Steps:**
1. Navigate to **Stable**
2. Click **Mint gUSD**
3. Select WETH as collateral
4. Enter `0.5` WETH
5. The mint amount shows based on the collateral ratio (e.g., ~750 gUSD at 150% ratio)
6. Click **Mint** and confirm

**Expected outcome:**
- Your WETH balance decreases by 0.5
- Your gUSD balance increases
- A vault position appears showing your collateral ratio
- The collateral ratio should be ≥ 150%

**What to verify:**
- The vault details page shows correct collateral and debt
- Try repaying some gUSD to reduce your debt
- Verify the collateral ratio updates in real time

---

## Troubleshooting

### "Transaction reverted" error
- Make sure you have enough G$ for the transaction + gas
- Check that token approvals are set (the app should prompt automatically)
- Try refreshing the page and reconnecting your wallet

### Wallet not connecting
- Ensure you're on the GoodChain Testnet (chain ID 42069)
- Try disconnecting and reconnecting
- Clear MetaMask cache: Settings → Advanced → Reset Account

### Prices showing $0 or stale
- The oracle keeper may be syncing — wait 30 seconds and refresh
- Check the Status page to verify oracle services are running

### "Insufficient balance" error
- Visit the Faucet page to claim more test tokens
- Remember: some protocols require approval transactions first

---

## Feedback

Found a bug? Have a suggestion?
- Use the **Feedback** button (bottom-right corner of every page)
- Or open an issue on GitHub

Thank you for testing GoodDollar L2!
