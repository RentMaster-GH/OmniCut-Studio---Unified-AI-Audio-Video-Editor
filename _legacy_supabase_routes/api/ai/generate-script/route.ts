import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt || body.idea || body.text || "";
    
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    console.log("Generating script for:", prompt);

    // Use GEMINI_API_KEY or GENERATIVE_AI_KEY
    const apiKey = process.env.GEMINI_API_KEY || process.env.GENERATIVE_AI_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "No Gemini API key set" }, { status: 500 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1000 }
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Gemini error:", data);
      return NextResponse.json({ error: data.error?.message || "Gemini failed" }, { status: 500 });
    }

    const script = data.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to generate script";

    return NextResponse.json({ script, prompt });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
