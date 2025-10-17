import { NextResponse } from 'next/server';

// This endpoint doesn't exist but something keeps requesting it
// Return 404 silently to avoid log spam
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
