import { NextRequest, NextResponse } from 'next/server';
import { getDesignById, deleteDesign } from '@/lib/db';

// Define RouteParams interface locally
interface RouteParams {
    params: { id: string };
}

// GET - Fetch a specific design by ID
export async function GET(req: NextRequest, { params }: RouteParams) {
    // ... auth check, id parsing ...
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid design ID' }, { status: 400 });
    }

    try {
        const designFromDb = await getDesignById(id);
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
        console.error(`Failed to fetch design ID ${id}:`, error);
        return NextResponse.json({ error: 'Failed to fetch design' }, { status: 500 });
    }
}

// DELETE - Delete a specific design by ID
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    // TODO: Add authentication/authorization check here
    
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
        return NextResponse.json({ error: 'Invalid design ID' }, { status: 400 });
    }

    try {
        await deleteDesign(id); // Call the DB function
        
        // *** Explicitly return success response after successful deletion ***
        return new NextResponse(null, { status: 204 }); // 204 No Content

    } catch (error: any) {
        console.error(`Error deleting design ID ${id}:`, error);
        return NextResponse.json({ error: 'Failed to delete design', details: error.message }, { status: 500 });
    }
}
 