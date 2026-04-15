import { NextRequest, NextResponse } from 'next/server';
import { getScrapingPbClient, checkPbHealth } from '@/lib/pocketbase-scraping';

function validateCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-cron-secret');
  return secret === process.env.CRON_SECRET;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  // All scrape endpoints require CRON_SECRET
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // GET status — last update timestamps per source
  if (action === 'status') {
    try {
      const { pb, cleanup } = await getScrapingPbClient();
      defer(cleanup);

      const sources = ['atp', 'wta', 'itf'];
      const status: Record<string, { lastUpdate: string | null; lastStatus: string | null }> = {};

      for (const source of sources) {
        try {
          const records = await pb
            .collection('scrape_logs')
            .getFirstListItem(`source="${source}"`, { sort: '-created', $autoCancel: false });

          status[source] = {
            lastUpdate: records.created,
            lastStatus: records.status,
          };
        } catch {
          status[source] = { lastUpdate: null, lastStatus: null };
        }
      }

      return NextResponse.json({ status: 'ok', data: status });
    } catch (err) {
      return NextResponse.json(
        { error: `Database error: ${err instanceof Error ? err.message : String(err)}` },
        { status: 500 }
      );
    }
  }

  // GET logs — recent scrape logs with pagination
  if (action === 'logs') {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '20', 10), 100);

    try {
      const { pb, cleanup } = await getScrapingPbClient();
      defer(cleanup);

      const result = await pb.collection('scrape_logs').getList(page, perPage, {
        sort: '-created',
        $autoCancel: false,
      });

      return NextResponse.json({
        status: 'ok',
        data: {
          logs: result.items,
          total: result.totalItems,
          page: result.page,
          perPage: result.perPage,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      return NextResponse.json(
        { error: `Database error: ${err instanceof Error ? err.message : String(err)}` },
        { status: 500 }
      );
    }
  }

  // GET stats — total players count and recent updates
  if (action === 'stats') {
    try {
      const { pb, cleanup } = await getScrapingPbClient();
      defer(cleanup);

      const sources = ['atp', 'wta', 'itf'] as const;
      const stats: Record<string, { total: number; lastUpdate: string | null }> = {};

      for (const source of sources) {
        try {
          const total = await pb.collection('players').getList(1, 1, {
            filter: `source="${source}"`,
            $autoCancel: false,
          });

          const lastRecord = await pb.collection('scrape_logs').getFirstListItem(
            `source="${source}" && status="success"`,
            { sort: '-created', $autoCancel: false }
          );

          stats[source] = {
            total: total.totalItems,
            lastUpdate: lastRecord?.created ?? null,
          };
        } catch {
          stats[source] = { total: 0, lastUpdate: null };
        }
      }

      return NextResponse.json({ status: 'ok', data: stats });
    } catch (err) {
      return NextResponse.json(
        { error: `Database error: ${err instanceof Error ? err.message : String(err)}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// POST all — scrape all three sources sequentially
export async function POST(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pbHealth = await checkPbHealth();
    if (!pbHealth) {
      return NextResponse.json({ error: 'PocketBase is not available' }, { status: 503 });
    }

    // Trigger all three sources by calling their respective route handlers
    // In Next.js App Router, we can use fetch to call the internal routes
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const cronSecret = process.env.CRON_SECRET;

    const results: Record<string, unknown> = {};
    const errors: string[] = [];

    const sources = [
      { name: 'atp', path: '/api/scrape/atp' },
      { name: 'wta', path: '/api/scrape/wta' },
      { name: 'itf', path: '/api/scrape/itf' },
    ];

    for (const { name, path } of sources) {
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          method: 'POST',
          headers: {
            'x-cron-secret': cronSecret || '',
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(300000), // 5 min timeout per source
        });

        const data = await response.json();
        results[name] = data;

        if (!response.ok) {
          errors.push(`${name}: ${data.error || response.statusText}`);
        }
      } catch (err) {
        errors.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
        results[name] = { error: String(err) };
      }
    }

    return NextResponse.json({
      status: errors.length === 0 ? 'ok' : 'partial',
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Internal error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

function defer(fn: () => void): void {
  // Simple cleanup helper — runs after the function returns
  setTimeout(fn, 0);
}
