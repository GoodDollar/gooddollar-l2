import { loadConfig } from '../index';
import { DEFAULT_LANE_SYMBOLS } from '@goodchain/etoro-client';

describe('hedge-engine loadConfig', () => {
  it('defaults symbols to DEFAULT_LANE_SYMBOLS when HEDGE_SYMBOLS is unset', () => {
    const env: NodeJS.ProcessEnv = {};
    const config = loadConfig(env);
    expect(config.symbols).toEqual([...DEFAULT_LANE_SYMBOLS]);
    expect(env.SERVICE_HEALTH_STATUS).toBeUndefined();
  });

  it('degrades + filters out unknown symbols passed via HEDGE_SYMBOLS', () => {
    const env: NodeJS.ProcessEnv = { HEDGE_SYMBOLS: 'MSFT,BTC,AAPL' };
    const config = loadConfig(env);
    expect(config.symbols).toEqual(['BTC', 'AAPL']);
    expect(env.SERVICE_HEALTH_STATUS).toBe('degraded');
    expect(env.SERVICE_DISABLED_REASON).toBe('Unknown symbols: MSFT');
  });

  it('preserves explicit symbol list when every entry is in INSTRUMENT_MAP', () => {
    const env: NodeJS.ProcessEnv = { HEDGE_SYMBOLS: 'BTC,ETH,AAPL' };
    const config = loadConfig(env);
    expect(config.symbols).toEqual(['BTC', 'ETH', 'AAPL']);
    expect(env.SERVICE_HEALTH_STATUS).toBeUndefined();
  });

  it('passes through other env vars to the config shape', () => {
    const env: NodeJS.ProcessEnv = {
      RPC_URL: 'http://example:8545',
      RISK_ENGINE_ADDRESS: '0xabc',
      HEDGE_DELTA_THRESHOLD_USD: '1000',
      HEDGE_DRY_RUN: 'false',
    };
    const config = loadConfig(env);
    expect(config.rpcUrl).toBe('http://example:8545');
    expect(config.riskEngineAddress).toBe('0xabc');
    expect(config.deltaThresholdUsd).toBe(1000);
    expect(config.dryRun).toBe(false);
  });

  it('defaults mode to mock when ETORO_MODE is unset', () => {
    const config = loadConfig({});
    expect(config.mode).toBe('mock');
    expect(config.tradingEnabled).toBe(false);
  });

  it('resolves ETORO_MODE=demo-trading and enables trading only with HEDGE_TRADING_ENABLED=true', () => {
    const enabled = loadConfig({ ETORO_MODE: 'demo-trading', HEDGE_TRADING_ENABLED: 'true' });
    expect(enabled.mode).toBe('demo-trading');
    expect(enabled.tradingEnabled).toBe(true);

    const disabled = loadConfig({ ETORO_MODE: 'demo-trading' });
    expect(disabled.mode).toBe('demo-trading');
    expect(disabled.tradingEnabled).toBe(false);
  });

  it('never sets tradingEnabled outside demo-trading even with HEDGE_TRADING_ENABLED=true', () => {
    const readonly = loadConfig({ ETORO_MODE: 'demo-readonly', HEDGE_TRADING_ENABLED: 'true' });
    expect(readonly.mode).toBe('demo-readonly');
    expect(readonly.tradingEnabled).toBe(false);

    const realDisabled = loadConfig({ ETORO_MODE: 'real-disabled', HEDGE_TRADING_ENABLED: 'true' });
    expect(realDisabled.mode).toBe('real-disabled');
    expect(realDisabled.tradingEnabled).toBe(false);
  });
});
