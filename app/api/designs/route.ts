import { NextRequest, NextResponse } from 'next/server';
import { saveDesign, getDesignsList } from '@/lib/db';
// TODO: Add authentication check later

// GET - Fetch list of saved designs
export async function GET(req: NextRequest) {
    // TODO: Check authentication
    try {
        const designs = await getDesignsList();
        return NextResponse.json(designs, { status: 200 });
    } catch (error) {
        console.error('API GET /api/designs error:', error);
        return NextResponse.json({ error: 'Failed to fetch designs list' }, { status: 500 });
    }
}

// POST - Save a new design
export async function POST(req: NextRequest) {
    // TODO: Check authentication
    try {
        const { name, room, furniture } = await req.json();

        if (!name || !room || !furniture) {
            return NextResponse.json({ error: 'Missing required design data (name, room, furniture)' }, { status: 400 });
        }

        // Stringify room and furniture data for storage
        const roomDataString = JSON.stringify(room);
        const furnitureDataString = JSON.stringify(furniture);

        const newDesignId = await saveDesign(name, roomDataString, furnitureDataString);

        return NextResponse.json({ message: 'Design saved successfully', id: newDesignId }, { status: 201 });

    } catch (error) {
        console.error('API POST /api/designs error:', error);
         if (error instanceof SyntaxError) {
             return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
         }
        return NextResponse.json({ error: 'Failed to save design' }, { status: 500 });
    }
} 