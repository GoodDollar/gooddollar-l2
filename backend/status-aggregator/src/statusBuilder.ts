export interface ServiceStatus {
  name: string;
  status: 'ok' | 'degraded' | 'error' | 'timeout' | 'unreachable';
  latencyMs: number;
  uptime?: number;
  chainBlock?: number;
  error?: string;
  lastChecked: string;
}

let cachedStatuses: ServiceStatus[] = [];
let pollCompleted = false;
let lastPollTimestamp: string | null = null;
const startedAt = Date.now();

export function updateStatuses(statuses: ServiceStatus[]): void {
  cachedStatuses = statuses;
  pollCompleted = true;
  lastPollTimestamp = new Date().toISOString();
}

export function getStatuses(): ServiceStatus[] {
  return cachedStatuses;
}

export function buildStatusJson(serviceCount: number) {
  if (!pollCompleted) {
    return {
      overall: 'pending' as const,
      healthy: 0,
      total: serviceCount,
      pollState: 'pending' as const,
      lastPollTimestamp: null,
      aggregatorUptime: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
      services: [] as ServiceStatus[],
    };
  }

  const ok = cachedStatuses.filter(s => s.status === 'ok').length;
  const operational = cachedStatuses.filter(s => s.status === 'ok' || s.status === 'degraded').length;
  const overall = operational === serviceCount
    ? (ok === serviceCount ? 'healthy' : 'degraded')
    : operational > 0 ? 'degraded' : 'down';

  return {
    overall,
    healthy: operational,
    total: serviceCount,
    pollState: 'active' as const,
    lastPollTimestamp,
    aggregatorUptime: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    services: cachedStatuses,
  };
}

export function resetState(): void {
  cachedStatuses = [];
  pollCompleted = false;
  lastPollTimestamp = null;
}
