import PocketBase from 'pocketbase';

let pbInstance: PocketBase | null = null;
let pbAuthToken: string | null = null;

function getPbUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_PB_URL || 'http://localhost:8090';
  // In production, use the proxy path; in development, use direct URL
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_APP_URL?.includes('tennishub.com')
  ) {
    return process.env.NEXT_PUBLIC_APP_URL || 'https://tennishub.com';
  }
  return baseUrl;
}

function isDirectPbConnection(): boolean {
  return !(
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_APP_URL?.includes('tennishub.com')
  );
}

export async function getScrapingPbClient(): Promise<{ pb: PocketBase; cleanup: () => void }> {
  if (pbInstance && pbAuthToken) {
    return { pb: pbInstance, cleanup: () => {} };
  }

  const pb = new PocketBase(getPbUrl());
  pb.autoCancellation(false);

  const superuserEmail = process.env.PB_SUPERUSER_EMAIL;
  const superuserPassword = process.env.PB_SUPERUSER_PASSWORD;

  if (!superuserEmail || !superuserPassword) {
    throw new Error('PB_SUPERUSER_EMAIL and PB_SUPERUSER_PASSWORD must be set');
  }

  try {
    await pb.admins.authWithPassword(superuserEmail, superuserPassword);
    pbAuthToken = pb.authStore.token;
    pbInstance = pb;
    return {
      pb,
      cleanup: () => {
        pb.authStore.clear();
      },
    };
  } catch (err) {
    throw new Error(`PocketBase auth failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function checkPbHealth(): Promise<boolean> {
  const pb = new PocketBase(getPbUrl());
  const maxRetries = 3;
  const retryDelay = 2000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${pb.baseUrl}/api/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) return true;
    } catch {
      if (i < maxRetries - 1) await sleep(retryDelay);
    }
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { isDirectPbConnection };
