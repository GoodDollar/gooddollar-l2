import { Contract, JsonRpcProvider } from 'ethers';
import type { ExecutionLeg, MarketQuote, VenueType } from '../core/types.js';
import type { VenueAdapter, VenueDefinition } from './venue.js';

const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function balanceOf(address) view returns (uint256)',
];

/**
 * Generic EVM placeholder adapter.
 * It verifies configured contracts have bytecode. Quote/build execution logic should be
 * implemented with GoodSwap/GoodPerps/GoodPredict ABIs once contract addresses are known.
 */
export class GenericEvmVenue implements VenueAdapter {
  id: string;
  type: VenueType;
  private def: VenueDefinition;
  private provider: JsonRpcProvider;

  constructor(def: VenueDefinition, provider: JsonRpcProvider) {
    this.id = def.id;
    this.type = def.type;
    this.def = def;
    this.provider = provider;
  }

  async healthy(): Promise<boolean> {
    const contracts = Object.values(this.def.contracts ?? {});
    if (contracts.length === 0) return false;
    const checks = await Promise.all(contracts.map(async (addr) => {
      try { return (await this.provider.getCode(addr)) !== '0x'; } catch { return false; }
    }));
    return checks.every(Boolean);
  }

  async quotes(): Promise<MarketQuote[]> {
    return [];
  }

  async buildExecution(leg: ExecutionLeg): Promise<ExecutionLeg> {
    return leg;
  }

  erc20(address: string): Contract {
    return new Contract(address, ERC20_ABI, this.provider);
  }
}
