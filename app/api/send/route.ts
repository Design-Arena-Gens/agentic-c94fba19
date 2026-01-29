import { NextResponse } from "next/server";
import { SendPayload } from "@/lib/types";
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function POST(request: Request) {
  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json(
      {
        error:
          "Twilio credentials are not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM."
      },
      { status: 500 }
    );
  }

  if (!client) {
    return NextResponse.json(
      { error: "Twilio client failed to initialize." },
      { status: 500 }
    );
  }

  try {
    const payload = (await request.json()) as SendPayload;

    if (!payload.to || !payload.message) {
      return NextResponse.json(
        { error: "Missing destination number or message body." },
        { status: 400 }
      );
    }

    const toNumber = payload.to.startsWith("whatsapp:")
      ? payload.to
      : `whatsapp:${payload.to}`;

    const message = await client.messages.create({
      from: fromNumber.startsWith("whatsapp:")
        ? fromNumber
        : `whatsapp:${fromNumber}`,
      to: toNumber,
      body: payload.message
    });

    return NextResponse.json({ sid: message.sid });
  } catch (error) {
    console.error("[TWILIO_SEND_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to send WhatsApp message via Twilio." },
      { status: 500 }
    );
  }
}
