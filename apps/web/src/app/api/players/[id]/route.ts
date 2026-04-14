import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const player = await prisma.player.findUnique({ where: { id } });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error(`GET /api/players/${id} error:`, error);
    return NextResponse.json({ error: 'Failed to fetch player' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = (session.user as { role?: string }).role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, country, ranking, points, source, image } = body;

    const updateData: { name?: string; country?: string; ranking?: number | null; points?: number | null; source?: string; image?: string | null } = {};
    if (name !== undefined) updateData.name = name;
    if (country !== undefined) updateData.country = country;
    if (ranking !== undefined) updateData.ranking = ranking ? parseInt(String(ranking), 10) : null;
    if (points !== undefined) updateData.points = points ? parseInt(String(points), 10) : null;
    if (source !== undefined) updateData.source = source;
    if (image !== undefined) updateData.image = image ?? null;

    const updated = await prisma.player.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`PATCH /api/players/${id} error:`, error);
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = (session.user as { role?: string }).role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.player.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/players/${id} error:`, error);
    return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 });
  }
}
