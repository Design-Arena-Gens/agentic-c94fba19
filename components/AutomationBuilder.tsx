"use client";

import { useEffect, useMemo, useState } from "react";
import { AutomationFlow, GeneratePayload, SendPayload } from "@/lib/types";
import { clsx } from "clsx";

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const toneOptions: AutomationFlow["aiTone"][] = [
  "friendly",
  "professional",
  "concise",
  "empathetic"
];

const emptyFlow: GeneratePayload = {
  name: "",
  triggerPhrase: "",
  aiTone: "friendly",
  goal: "",
  context: ""
};

export function AutomationBuilder() {
  const [formState, setFormState] = useState(emptyFlow);
  const [automations, setAutomations] = useState<AutomationFlow[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("automation-flows");
    if (stored) {
      try {
        const parsed: AutomationFlow[] = JSON.parse(stored);
        setAutomations(parsed);
      } catch (error) {
        console.error("Failed to parse automations", error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("automation-flows", JSON.stringify(automations));
  }, [automations]);

  const readyAutomations = useMemo(
    () => automations.filter((flow) => flow.status === "ready"),
    [automations]
  );

  async function handleGenerate() {
    setGlobalError(null);
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState)
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI response");
      }

      const data = await response.json();

      const newAutomation: AutomationFlow = {
        id: generateId(),
        ...formState,
        messagePreview: data.message,
        lastGeneratedAt: new Date().toISOString(),
        status: "ready"
      };

      setAutomations((prev) => [newAutomation, ...prev]);
      setFormState({ ...emptyFlow, aiTone: formState.aiTone });
    } catch (error) {
      console.error(error);
      setGlobalError(
        error instanceof Error ? error.message : "Unknown error generating message"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRegenerate(flow: AutomationFlow) {
    setAutomations((prev) =>
      prev.map((item) =>
        item.id === flow.id
          ? { ...item, status: "draft", error: undefined, messagePreview: "" }
          : item
      )
    );
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: flow.name,
          triggerPhrase: flow.triggerPhrase,
          aiTone: flow.aiTone,
          goal: flow.goal,
          context: flow.context
        })
      });
      if (!response.ok) {
        throw new Error("Failed to regenerate message");
      }
      const data = await response.json();
      setAutomations((prev) =>
        prev.map((item) =>
          item.id === flow.id
            ? {
                ...item,
                messagePreview: data.message,
                lastGeneratedAt: new Date().toISOString(),
                status: "ready"
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      setAutomations((prev) =>
        prev.map((item) =>
          item.id === flow.id
            ? {
                ...item,
                status: "error",
                error:
                  error instanceof Error
                    ? error.message
                    : "AI regeneration failed. Try again."
              }
            : item
        )
      );
    }
  }

  async function handleSend(flow: AutomationFlow) {
    if (!flow.testPhone) {
      setAutomations((prev) =>
        prev.map((item) =>
          item.id === flow.id
            ? {
                ...item,
                status: "error",
                error: "Add a WhatsApp number before sending."
              }
            : item
        )
      );
      return;
    }

    setIsSending(flow.id);
    setAutomations((prev) =>
      prev.map((item) =>
        item.id === flow.id ? { ...item, status: "sending", error: undefined } : item
      )
    );

    const payload: SendPayload = {
      to: flow.testPhone,
      message: flow.messagePreview
    };

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to dispatch WhatsApp message");
      }

      setAutomations((prev) =>
        prev.map((item) =>
          item.id === flow.id
            ? {
                ...item,
                status: "ready",
                error: undefined
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      setAutomations((prev) =>
        prev.map((item) =>
          item.id === flow.id
            ? {
                ...item,
                status: "error",
                error:
                  error instanceof Error
                    ? error.message
                    : "WhatsApp dispatch failed. Check Twilio credentials."
              }
            : item
        )
      );
    } finally {
      setIsSending(null);
    }
  }

  function updateFlow(id: string, next: Partial<AutomationFlow>) {
    setAutomations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...next } : item))
    );
  }

  function deleteFlow(id: string) {
    setAutomations((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg shadow-primary-950/20">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-primary-300">
            Create Automation Flow
          </h2>
          <p className="text-sm text-slate-300">
            Define a trigger, describe the conversation goal, and let the AI craft the
            optimal WhatsApp response.
          </p>
        </div>

        {globalError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {globalError}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200">
                Automation name
              </label>
              <input
                className="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                placeholder="New Lead Capture"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200">
                Trigger phrase / intent
              </label>
              <input
                className="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                placeholder="User asks about pricing"
                value={formState.triggerPhrase}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    triggerPhrase: event.target.value
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200">
                Goal for the AI agent
              </label>
              <textarea
                className="h-24 rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                placeholder="Move the user to schedule a demo. Capture company size and preferred time."
                value={formState.goal}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, goal: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200">
                Tone & personality
              </label>
              <div className="flex flex-wrap gap-2">
                {toneOptions.map((tone) => {
                  const isActive = formState.aiTone === tone;
                  return (
                    <button
                      key={tone}
                      onClick={() => setFormState((prev) => ({ ...prev, aiTone: tone }))}
                      type="button"
                      className={clsx(
                        "rounded-full border px-4 py-2 text-xs uppercase tracking-wide transition",
                        isActive
                          ? "border-primary-400 bg-primary-500/20 text-primary-200 shadow shadow-primary-900/40"
                          : "border-slate-700 bg-slate-900 text-slate-300 hover:border-primary-500/60 hover:text-primary-200"
                      )}
                    >
                      {tone}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200">
                Customer context / knowledge base excerpt
              </label>
              <textarea
                className="h-32 rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                placeholder="Product tiers: Starter ($29), Growth ($99), Scale ($249). Demo booking link: https://cal.com/team/demo"
                value={formState.context}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, context: event.target.value }))
                }
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={
                isGenerating ||
                !formState.name ||
                !formState.triggerPhrase ||
                !formState.goal
              }
              className={clsx(
                "mt-auto flex items-center justify-center gap-2 rounded-lg border border-primary-500/40 bg-primary-500/20 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-primary-100 transition hover:border-primary-400 hover:bg-primary-500/25",
                isGenerating && "opacity-80"
              )}
            >
              {isGenerating ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-200 border-t-transparent" />
                  Generating...
                </>
              ) : (
                "Generate AI Script"
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg shadow-primary-950/20">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary-300">Automation Queue</h2>
            <p className="text-sm text-slate-300">
              Review, refine, and deploy WhatsApp flows. Ready flows can be synced to
              Twilio Studio or Functions.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/70 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-primary-400" />
              {readyAutomations.length} ready
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/70 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              {automations.filter((flow) => flow.status === "draft").length} drafts
            </span>
          </div>
        </div>

        {automations.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center text-sm text-slate-400">
            No automations yet. Capture a business intent, describe the outcome, and
            generate your first conversational flow.
          </div>
        )}

        <div className="grid gap-4">
          {automations.map((flow) => {
            const statusBadge = {
              ready: "bg-primary-500/15 text-primary-200 border border-primary-500/30",
              draft: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
              error: "bg-red-500/15 text-red-200 border border-red-500/30",
              sending: "bg-sky-500/15 text-sky-200 border border-sky-500/30"
            }[flow.status];

            return (
              <article
                key={flow.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 transition hover:border-primary-500/30"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">{flow.name}</h3>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Trigger: {flow.triggerPhrase}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", statusBadge)}>
                      {flow.status === "sending" ? "sending test..." : flow.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRegenerate(flow)}
                      className="text-xs uppercase tracking-wide text-primary-200 transition hover:text-primary-100"
                    >
                      Regenerate
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFlow(flow.id)}
                      className="text-xs uppercase tracking-wide text-slate-400 transition hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[1.5fr_1fr] md:gap-6">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      AI Script
                    </label>
                    <textarea
                      className="mt-2 h-40 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                      value={flow.messagePreview}
                      onChange={(event) =>
                        updateFlow(flow.id, { messagePreview: event.target.value })
                      }
                    />
                    <p className="mt-2 text-[11px] text-slate-400">
                      Customize the AI prompt before syncing to production.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Test WhatsApp number
                      </label>
                      <input
                        placeholder="whatsapp:+14155551234"
                        value={flow.testPhone ?? ""}
                        onChange={(event) =>
                          updateFlow(flow.id, { testPhone: event.target.value })
                        }
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                      />
                    </div>

                    <button
                      onClick={() => handleSend(flow)}
                      disabled={isSending === flow.id}
                      className={clsx(
                        "flex items-center justify-center gap-2 rounded-lg border border-primary-500/40 bg-primary-500/20 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-primary-100 transition hover:border-primary-400 hover:bg-primary-500/25",
                        isSending === flow.id && "opacity-70"
                      )}
                    >
                      {isSending === flow.id ? (
                        <>
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-200 border-t-transparent" />
                          Sending test...
                        </>
                      ) : (
                        "Send test to WhatsApp"
                      )}
                    </button>

                    {flow.error && (
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                        {flow.error}
                      </div>
                    )}

                    <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-[11px] text-slate-400">
                      <p>Next Steps:</p>
                      <ul className="mt-1 list-disc pl-4">
                        <li>Configure Twilio webhook to `/api/webhook` (customize).</li>
                        <li>Attach this script to Studio or use Functions for routing.</li>
                        <li>Watch the monitoring feed for real-time events.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
