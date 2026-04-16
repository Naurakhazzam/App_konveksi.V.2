import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { username, code } = await req.json();

  if (!username || !code) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const isFauzan = username.toLowerCase() === 'fauzan';
  if (!isFauzan) {
    return NextResponse.json({ valid: false }, { status: 403 });
  }

  const code1 = process.env.EMERGENCY_CODE_1 || '';
  const code2 = process.env.EMERGENCY_CODE_2 || '';

  const valid = !!(code1 && code === code1) || !!(code2 && code === code2);
  return NextResponse.json({ valid });
}
