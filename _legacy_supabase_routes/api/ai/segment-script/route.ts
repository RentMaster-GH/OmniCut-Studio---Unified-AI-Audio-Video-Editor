import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { masterPrompt, tone, format } = await req.json();

    if (!masterPrompt) {
      return NextResponse.json({ error: 'Missing core storytelling concept prompt' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini infrastructure key is unconfigured' }, { status: 500 });
    }

    // 1. Structure a strict system prompt to enforce structured JSON output back to our client track timeline
    const systemPrompt = `
      You are an elite Hollywood documentary screenplay director and AI prompt engineer.
      Your task is to take a long-form concept prompt and segment it into a high-retention sequential script.
      Break the topic down into logical timeline clip blocks. Each clip must be between 5 to 10 seconds long.
      
      You must respond ONLY with a clean, raw JSON array containing scene objects. Do not wrap in markdown code blocks.
      Each object in the array must strictly match this structural schema:
      {
        "sceneIndex": number,
        "duration": number,
        "narrationText": "The actual narrative script words spoken by the voice profile",
        "visualPrompt": "A hyper-descriptive video generation prompt specifying cinematic camera paths, lighting properties (e.g. volumetric, cinematic), lens elements, and lifelike textures matching a ${tone} atmosphere in a ${format} aspect ratio. Avoid generic buzzwords."
      }
    `;

    // 2. Transmit packet payload directly to the Google Gemini Flash API gateway
    const response = await fetch(
      `https://googleapis.com{apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Concept Prompt: ${masterPrompt}` }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API connection rejection: ${errText}`);
    }

    const data = await response.json();
    const rawTextResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    
    // Parse the structured text string directly back into a standard JavaScript array node
    const structuredScenes = JSON.parse(rawTextResponse.trim());

    return NextResponse.json({ success: true, scenes: structuredScenes });

  } catch (error: any) {
    console.error('Script Segmenter Node Failure:', error);
    return NextResponse.json({ error: 'Internal compilation error within script segmentation asset engine' }, { status: 500 });
  }
}
