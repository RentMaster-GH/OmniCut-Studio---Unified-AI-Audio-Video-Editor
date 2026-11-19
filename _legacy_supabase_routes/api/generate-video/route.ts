import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({ 
  auth: process.env.REPLICATE_API_TOKEN! 
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, mode, image, imageUrl } = body;
    
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    console.log("Generating video for prompt:", prompt, "mode:", mode);

    const finalImage = image || imageUrl;

    // IMAGE-TO-VIDEO - any prompt works
    if (finalImage) {
      const output = await replicate.run(
        "luma/dream-machine:[version needed - will auto-resolve]",
        {
          input: {
            image: finalImage,
            prompt: prompt, // <-- THIS IS YOUR CUSTOM PROMPT, ANY TEXT WORKS
            aspect_ratio: "16:9",
            loop: false,
          }
        }
      ) as any;
      
      const videoUrl = Array.isArray(output) ? output[0] : output;
      return NextResponse.json({ src: videoUrl, mode: 'image-to-video', prompt });
    }

    // TEXT-TO-VIDEO - any prompt works
    const output = await replicate.run(
      "luma/dream-machine",
      { 
        input: { 
          prompt: prompt,
          aspect_ratio: "16:9",
          loop: false
        } 
      }
    ) as any;

    const videoUrl = Array.isArray(output) ? output[0] : output;
    return NextResponse.json({ src: videoUrl, mode: 'text-to-video', prompt });
    
  } catch (e: any) {
    console.error("REPLICATE ERROR:", e);
    return NextResponse.json({ error: e.message || "Failed to generate" }, { status: 500 });
  }
}
