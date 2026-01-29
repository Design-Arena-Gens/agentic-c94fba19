import { NextResponse } from "next/server";
import type { AutomationFlow } from "@/lib/types";

function loadAutomations(): AutomationFlow[] {
  const json = process.env.AUTOMATION_FLOWS;
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as AutomationFlow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("[AUTOMATION_FLOWS_PARSE_ERROR]", error);
    return [];
  }
}

function buildTwiML(message: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const params = new URLSearchParams(rawBody);
  const incomingMessage = params.get("Body") ?? "";
  const fromNumber = params.get("From") ?? "unknown";

  const automations = loadAutomations();
  const matchedAutomation = automations.find((flow) =>
    incomingMessage.toLowerCase().includes(flow.triggerPhrase.toLowerCase())
  );

  const responseMessage =
    matchedAutomation?.messagePreview ??
    `Thanks for reaching out! A specialist will respond shortly. (No automation matched for ${fromNumber}).`;

  return new Response(buildTwiML(responseMessage), {
    status: 200,
    headers: {
      "Content-Type": "application/xml"
    }
  });
}

export async function GET() {
  const automations = loadAutomations();
  return NextResponse.json({ automations });
}
