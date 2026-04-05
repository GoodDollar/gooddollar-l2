#!/bin/bash
export PATH="/home/goodclaw/.foundry/bin:$PATH"
cd /home/goodclaw/gooddollar-l2
forge test --match-test test_withdrawWithUnharvestedYield -vvv 2>&1
echo "EXIT: $?"
