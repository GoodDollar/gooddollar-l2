import { NormalizedQuote, InstrumentMetadata, CandleData, SessionState } from './types';

/**
 * Stub: will be implemented in task 0002.
 * Provides live quotes, instrument metadata, candles, and market hours.
 */
export class MarketDataModule {
  async getQuotes(_symbols: string[]): Promise<NormalizedQuote[]> {
    throw new Error('MarketDataModule.getQuotes not yet implemented — see task 0002');
  }

  async getInstruments(_symbols?: string[]): Promise<InstrumentMetadata[]> {
    throw new Error('MarketDataModule.getInstruments not yet implemented — see task 0002');
  }

  async getCandles(
    _symbol: string,
    _interval: string,
    _from: number,
    _to: number,
  ): Promise<CandleData[]> {
    throw new Error('MarketDataModule.getCandles not yet implemented — see task 0002');
  }

  async getSessionState(_symbol: string): Promise<SessionState> {
    throw new Error('MarketDataModule.getSessionState not yet implemented — see task 0002');
  }
}
