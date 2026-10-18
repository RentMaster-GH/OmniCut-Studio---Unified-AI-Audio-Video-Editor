import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');

export async function POST(req: Request) {
  try {
    const { projectId, scenes, format } = await req.json();

    if (!scenes || !Array.isArray(scenes)) {
      return NextResponse.json({ error: 'Missing structured scene collection arrays' }, { status: 400 });
    }

    // Determine the aspect ratio parameters based on user track format selection
    const aspect_ratio = format === '9:16' ? '9:16' : format === '1:1' ? '1:1' : '16:9';

    // 1. Kick off the asynchronous loop background execution container
    // We intentionally don't await the full loop to keep the route immediate and prevent timeouts
    runBackgroundSequenceBatch(projectId, scenes, aspect_ratio);

    return NextResponse.json({ 
      success: true, 
      message: 'Sequential asset production batch loop successfully pushed to background workers.' 
    });

  } catch (error: any) {
    console.error('Batch Execution Wrapper Anomaly:', error);
    return NextResponse.json({ error: 'Failed to initialize backend batch queues' }, { status: 500 });
  }
}

/**
 * Worker sequence loop tracking handler
 * Dispatches tasks sequentially to respect rate boundaries
 */
async function runBackgroundSequenceBatch(projectId: string, scenes: any[], aspect_ratio: string) {
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  const appUrl = process.env.APP_URL?.replace(/\/\$/, '') || 'https://omnicut-studiounified-ai-audio-vide.vercel.app';

  for (const scene of scenes) {
    try {
      // 1. Generate a structural track placeholder tracking entry inside Supabase
      const { data: clipPlaceholder } = await supabase
        .from('marketplace_apps')
        .insert([
          {
            name: `Project_${projectId}_Scene_${scene.sceneIndex}.mp4`,
            src_url: 'placeholder_processing',
            generation_prompt: scene.visualPrompt,
            engine_mode: 'text-to-video',
            status: 'processing'
          }
        ])
        .select()
        .single();

      // 2. Dispatch the text-to-video request payload straight to the Replicate engine (e.g., Luma Dream Machine API)
      const replicateResponse = await fetch('https://replicate.com', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${replicateToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Utilizing Luma Dream Machine on Replicate for cinematic photorealism
          version: '15d314da101d2a10688a2c2ef74020cff85121b6d13ffde34c56e3e5d32cb5e8', 
          input: {
            prompt: scene.visualPrompt,
            aspect_ratio: aspect_ratio,
            loop: false
          },
          // The critical component: Replicate will hit this endpoint when the video is baked and ready
          webhook: `${appUrl}/api/webhooks/replicate?clipId=${clipPlaceholder.id}&sceneIndex=${scene.sceneIndex}&projectId=${projectId}`,
          webhook_events_filter: ['completed']
        })
      });

      if (!replicateResponse.ok) {
        console.error(`Replicate batch submission skipped for index ${scene.sceneIndex}`);
      }

      // Introduce a tiny 800ms cooldown buffer to avoid hitting concurrent account limit blocks
      await new Promise(resolve => setTimeout(resolve, 800));

    } catch (err) {
      console.error(`Failed to handle generation sequence loop for scene ${scene.sceneIndex}:`, err);
    }
  }
}
