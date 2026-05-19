import { OrderRequest, OrderResult, Position } from './types';

/**
 * Stub: will be implemented in task 0003.
 * Handles order placement, cancellation, position management.
 */
export class TradingModule {
  async openPosition(_order: OrderRequest): Promise<OrderResult> {
    throw new Error('TradingModule.openPosition not yet implemented — see task 0003');
  }

  async closePosition(_positionId: string): Promise<OrderResult> {
    throw new Error('TradingModule.closePosition not yet implemented — see task 0003');
  }

  async partialClose(
    _positionId: string,
    _amount: number,
  ): Promise<OrderResult> {
    throw new Error('TradingModule.partialClose not yet implemented — see task 0003');
  }

  async cancelOrder(_orderId: string): Promise<void> {
    throw new Error('TradingModule.cancelOrder not yet implemented — see task 0003');
  }

  async getOpenPositions(): Promise<Position[]> {
    throw new Error('TradingModule.getOpenPositions not yet implemented — see task 0003');
  }
}
