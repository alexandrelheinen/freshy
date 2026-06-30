export type HealthSnapshot = {
  status: 'ok';
  service: 'freshy-api';
  r2: 'configured' | 'not-configured';
  auth: 'configured' | 'not-configured';
  db: 'ok' | 'unavailable';
};

export async function checkDatabaseHealth(
  queryRaw: (sql: string) => Promise<unknown>,
): Promise<'ok' | 'unavailable'> {
  try {
    await queryRaw('SELECT 1');
    return 'ok';
  } catch {
    return 'unavailable';
  }
}

export function buildHealthSnapshot(
  db: 'ok' | 'unavailable',
  r2Configured: boolean,
  authConfigured: boolean,
): HealthSnapshot {
  return {
    status: 'ok',
    service: 'freshy-api',
    r2: r2Configured ? 'configured' : 'not-configured',
    auth: authConfigured ? 'configured' : 'not-configured',
    db,
  };
}
