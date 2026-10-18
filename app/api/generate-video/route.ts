import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

export async function POST(req: NextRequest) {
  const { prompt, mode, image, imageUrl } = await req.json();
  const finalImage = image || imageUrl;

  try {
    // IMAGE-TO-VIDEO mode: "make the cow fly"
    if (mode === 'image-to-video' && finalImage) {
      // Luma Dream Machine image-to-video
      const output = await replicate.run(
        "luma/dream-machine:ac5d67dc-4d2b-4f2f-89be-5ff60b4d1fb1" as any,
        {
          input: {
            image: finalImage, // accepts URL or base64 data URI
            prompt: prompt, // e.g. "make this cow fly over a field, cinematic, 4k"
            aspect_ratio: "16:9",
            loop: false,
          }
        }
      ) as any;
      
      // output is video URL
      const videoUrl = Array.isArray(output) ? output[0] : output;
      return NextResponse.json({ src: videoUrl, mode });
    }

    // TEXT-TO-VIDEO fallback (your existing logic)
    const output = await replicate.run(
      "luma/dream-machine:ac5d67dc-4d2b-4f2f-89be-5ff60b4d1fb1" as any,
      { input: { prompt } }
    ) as any;

    return NextResponse.json({ src: Array.isArray(output) ? output[0] : output });
    
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
