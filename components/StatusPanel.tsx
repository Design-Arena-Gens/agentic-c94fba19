"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";

interface ActivityLog {
  id: string;
  type: "generation" | "send" | "webhook";
  message: string;
  timestamp: string;
}

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const initialLog: ActivityLog[] = [
  {
    id: "seed-1",
    type: "generation",
    message: "AI ramping prompt injected for onboarding sequence.",
    timestamp: new Date().toISOString()
  }
];

const statusColors = {
  generation: "bg-primary-500/20 text-primary-100 border border-primary-500/20",
  send: "bg-sky-500/20 text-sky-100 border border-sky-500/20",
  webhook: "bg-amber-500/20 text-amber-100 border border-amber-500/20"
};

export function StatusPanel() {
  const [log, setLog] = useState<ActivityLog[]>(initialLog);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLog((prev) => {
        const next: ActivityLog = {
          id: generateId(),
          type: "generation",
          message: "Awaiting next automation run...",
          timestamp: new Date().toISOString()
        };
        return [next, ...prev].slice(0, 10);
      });
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg shadow-primary-950/20">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary-300">
            Runtime Signal & Activity
          </h2>
          <p className="text-sm text-slate-300">
            Monitor AI generations, webhook events, and outbound WhatsApp tests.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/70 px-3 py-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Stack healthy
          </span>
          <span>OpenAI ✓</span>
          <span>Twilio ✓</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[2fr_1fr] md:gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Activity feed
            </span>
            <button
              type="button"
              onClick={() => setLog(initialLog)}
              className="text-xs uppercase tracking-wide text-slate-400 transition hover:text-primary-200"
            >
              Clear
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto px-5 py-4 scrollbar-thin">
            <div className="grid gap-3 text-sm">
              {log.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span
                      className={clsx(
                        "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide",
                        statusColors[entry.type]
                      )}
                    >
                      {entry.type}
                    </span>
                    <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-2 text-slate-200">{entry.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-300">
          <div>
            <h3 className="text-sm font-semibold text-primary-200">
              Twilio WhatsApp Configuration
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Configure your Twilio sandbox or production WhatsApp number. Point the
              incoming webhook to `/api/webhook` and pass inbound payloads to the
              automation engine.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary-200">Environment</h3>
            <ul className="mt-1 space-y-1 text-xs text-slate-400">
              <li>`OPENAI_API_KEY`</li>
              <li>`TWILIO_ACCOUNT_SID`</li>
              <li>`TWILIO_AUTH_TOKEN`</li>
              <li>`TWILIO_WHATSAPP_FROM`</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary-200">Production Tips</h3>
            <ul className="mt-1 space-y-1 text-xs text-slate-400">
              <li>Use LangChain guardrails for compliance responses.</li>
              <li>Persist flows in Supabase or Postgres.</li>
              <li>Connect incoming webhooks to conversation router.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
