import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can only update their own profile unless they are admin
    const isAdmin = (session.user as { role?: string }).role === 'admin';
    const isOwnProfile = (session.user as { id?: string }).id === id;

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, avatar, favoritePlayers } = body;

    // Non-admins cannot change their role
    if (!isAdmin && body.role) {
      delete body.role;
    }

    const updateData: { name?: string; avatar?: string; favoritePlayers?: string[]; role?: string } = {};
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (favoritePlayers !== undefined) updateData.favoritePlayers = favoritePlayers;
    if (isAdmin && body.role !== undefined) updateData.role = body.role;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, name: true, avatar: true, role: true, favoritePlayers: true },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, avatar: true, role: true, favoritePlayers: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
