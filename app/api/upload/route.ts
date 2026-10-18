import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;

    // 1. Guard against empty form payloads
    if (!file) {
      return NextResponse.json({ error: 'Missing file asset payload' }, { status: 400 });
    }

    // 2. Validate token availability explicitly before hitting the Vercel server pipeline
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('Storage Error: BLOB_READ_WRITE_TOKEN environment token is missing.');
      return NextResponse.json({ error: 'Storage authentication configuration error' }, { status: 500 });
    }

    // 3. Process cloud storage transmission using clean sanitized filenames
    const cleanedFilename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const blob = await put(cleanedFilename, file, { 
      access: 'public' 
    });

    return NextResponse.json({ url: blob.url });

  } catch (error: any) {
    console.error('Upload handler exception trace:', error);
    return NextResponse.json({ error: 'Internal upload server anomaly' }, { status: 500 });
  }
}
