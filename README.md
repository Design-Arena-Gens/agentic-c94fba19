# Agentic WhatsApp Automation

AI-powered WhatsApp automation studio built with Next.js, Tailwind CSS, OpenAI, and Twilio. Capture intents, craft conversational scripts with GPT, test sends, and expose a webhook for production automation.

## Features

- Conversational flow builder with AI-powered messaging drafts.
- Local automation queue with persistent browser storage.
- One-click WhatsApp test delivery via Twilio.
- Real-time activity panel and operator tips.
- Production-ready webhook endpoint for inbound automation.

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Twilio WhatsApp sandbox/number
- OpenAI API key

### Installation

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Environment Variables

Create `.env.local` (see `.env.local.example`):

```bash
OPENAI_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
AUTOMATION_FLOWS=[]
```

- `AUTOMATION_FLOWS` is optional JSON used by the webhook for server-side routing.

## Twilio Webhook

Deploy and point the WhatsApp inbound URL to:

```
POST https://<your-domain>/api/webhook
```

If a trigger phrase matches the inbound message, the stored script is returned in TwiML. Otherwise, a fallback message is sent.

## Scripts

- `npm run dev` – start dev server.
- `npm run build` – production build.
- `npm start` – run production server.
- `npm run lint` – lint with ESLint.

## Production Deployment

This repo is optimized for Vercel. Before deploying, ensure environment variables are set in the Vercel dashboard.
