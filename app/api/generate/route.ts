import { NextResponse } from "next/server";
import { GeneratePayload } from "@/lib/types";
import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!cachedClient) {
    cachedClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return cachedClient;
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 }
    );
  }

  try {
    const client = getClient();
    if (!client) {
      return NextResponse.json(
        { error: "OpenAI client could not be initialized." },
        { status: 500 }
      );
    }

    const payload = (await request.json()) as GeneratePayload;

    if (!payload.name || !payload.triggerPhrase || !payload.goal) {
      return NextResponse.json(
        { error: "Missing required fields for AI generation." },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert WhatsApp automation copywriter.
Generate a single WhatsApp message that feels human, handles objections, and aligns with the business goal.
Constraints:
- Use natural language with sentence case.
- Keep to 120-180 words.
- End with a clear call-to-action.
- If context includes links, incorporate them once.
- Ask at most two questions in one message.`;

    const userPrompt = `
Automation Name: ${payload.name}
Trigger Phrase: ${payload.triggerPhrase}
Desired Tone: ${payload.aiTone}
Goal: ${payload.goal}
Knowledge Base / Context: ${payload.context || "None provided"}

Craft the WhatsApp reply in Markdown bullet-friendly format where appropriate.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const message =
      completion.choices[0]?.message?.content?.trim() ??
      "Hi there! I'd love to help, but I could not generate a response. Please try again.";

    return NextResponse.json({ message });
  } catch (error) {
    console.error("[AI_GENERATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to contact OpenAI. Review logs for more details." },
      { status: 500 }
    );
  }
}
