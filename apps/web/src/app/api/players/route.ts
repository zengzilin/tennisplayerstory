import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source'); // "atp" | "wta" | "itf"
    const sort = searchParams.get('sort') ?? 'ranking';
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '100', 10);
    const skip = (page - 1) * pageSize;

    const where: { source?: string } = {};
    if (source) {
      where.source = source;
    }

    const [items, total] = await Promise.all([
      prisma.player.findMany({
        where,
        orderBy: sort === 'ranking'
          ? [{ ranking: 'asc' }]
          : sort === '-created'
          ? [{ created: 'desc' }]
          : [{ ranking: 'asc' }],
        skip,
        take: pageSize,
      }),
      prisma.player.count({ where }),
    ]);

    return NextResponse.json({
      items,
      totalItems: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('GET /api/players error:', error);
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}
