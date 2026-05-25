#!/usr/bin/env node

/**
 * Check if PerpPriceOracle has bytecode and basic contract integrity
 */

const { createPublicClient, http } = require('viem');
const { readFileSync } = require('fs');

// Load addresses
const addresses = JSON.parse(readFileSync('/home/goodclaw/gooddollar-l2/op-stack/addresses.json', 'utf8'));

const publicClient = createPublicClient({
  transport: http('https://rpc.goodclaw.org')
});

async function main() {
  console.log('=== Checking Oracle Contract Integrity ===');

  const oracleAddress = addresses.contracts.PerpPriceOracle;
  console.log('Oracle address:', oracleAddress);

  try {
    // Check bytecode
    const bytecode = await publicClient.getBytecode({ address: oracleAddress });
    const hasBytecode = bytecode && bytecode !== '0x';
    console.log('Has bytecode:', hasBytecode ? '✅ YES' : '❌ NO');

    if (!hasBytecode) {
      console.log('❌ CRITICAL: PerpPriceOracle has no bytecode!');
      console.log('This is the same issue that was fixed for MarginVault.');
      console.log('The oracle needs to be redeployed.');
      return false;
    }

    console.log('Bytecode length:', bytecode.length);

    // Try a simpler call - just checking if the contract responds at all
    try {
      const balance = await publicClient.getBalance({ address: oracleAddress });
      console.log('Contract ETH balance:', balance.toString());
    } catch (balanceError) {
      console.log('Balance check error:', balanceError.message);
    }

    // The admin call worked in the previous test, so let's verify that
    const AdminABI = [
      {
        type: 'function',
        name: 'admin',
        inputs: [],
        outputs: [{ type: 'address' }],
        stateMutability: 'view'
      }
    ];

    try {
      const admin = await publicClient.readContract({
        address: oracleAddress,
        abi: AdminABI,
        functionName: 'admin'
      });
      console.log('Admin call successful:', admin);
      console.log('Contract appears to have SOME functionality working.');
    } catch (adminError) {
      console.log('❌ Admin call failed:', adminError.message);
      console.log('Contract may be completely broken.');
      return false;
    }

    return true;

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    return false;
  }
}

main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});