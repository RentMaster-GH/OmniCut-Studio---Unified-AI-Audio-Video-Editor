import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase backend connector client using your existing environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    
    // Extract metadata strings sent up from the AI Studio Generator form
    const prompt = form.get('prompt') as string || 'AI Animate Visual Asset';
    const engineMode = form.get('engineMode') as string || 'image-to-video';

    // 1. Guard against empty form payloads
    if (!file) {
      return NextResponse.json({ error: 'Missing file asset payload' }, { status: 400 });
    }

    // 2. Validate configuration tokens explicitly before starting pipelines
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('Storage Error: BLOB_READ_WRITE_TOKEN environment token is missing.');
      return NextResponse.json({ error: 'Storage authentication configuration error' }, { status: 500 });
    }

    // 3. Process cloud storage transmission to Vercel Blob
    const cleanedFilename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const blob = await put(cleanedFilename, file, { 
      access: 'public' 
    });

    // 4. INTEGRATION NODE: Sync details over to your Supabase Marketplace table database
    // This logs the reference link so uploaded assets persist across deployments
    const { data: dbRecord, error: dbError } = await supabase
      .from('marketplace_apps')
      .insert([
        {
          name: file.name,
          src_url: blob.url,
          generation_prompt: prompt,
          engine_mode: engineMode,
          status: 'ready_to_bake',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.warn('Supabase row synchronisation warning details:', dbError.message);
      // We continue even if DB logging fails so the user gets their uploaded asset link back
    }

    // 5. Return the clean URL tracking blocks back to your UI layout context
    return NextResponse.json({ 
      success: true,
      url: blob.url,
      databaseRecord: dbRecord || null
    });

  } catch (error: any) {
    console.error('Upload handler exception trace:', error);
    return NextResponse.json({ error: 'Internal upload server anomaly' }, { status: 500 });
  }
}
