import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { scriptSegment, tone } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    const systemPrompt = `
      You are an expert retention analyst for TikTok, YouTube Shorts, and Netflix documentaries.
      Analyze the following script section and suggest a highly dynamic, visually striking 3-second B-roll clip prompt to overlay onto the timeline to maintain viewer engagement.
      
      Respond ONLY with a raw JSON object matching this schema:
      {
        "bRollPrompt": "A highly detailed, cinematic prompt for a video generator model focusing on dynamic macro motion, texturized lighting, or dramatic perspective shifts matching a ${tone} pacing."
      }
    `;

    const response = await fetch(
      `https://googleapis.com{apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nScript Segment: ${scriptSegment}` }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      }
    );

    const data = await response.json();
    const result = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');

    return NextResponse.json({ success: true, prompt: result.bRollPrompt });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate visual optimization node' }, { status: 500 });
  }
}
