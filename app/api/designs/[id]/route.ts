import { NextRequest, NextResponse } from 'next/server';
import { getDesignById, deleteDesign, Design as DbDesign } from '@/lib/db'; // Import the DB type

// ... interface RouteParams ...

// GET - Fetch a specific design by ID
export async function GET(req: NextRequest, { params }: RouteParams) {
    // ... auth check, id parsing ...
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid design ID' }, { status: 400 });
    }

    try {
        const designFromDb: DbDesign | null = await getDesignById(id);
        if (!designFromDb) {
            return NextResponse.json({ error: 'Design not found' }, { status: 404 });
        }

        // Create a new object for the response, parsing JSON fields
        const responseData = {
            id: designFromDb.id,
            name: designFromDb.name,
            createdAt: designFromDb.createdAt,
            room: JSON.parse(designFromDb.roomData || '{}'), // Parse roomData
            furniture: JSON.parse(designFromDb.designData || '[]') // Parse designData
        };

        return NextResponse.json(responseData, { status: 200 });
    } catch (error) {
       // ... error handling ...
         if (error instanceof SyntaxError) {
            // Error parsing the stored JSON - data corruption?
            console.error(`Error parsing stored JSON for design ID ${id}`);
             return NextResponse.json({ error: 'Failed to parse stored design data' }, { status: 500 });
         }
        return NextResponse.json({ error: 'Failed to fetch design' }, { status: 500 });
    }
}

// DELETE - Delete a specific design by ID
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    // ... existing delete logic ...
}
 