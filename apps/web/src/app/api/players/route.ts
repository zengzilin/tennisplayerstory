import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const sort = searchParams.get('sort') ?? 'ranking';
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '100', 10);
    const skip = (page - 1) * pageSize;
    const name = searchParams.get('name');
    const country = searchParams.get('country');
    const checkDuplicate = searchParams.get('checkDuplicate') === 'true';

    const where: { source?: string; name?: { contains: string; mode: 'insensitive' }; country?: string } = {};
    if (source) {
      where.source = source;
    }
    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }
    if (country) {
      where.country = country;
    }

    // Handle duplicate check
    if (checkDuplicate && name && source) {
      const existing = await prisma.player.findFirst({
        where: {
          name: { equals: name, mode: 'insensitive' },
          source,
        },
      });
      return NextResponse.json({ data: existing });
    }

    const [items, total] = await Promise.all([
      prisma.player.findMany({
        where,
        orderBy: sort === 'ranking'
          ? [{ ranking: 'asc' }]
          : sort === '-created'
          ? [{ createdAt: 'desc' }]
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

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = (session.user as { role?: string }).role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, country, ranking, points, source, image } = body;

    if (!name || !country || !source) {
      return NextResponse.json({ error: 'name, country and source are required' }, { status: 400 });
    }

    const player = await prisma.player.create({
      data: {
        name,
        country,
        ranking: ranking ? parseInt(String(ranking), 10) : null,
        points: points ? parseInt(String(points), 10) : null,
        source,
        image: image ?? null,
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error('POST /api/players error:', error);
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 });
  }
}
