import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');

export async function POST(req: Request) {
  try {
    const urlParams = new URL(req.url).searchParams;
    const clipId = urlParams.get('clipId');
    const sceneIndex = urlParams.get('sceneIndex');
    const projectId = urlParams.get('projectId');

    const body = await req.json();
    
    // Validate output signature matching from Replicate context
    if (body.status === 'succeeded' && body.output) {
      const videoOutputUrl = Array.isArray(body.output) ? body.output[0] : body.output;

      // 1. Permanently update the placeholder tracking record inside Supabase row structures
      await supabase
        .from('marketplace_apps')
        .update({ src_url: videoOutputUrl, status: 'ready' })
        .eq('id', clipId);

      console.log(`[Batch Progress] Project ${projectId}: Scene ${sceneIndex} successfully baked.`);
    } else {
      console.warn(`[Batch Warning] Generation processing dropped or canceled for clip reference index: ${clipId}`);
    }

    return NextResponse.json({ handled: true });

  } catch (error: any) {
    console.error('Webhook routing execution error:', error);
    return NextResponse.json({ error: 'Webhook payload evaluation failed' }, { status: 500 });
  }
}
