import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Agentic WhatsApp Automation",
  description:
    "AI-powered WhatsApp automation workflows with conversational intelligence."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
            <div className="mx-auto max-w-6xl px-6 py-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-primary-400">
                    Agentic WhatsApp Automation
                  </h1>
                  <p className="text-sm text-slate-300">
                    Build and deploy AI-driven WhatsApp flows in minutes.
                  </p>
                </div>
                <div className="flex gap-3 text-xs text-slate-400">
                  <span>AI routing</span>
                  <span>Real-time monitoring</span>
                  <span>Twilio WhatsApp API</span>
                </div>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
