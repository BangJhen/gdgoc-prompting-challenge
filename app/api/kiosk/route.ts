import { NextResponse } from 'next/server';
import { kioskSessionStore } from '@/lib/kiosk-session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  const session = kioskSessionStore.getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ unlocked: session.unlocked });
}

export async function POST() {
  const sessionId = kioskSessionStore.createSession();
  return NextResponse.json({ sessionId });
}
