import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
// import { cookies } from 'next/headers'; // Don't need cookies() directly for setting

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key-change-me'; // Use environment variable!
const COOKIE_NAME = 'session_token';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = await getUserByUsername(username);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }); // User not found
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }); // Password incorrect
    }

    // --- Authentication Successful --- 
    console.log(`User ${username} authenticated successfully.`);

    // Create JWT Payload
    const payload = { userId: user.id, username: user.username };
    
    // Sign the token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Expires in 1 hour

    // Create the response and set the cookie
    const response = NextResponse.json({ message: 'Login successful' }, { status: 200 });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      path: '/',
      maxAge: 60 * 60, // 1 hour in seconds
      sameSite: 'strict'
    });

    return response; // Return the response with the cookie set

  } catch (error) {
    console.error('Login API error:', error);
    // Check if error is due to invalid JSON format
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 