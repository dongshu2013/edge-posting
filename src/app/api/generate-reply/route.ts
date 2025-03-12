import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { getAuthUser } from "@/lib/auth-helpers";
import { getRateLimiter } from "@/lib/rateLimiter";

export async function POST(request: Request) {
  const userData = await getAuthUser();
  if (!userData) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = `generate-reply-${userData.uid}`;

  const rateLimiter = getRateLimiter(identifier, {
    tokensPerInterval: 30,
    interval: "day",
  });

  const isRateLimited = rateLimiter.tryRemoveTokens(1);
  if (!isRateLimited) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const { instructions } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "nousresearch/hermes-3-llama-3.1-70b",
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

    console.log("Completion:", completion);

    return NextResponse.json({ text: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error generating reply:", error);
    return NextResponse.json(
      { error: "Failed to generate reply" },
      { status: 500 }
    );
  }
}
