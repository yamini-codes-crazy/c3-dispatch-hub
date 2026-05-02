import type { Incident } from "@/hooks/useIncidents";
import { timeAgo } from "@/lib/format";
import { Flame, HeartPulse, Shield, FlaskConical } from "lucide-react";

const TYPE_ICON = {
  Fire: Flame,
  Medical: HeartPulse,
  Police: Shield,
  Hazmat: FlaskConical,
} as const;

const SEVERITY_DOT = {
  Red: "bg-severity-red",
  Amber: "bg-severity-amber",
  Green: "bg-severity-green",
} as const;

const STATUS_BADGE = {
  new: "bg-status-new/20 text-status-new ring-1 ring-status-new/40",
  dispatched:
    "bg-status-dispatched/20 text-status-dispatched ring-1 ring-status-dispatched/40",
  resolved:
    "bg-status-resolved/20 text-status-resolved ring-1 ring-status-resolved/40",
} as const;

interface Props {
  incident: Incident;
  selected: boolean;
  isNew: boolean;
  onSelect: () => void;
}

export function IncidentCard({ incident, selected, isNew, onSelect }: Props) {
  const Icon = TYPE_ICON[incident.type as keyof typeof TYPE_ICON] ?? Flame;
  const isRed = incident.severity === "Red";
  const live = !!incident.vapi_call_id;

  const ringClass = selected
    ? "ring-2 ring-primary"
    : isRed
      ? "ring-2 ring-red-500 animate-pulse"
      : isNew
        ? "ring-2 ring-blue-400 shadow-[0_0_24px_-4px_oklch(0.65_0.20_255_/_0.6)]"
        : "ring-1 ring-white/10";

  return (
    <button
      onClick={onSelect}
      aria-label={`Incident ${incident.type} severity ${incident.severity}`}
      className={`group w-full rounded-2xl bg-white/5 p-4 text-left backdrop-blur-xl transition hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-primary ${ringClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
            <Icon className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{incident.type}</span>
              <span
                className={`h-2 w-2 rounded-full ${SEVERITY_DOT[incident.severity as keyof typeof SEVERITY_DOT]}`}
                aria-hidden
              />
              <span className="text-xs text-muted-foreground">
                {incident.severity}
              </span>
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              {timeAgo(incident.created_at)}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[incident.status as keyof typeof STATUS_BADGE]}`}
          >
            {incident.status}
          </span>
          {live && (
            <span className="flex items-center gap-1 rounded-md bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400 ring-1 ring-red-500/40">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              LIVE
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 line-clamp-1 text-xs text-muted-foreground">
        {incident.location?.slice(0, 40) || "—"}
      </p>
    </button>
  );
}
