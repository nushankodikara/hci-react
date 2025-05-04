import { NextRequest, NextResponse } from 'next/server';
import { deleteModelById } from '@/lib/db'; // Import the DB function
import path from 'path';
import fs from 'fs/promises'; // Use promises version of fs

// Handler for DELETE /api/models/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid model ID' }, { status: 400 });
  }

  try {
    // Delete from database and get the deleted model's data
    const deletedModel = await deleteModelById(id);

    if (!deletedModel) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Construct file path (relative to project root)
    // Assumes models are stored in /public/models/
    // Important: Adjust this path if your models are stored elsewhere!
    const filePath = path.join(process.cwd(), 'public', deletedModel.filePath);

    // Attempt to delete the file from the filesystem
    try {
      await fs.unlink(filePath);
      console.log(`Successfully deleted model file: ${filePath}`);
    } catch (fileError: any) {
      // Log an error if file deletion fails, but don't necessarily fail the whole request
      // The DB record is already deleted, which is the primary goal.
      // Could be that the file was already missing.
      console.warn(`Failed to delete model file ${filePath}: ${fileError.message}`);
      // You might want more sophisticated error handling here depending on requirements
    }

    // Return success response (No Content)
    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    console.error(`Error deleting model ID ${id}:`, error);
    return NextResponse.json({ error: 'Failed to delete model', details: error.message }, { status: 500 });
  }
} 