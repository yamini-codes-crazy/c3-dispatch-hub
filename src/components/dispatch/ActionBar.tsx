import { useRef, useState } from "react";
import { Headphones, Send, PhoneForwarded, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Incident } from "@/hooks/useIncidents";
import type { Responder } from "@/hooks/useResponders";
import { BridgeModal } from "./BridgeModal";
import { supabase } from "@/integrations/supabase/client";
import {
  N8N_LISTEN_URL,
  N8N_SMS_URL,
  N8N_BRIDGE_URL,
  WEBHOOK_SECRET,
} from "@/lib/dispatch-config";

interface Props {
  incident: Incident;
  responder: Responder | null;
  onPatch: (fields: Partial<Incident>) => void;
}

async function postWebhook(
  url: string,
  body: unknown,
): Promise<void> {
  if (!url) {
    throw new Error(
      "Webhook URL not configured. Set the VITE_N8N_*_URL env var.",
    );
  }
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": WEBHOOK_SECRET,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Webhook ${res.status}`);
}

export function ActionBar({ incident, responder, onPatch }: Props) {
  const live = !!incident.vapi_call_id;

  const [listening, setListening] = useState(false);
  const [listenLoading, setListenLoading] = useState(false);

  const [smsLoading, setSmsLoading] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const [bridgeOpen, setBridgeOpen] = useState(false);
  const [bridgeLoading, setBridgeLoading] = useState(false);
  const [bridgeState, setBridgeState] = useState<
    "idle" | "connected" | "failed"
  >("idle");
  const bridgeBtnRef = useRef<HTMLButtonElement>(null);

  // Re-enable listen if vapi_call_id cleared
  if (!live && listening) setListening(false);

  const handleListen = async () => {
    setListenLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      await postWebhook(N8N_LISTEN_URL, {
        incidentId: incident.id,
        callId: incident.vapi_call_id,
        dispatcherId: u.user?.id ?? null,
      });
      setListening(true);
    } catch (e) {
      toast.error("Failed to connect to live call. Check n8n.", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setListenLoading(false);
    }
  };

  const handleSms = async () => {
    if (!responder) return;
    setSmsLoading(true);
    try {
      await postWebhook(N8N_SMS_URL, {
        incidentId: incident.id,
        to: responder.phone,
        body: `ALERT: ${incident.type} at ${incident.location}. Severity: ${incident.severity}. Respond immediately. — C3 Hub`,
      });
      const { error } = await supabase
        .from("incidents")
        .update({ alert_sent: true })
        .eq("id", incident.id);
      if (error) throw error;
      onPatch({ alert_sent: true });
      setSmsSent(true);
      setTimeout(() => setSmsSent(false), 3000);
    } catch (e) {
      toast.error("SMS failed. Check n8n and Twilio logs.", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSmsLoading(false);
    }
  };

  const handleBridge = async () => {
    if (!responder) return;
    setBridgeOpen(false);
    setBridgeLoading(true);
    try {
      await postWebhook(N8N_BRIDGE_URL, {
        incidentId: incident.id,
        vapi_call_id: incident.vapi_call_id,
        medicNumber: responder.phone,
      });
      setBridgeState("connected");
    } catch {
      setBridgeState("failed");
    } finally {
      setBridgeLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
        {/* Listen Live */}
        {live && (
          <button
            onClick={handleListen}
            disabled={listenLoading || listening}
            aria-label="Listen to live call"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-80"
          >
            {listenLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Headphones className="h-4 w-4" />
            )}
            {listening ? (
              <span className="flex items-center gap-1.5">
                🎧 Listening
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
              </span>
            ) : (
              "Listen Live"
            )}
          </button>
        )}

        {/* Dispatch SMS */}
        <button
          onClick={handleSms}
          disabled={!responder || smsLoading}
          aria-label="Dispatch SMS to assigned responder"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {smsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {smsSent ? "✓ Sent" : "Dispatch SMS"}
        </button>

        {/* Bridge */}
        {live && (
          <div className="flex items-center gap-2">
            <button
              ref={bridgeBtnRef}
              onClick={() => setBridgeOpen(true)}
              disabled={
                !responder ||
                bridgeLoading ||
                bridgeState === "connected"
              }
              aria-label="Bridge call to assigned medic"
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-destructive disabled:cursor-not-allowed disabled:opacity-60 ${
                bridgeState === "connected"
                  ? "border-green-500/40 bg-green-500/10 text-green-400"
                  : bridgeState === "failed"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                    : "border-destructive/50 text-destructive hover:bg-destructive/10"
              }`}
            >
              {bridgeLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PhoneForwarded className="h-4 w-4" />
              )}
              {bridgeLoading
                ? "Connecting…"
                : bridgeState === "connected"
                  ? "✅ Connected to Medic"
                  : bridgeState === "failed"
                    ? "⚠ Bridge failed"
                    : "Bridge Call to Medic"}
            </button>
            {bridgeState === "failed" && (
              <button
                onClick={handleBridge}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      <BridgeModal
        open={bridgeOpen}
        onCancel={() => setBridgeOpen(false)}
        onConfirm={handleBridge}
        triggerRef={bridgeBtnRef}
      />
    </>
  );
}
