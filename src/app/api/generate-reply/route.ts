import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const { instructions } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a professional social media reply assistant. Based on the given instructions, generate a concise, friendly, and professional response. The reply should be brief, insightful, and include appropriate emojis.",
        },
        {
          role: "user",
          content: instructions,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return NextResponse.json({ text: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error generating reply:", error);
    return NextResponse.json(
      { error: "Failed to generate reply" },
      { status: 500 }
    );
  }
}
