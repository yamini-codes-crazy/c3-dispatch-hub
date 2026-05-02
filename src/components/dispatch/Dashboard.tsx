import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useIncidents } from "@/hooks/useIncidents";
import { useResponders } from "@/hooks/useResponders";
import { useAudioBeep } from "@/hooks/useAudioBeep";
import { LoginPage } from "./LoginPage";
import { IncidentList } from "./IncidentList";
import { IncidentDetail } from "./IncidentDetail";
import { ShieldAlert, LogOut, Radio } from "lucide-react";
import { Toaster } from "sonner";

export function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Set up listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Initializing C3 Hub…
      </div>
    );
  }

  return (
    <>
      <Toaster theme="dark" position="top-right" richColors />
      {session ? <DispatchView /> : <LoginPage />}
    </>
  );
}

function DispatchView() {
  const beep = useAudioBeep();
  const { incidents, loading, patch } = useIncidents(() => beep());
  const { responders } = useResponders();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Auto-select first incident on load
  useEffect(() => {
    if (!selectedId && incidents.length > 0) setSelectedId(incidents[0].id);
  }, [incidents, selectedId]);

  const selected = incidents.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/20 ring-1 ring-destructive/40">
            <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden />
          </div>
          <div>
            <div className="font-mono text-base font-bold leading-none tracking-wider">
              C3 HUB
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Emergency Dispatch
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-md bg-green-500/10 px-2 py-1 text-[11px] font-semibold text-green-400 ring-1 ring-green-500/30 sm:flex">
            <Radio className="h-3 w-3" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            REALTIME
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            aria-label="Sign out"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>

      {/* Two pane */}
      <main className="flex flex-1 flex-col gap-4 p-4 md:flex-row">
        {/* Left */}
        <section
          className="flex flex-col md:w-[35%]"
          aria-label="Incident list"
        >
          <div className="glass flex h-full flex-col overflow-hidden p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Active Incidents
              </h2>
              <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-muted-foreground ring-1 ring-white/10">
                {incidents.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              <IncidentList
                incidents={incidents}
                loading={loading}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          </div>
        </section>

        {/* Right */}
        <section className="flex flex-1 flex-col" aria-label="Incident detail">
          {selected ? (
            <IncidentDetail
              incident={selected}
              responders={responders}
              onPatch={patch}
            />
          ) : (
            <div className="glass flex flex-1 items-center justify-center p-12 text-center">
              <div>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <ShieldAlert
                    className="h-6 w-6 text-muted-foreground"
                    aria-hidden
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Select an incident to begin
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
