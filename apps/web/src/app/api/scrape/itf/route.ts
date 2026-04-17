import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { scrapeAndSyncPlayers } from '@/lib/scraping/utils';

function validateCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-cron-secret');
  return secret === process.env.CRON_SECRET;
}

export async function POST(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    const result = await scrapeAndSyncPlayers('itf');
    const duration = Date.now() - startTime;

    await prisma.scrapeLog.create({
      data: {
        source: 'itf',
        status: result.failed > 0 ? (result.created > 0 ? 'partial' : 'error') : 'success',
        players: result.total,
        created: result.created,
        updated: result.updated,
        failed: result.failed,
        duration,
        syncResult: JSON.stringify({
          created: result.created,
          updated: result.updated,
          failed: result.failed,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      source: 'itf',
      playersCreated: result.created,
      playersUpdated: result.updated,
      playersFailed: result.failed,
      message: `Successfully scraped ${result.total} ITF players (${result.created} created, ${result.updated} updated)`,
      timestamp,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    await prisma.scrapeLog.create({
      data: {
        source: 'itf',
        status: 'error',
        players: 0,
        created: 0,
        updated: 0,
        failed: 0,
        errors: errorMessage,
        duration,
      },
    }).catch(console.error);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
