import { NextResponse } from 'next/server';
import { kioskSessionStore } from '@/lib/kiosk-session';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const success = kioskSessionStore.unlockSession(sessionId);
    if (!success) {
      return NextResponse.json({ error: 'Session not found or invalid' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
