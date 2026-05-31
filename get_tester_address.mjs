#!/usr/bin/env node

// Calculate address from private key for tester-beta
import { privateKeyToAccount } from 'viem/accounts'

const privateKey = '0xa909c1fac30fb90fce9bf22ad8e15c341ba524e2471743dc18fe6f52301dc534'
const account = privateKeyToAccount(privateKey)

console.log('Tester Beta Address:', account.address)