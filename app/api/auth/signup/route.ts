import { NextRequest, NextResponse } from 'next/server';
import { addUser, getUserByUsername } from '@/lib/db';
import bcrypt from 'bcrypt';

const saltRounds = 10; // Same as in seed script

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }
        
        // Basic validation (add more as needed)
        if (password.length < 8) {
             return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
        }

        // Check if user already exists (handled by addUser, but good practice to check early)
        // const existingUser = await getUserByUsername(username);
        // if (existingUser) {
        //     return NextResponse.json({ error: 'Username already taken' }, { status: 409 }); // 409 Conflict
        // }

        // Hash password
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Add user to database
        const newUserId = await addUser(username, passwordHash);

        return NextResponse.json({ message: 'User created successfully', userId: newUserId }, { status: 201 });

    } catch (error: any) {
        console.error('Signup API error:', error);
        if (error.message === 'Username already taken') {
             return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
        }
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
} 