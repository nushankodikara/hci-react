import { NextRequest, NextResponse } from 'next/server';
import { getAvailableModels, addModel } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// GET - Fetch available models
export async function GET(req: NextRequest) {
    try {
        const models = await getAvailableModels();
        return NextResponse.json(models, { status: 200 });
    } catch (error) {
        console.error('API GET /api/models error:', error);
        return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
    }
}

// POST - Upload a new model
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('modelFile') as File | null;
        const modelName = formData.get('modelName') as string | null;

        if (!file || !modelName) {
            return NextResponse.json({ error: 'Missing file or model name' }, { status: 400 });
        }

        if (file.type !== 'model/gltf-binary' && file.type !== 'model/gltf+json' && !file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
             return NextResponse.json({ error: 'Invalid file type. Only .gltf or .glb allowed.' }, { status: 400 });
        }

        // Define storage path (relative to project root -> public)
        const uploadDir = path.join(process.cwd(), 'public', 'models', 'uploads');
        const relativeFilePath = path.join('/models', 'uploads', file.name); // Path for client access
        const absoluteFilePath = path.join(uploadDir, file.name);

        // Ensure directory exists (Next.js might handle /public, but good practice)
        await mkdir(uploadDir, { recursive: true });

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Write file to the public directory
        await writeFile(absoluteFilePath, buffer);
        console.log(`File uploaded successfully to: ${absoluteFilePath}`);

        // Add model metadata to database
        const newModelId = await addModel(modelName, relativeFilePath);
        console.log(`Model metadata added to DB with ID: ${newModelId}`);

        return NextResponse.json({ 
            message: 'Model uploaded successfully', 
            model: { id: newModelId, name: modelName, filePath: relativeFilePath } 
        }, { status: 201 });

    } catch (error) {
        console.error('API POST /api/models error:', error);
        // Handle potential file system errors, database errors, etc.
        return NextResponse.json({ error: 'Model upload failed' }, { status: 500 });
    }
} 