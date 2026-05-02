import type { Incident } from "@/hooks/useIncidents";
import { AlertTriangle, CheckCircle2, Clock, Radio } from "lucide-react";

interface Props {
  incidents: Incident[];
}

export function StatsBar({ incidents }: Props) {
  const total = incidents.length;
  const newCount = incidents.filter((i) => i.status === "new").length;
  const dispatched = incidents.filter((i) => i.status === "dispatched").length;
  const resolved = incidents.filter((i) => i.status === "resolved").length;
  const live = incidents.filter((i) => i.vapi_call_id).length;

  const stats = [
    {
      label: "New",
      value: newCount,
      icon: AlertTriangle,
      color: "text-status-new",
      bg: "bg-status-new/10 ring-status-new/30",
    },
    {
      label: "Dispatched",
      value: dispatched,
      icon: Clock,
      color: "text-status-dispatched",
      bg: "bg-status-dispatched/10 ring-status-dispatched/30",
    },
    {
      label: "Resolved",
      value: resolved,
      icon: CheckCircle2,
      color: "text-muted-foreground",
      bg: "bg-white/5 ring-white/10",
    },
    {
      label: "Live Calls",
      value: live,
      icon: Radio,
      color: "text-red-400",
      bg: "bg-red-500/10 ring-red-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className={`glass flex items-center gap-3 px-3 py-2 ring-1 ${s.bg}`}
          >
            <Icon className={`h-4 w-4 ${s.color}`} aria-hidden />
            <div>
              <div className={`font-mono text-lg font-bold ${s.color}`}>
                {s.value}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
            </div>
          </div>
        );
      })}
      <div className="hidden text-[10px] text-muted-foreground md:col-span-4 md:block">
        Total tracked: <span className="font-mono">{total}</span>
      </div>
    </div>
  );
}
