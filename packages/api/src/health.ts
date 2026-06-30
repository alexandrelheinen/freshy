export type HealthSnapshot = {
  status: 'ok';
  service: 'freshy-api-worker';
  r2: 'configured' | 'not-configured';
  auth: 'configured' | 'not-configured';
  db: 'ok' | 'unavailable';
};

/** Probe that Place queries work (schema migrated), not just TCP to Postgres. */
export async function checkDatabaseHealth(
  probe: () => Promise<unknown>,
): Promise<'ok' | 'unavailable'> {
  try {
    await probe();
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
    service: 'freshy-api-worker',
    r2: r2Configured ? 'configured' : 'not-configured',
    auth: authConfigured ? 'configured' : 'not-configured',
    db,
  };
}
