import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
      const sources = ['atp', 'wta', 'itf'];
      const status: Record<string, { lastUpdate: string | null; lastStatus: string | null }> = {};

      for (const source of sources) {
        const lastLog = await prisma.scrapeLog.findFirst({
          where: { source },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true, status: true },
        });

        status[source] = {
          lastUpdate: lastLog?.createdAt?.toISOString() ?? null,
          lastStatus: lastLog?.status ?? null,
        };
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
    const skip = (page - 1) * perPage;

    try {
      const [logs, total] = await Promise.all([
        prisma.scrapeLog.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: perPage,
        }),
        prisma.scrapeLog.count(),
      ]);

      return NextResponse.json({
        status: 'ok',
        data: {
          logs,
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
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
      const sources = ['atp', 'wta', 'itf'] as const;
      const stats: Record<string, { total: number; lastUpdate: string | null }> = {};

      for (const source of sources) {
        const [total, lastLog] = await Promise.all([
          prisma.player.count({ where: { source } }),
          prisma.scrapeLog.findFirst({
            where: { source, status: 'success' },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
        ]);

        stats[source] = {
          total,
          lastUpdate: lastLog?.createdAt?.toISOString() ?? null,
        };
      }

      // Calculate overall stats
      const totalPlayers = await prisma.player.count();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentUpdates = await prisma.scrapeLog.count({
        where: { createdAt: { gte: oneDayAgo } },
      });

      return NextResponse.json({
        status: 'ok',
        data: {
          sources: stats,
          totalPlayers,
          recentUpdates,
        },
      });
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
    // Trigger all three sources by calling their respective route handlers
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
