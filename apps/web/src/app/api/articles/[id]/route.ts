import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error(`GET /api/articles/${id} error:`, error);
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    const isAdmin = (session.user as { role?: string }).role === 'admin';

    // Check article exists and user has permission
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Authors can edit their own articles; admins can edit any
    if (!isAdmin && existing.authorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, cover, status, tags, player_name } = body;

    const updateData: { title?: string; content?: string; cover?: string | null; status?: string; tags?: unknown; playerName?: string } = {};

    // Authors can only update certain fields; admins can update status too
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (cover !== undefined) updateData.cover = cover ?? null;
    if (tags !== undefined) updateData.tags = tags;
    if (player_name !== undefined) updateData.playerName = player_name;

    if (isAdmin && status !== undefined) {
      updateData.status = status;
    }

    const updated = await prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`PATCH /api/articles/${id} error:`, error);
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    const isAdmin = (session.user as { role?: string }).role === 'admin';

    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Authors can delete their own articles; admins can delete any
    if (!isAdmin && existing.authorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.article.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/articles/${id} error:`, error);
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
  }
}
