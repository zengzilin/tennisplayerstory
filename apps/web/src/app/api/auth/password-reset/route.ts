import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import prisma from '@/lib/prisma';

// In production, integrate with an email provider (e.g., Resend, SendGrid).
// For now, we generate the token and log the reset URL.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If an account exists, a reset email has been sent' });
    }

    // Delete any existing tokens for this user
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

    // Generate a reset token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    // Build the reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/api/auth/reset-password?token=${token}`;

    // Log the reset URL (in production, send via email)
    console.log(`[Password Reset] URL for ${email}: ${resetUrl}`);

    return NextResponse.json({ message: 'If an account exists, a reset email has been sent' });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}
