import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? 'approved';
    const sort = searchParams.get('sort') ?? '-created';
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10);
    const skip = (page - 1) * pageSize;

    const where: { status?: string; authorId?: string } = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: sort.replace('-', '') === 'updated'
          ? [{ updatedAt: 'desc' }]
          : [{ createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      prisma.article.count({ where }),
    ]);

    // PocketBase returns items in an `items` array; keep that shape for client compat
    return NextResponse.json({
      items,
      totalItems: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('GET /api/articles error:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, player_name, cover, tags } = body;

    if (!title || !content || !player_name) {
      return NextResponse.json({ error: 'title, content and player_name are required' }, { status: 400 });
    }

    const article = await prisma.article.create({
      data: {
        title,
        content,
        playerName: player_name,
        cover: cover ?? null,
        tags: Array.isArray(tags) ? tags : [],
        status: 'pending',
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error('POST /api/articles error:', error);
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }
}
