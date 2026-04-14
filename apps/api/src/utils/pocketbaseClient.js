import dotenv from 'dotenv';
dotenv.config();
import Pocketbase from 'pocketbase';
import logger from './logger.js';

// For local development (no Horizons platform), connect directly to PocketBase
// isLocalDev if WEBSITE_DOMAIN is not set, or contains localhost/127.0.0.1
const isLocalDev = !process.env.WEBSITE_DOMAIN ||
  process.env.WEBSITE_DOMAIN.includes('localhost') ||
  process.env.WEBSITE_DOMAIN.includes('127.0.0.1');
const POCKETBASE_HOST = isLocalDev
  ? `http://localhost:8090`
  : `https://${process.env.WEBSITE_DOMAIN}/hcgi/platform`;

async function waitForHealth({ retries = 10, delayMs = 1000 } = {}) {
    const healthPath = isLocalDev ? '/api/health' : '/api/health';
    for (let i = 1; i <= retries; i++) {
        const response = await fetch(`${POCKETBASE_HOST}${healthPath}`, { method: 'HEAD' });
        if (response.ok) {
            return;
        }

        logger.warn(`PocketBase not ready, retrying (${i}/${retries})...`);

        await new Promise((r) => setTimeout(r, delayMs));
    }

    // In local dev, PocketBase might not be fully ready yet - continue anyway
    if (isLocalDev) {
        logger.warn('PocketBase health check failed in local dev, continuing...');
        return;
    }

    throw new Error(`PocketBase health check failed after ${retries} retries`);
}

const pocketbaseClient = new Pocketbase(POCKETBASE_HOST);

pocketbaseClient.autoCancellation(false);

let authPromise = null;

pocketbaseClient.beforeSend = async function (url, options) {
    // Skip auth for local health checks and non-auth endpoints
    if (url.includes('/api/health') || !pocketbaseClient.authStore.isValid) {
        return { url, options };
    }

    if (!pocketbaseClient.authStore.isValid && !authPromise && process.env.PB_SUPERUSER_EMAIL) {
        authPromise = pocketbaseClient.collection('_superusers').authWithPassword(
            process.env.PB_SUPERUSER_EMAIL,
            process.env.PB_SUPERUSER_PASSWORD,
        ).finally(() => {
            authPromise = null;
        });
    }

    if (authPromise) {
        await authPromise;
    }

    if (pocketbaseClient.authStore.isValid && pocketbaseClient.authStore.token) {
        options.headers = options.headers || {};
        options.headers['Authorization'] = pocketbaseClient.authStore.token;
    }

    return { url, options };
};

// In local dev without auth configured, skip initialization
if (isLocalDev && !process.env.PB_SUPERUSER_EMAIL) {
    logger.info('Local dev mode: PocketBase client initialized without superuser auth');
} else {
    (async () => {
        try {
            await waitForHealth();

            if (!pocketbaseClient.authStore.isValid && !authPromise && process.env.PB_SUPERUSER_EMAIL) {
                authPromise = pocketbaseClient.collection('_superusers').authWithPassword(
                    process.env.PB_SUPERUSER_EMAIL,
                    process.env.PB_SUPERUSER_PASSWORD,
                ).finally(() => {
                    authPromise = null;
                });
            }

            if (authPromise) {
                await authPromise;
            }

            logger.info('PocketBase client initialized successfully');
        } catch (err) {
            // In local dev, don't exit - just warn
            if (isLocalDev) {
                logger.warn('Local dev mode: PocketBase client initialization failed, continuing without full auth:', err.message);
            } else {
                logger.error('Failed to initialize PocketBase client:', err);
                process.exit(1);
            }
        }
    })();
}

export default pocketbaseClient;
export { pocketbaseClient };
