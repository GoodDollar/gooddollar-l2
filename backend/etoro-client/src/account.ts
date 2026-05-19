import { AccountBalance, Position } from './types';

/**
 * Stub: will be implemented alongside task 0003.
 * Provides account balance, margin, and position data.
 */
export class AccountModule {
  async getBalance(): Promise<AccountBalance> {
    throw new Error('AccountModule.getBalance not yet implemented — see task 0003');
  }

  async getPositions(): Promise<Position[]> {
    throw new Error('AccountModule.getPositions not yet implemented — see task 0003');
  }

  async getPortfolioPnl(): Promise<{ realized: number; unrealized: number }> {
    throw new Error('AccountModule.getPortfolioPnl not yet implemented — see task 0003');
  }
}
