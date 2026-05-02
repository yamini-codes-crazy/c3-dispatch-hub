import { useEffect, useState } from "react";
import type { Incident } from "@/hooks/useIncidents";
import { IncidentCard } from "./IncidentCard";
import { Inbox } from "lucide-react";

interface Props {
  incidents: Incident[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function IncidentList({
  incidents,
  loading,
  selectedId,
  onSelect,
}: Props) {
  // Track which incidents are "new" (just inserted) for slide-in + glow.
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [seen, setSeen] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (seen === null) {
      // first load — mark all as seen, none are "new"
      setSeen(new Set(incidents.map((i) => i.id)));
      return;
    }
    const fresh = incidents.filter((i) => !seen.has(i.id)).map((i) => i.id);
    if (fresh.length > 0) {
      setNewIds((prev) => new Set([...prev, ...fresh]));
      setSeen((prev) => new Set([...(prev ?? []), ...fresh]));
      // clear "new" highlight after 8s
      const t = setTimeout(() => {
        setNewIds((prev) => {
          const next = new Set(prev);
          fresh.forEach((id) => next.delete(id));
          return next;
        });
      }, 8000);
      return () => clearTimeout(t);
    }
  }, [incidents, seen]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-2xl shimmer" />
        ))}
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Inbox className="h-10 w-10 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">No incidents yet</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {incidents.map((i) => (
        <li
          key={i.id}
          className={newIds.has(i.id) ? "animate-slide-in-top" : ""}
        >
          <IncidentCard
            incident={i}
            selected={selectedId === i.id}
            isNew={newIds.has(i.id)}
            onSelect={() => onSelect(i.id)}
          />
        </li>
      ))}
    </ul>
  );
}
