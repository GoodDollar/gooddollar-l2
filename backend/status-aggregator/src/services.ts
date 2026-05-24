/**
 * Service registry for the status aggregator.
 *
 * Lives in its own module so tests can import the list (and the
 * `buildServices` factory for env-override tests) without booting the
 * `main()` entrypoint in `index.ts`.
 *
 * Order follows the lane-1 producer → consumer flow at the bottom
 * (`price-service` → `hedge-engine` / `oracle-signer`) so an operator
 * reading top-to-bottom sees the lane cluster as one unit.
 */

export interface ServiceConfig {
  name: string;
  url: string;
}

type EnvLike = Record<string, string | undefined>;

export function buildServices(env: EnvLike = process.env): ServiceConfig[] {
  return [
    { name: 'swap-oracle',       url: `http://localhost:${env.SWAP_ORACLE_PORT ?? '9100'}/health` },
    { name: 'activity-reporter', url: `http://localhost:${env.ACTIVITY_REPORTER_PORT ?? '9101'}/health` },
    { name: 'harvest-keeper',    url: `http://localhost:${env.HARVEST_KEEPER_PORT ?? '9102'}/health` },
    { name: 'liquidator',        url: `http://localhost:${env.LIQUIDATOR_PORT ?? '9103'}/health` },
    { name: 'revenue-tracker',   url: `http://localhost:${env.REVENUE_TRACKER_PORT ?? '9104'}/health` },
    { name: 'stocks-keeper',     url: `http://localhost:${env.STOCKS_KEEPER_PORT ?? '9105'}/health` },
    { name: 'indexer',           url: `http://localhost:${env.INDEXER_PORT ?? '4200'}/api/health` },
    { name: 'monitor',           url: `http://localhost:${env.MONITOR_PORT ?? '4201'}/health` },
    { name: 'rpc-balancer',      url: `http://localhost:${env.RPC_BALANCER_PORT ?? '8546'}/health` },
    { name: 'bridge-keeper',     url: `http://localhost:${env.BRIDGE_KEEPER_PORT ?? '3006'}/health` },
    { name: 'perps',             url: `http://localhost:${env.PERPS_PORT ?? '8082'}/health` },
    { name: 'predict',           url: `http://localhost:${env.PREDICT_PORT ?? '3040'}/health` },
    { name: 'price-service',     url: `http://localhost:${env.PRICE_SERVICE_PORT ?? '9300'}/health` },
    { name: 'hedge-engine',      url: `http://localhost:${env.HEDGE_ENGINE_PORT ?? '9106'}/health` },
    { name: 'oracle-signer',     url: `http://localhost:${env.ORACLE_SIGNER_PORT ?? '9107'}/health` },
  ];
}

export const SERVICES: ServiceConfig[] = buildServices();
