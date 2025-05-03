import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'session_token';

export async function POST(req: NextRequest) {
  try {
    // Create a response object to modify cookies
    const response = NextResponse.json({ message: 'Logout successful' }, { status: 200 });
    
    // Clear the cookie by setting its maxAge to 0 or using response.cookies.delete()
    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0, // Expire the cookie immediately
      sameSite: 'strict'
    });
    // Alternatively:
    // response.cookies.delete(COOKIE_NAME);

    console.log('User logged out, session cookie cleared.');
    return response;

  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
} 