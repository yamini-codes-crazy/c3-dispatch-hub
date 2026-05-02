import { useEffect, useRef, useState } from "react";
import type { Responder } from "@/hooks/useResponders";
import { Search, Check, UserCircle2 } from "lucide-react";

interface Props {
  responders: Responder[];
  assigned: Responder | null;
  onAssign: (r: Responder) => Promise<void> | void;
}

export function AssignUnit({ responders, assigned, onAssign }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const available = responders.filter((r) => r.status === "available");
  const filtered = available.filter((r) =>
    `${r.name} ${r.unit_code} ${r.unit_type}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );

  return (
    <div ref={ref}>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Assigned Unit
      </div>
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Assign responder unit"
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-left text-sm transition hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <span className="flex items-center gap-2">
            <UserCircle2 className="h-4 w-4 text-muted-foreground" />
            {assigned ? (
              <span>
                {assigned.name} —{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  {assigned.unit_code}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </span>
        </button>

        {open && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search units…"
                aria-label="Search responder units"
                className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <ul role="listbox" className="max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <li className="px-3 py-3 text-xs text-muted-foreground">
                  No available units match.
                </li>
              ) : (
                filtered.map((r) => {
                  const active = assigned?.id === r.id;
                  return (
                    <li
                      key={r.id}
                      role="option"
                      aria-selected={active}
                      onClick={async () => {
                        setOpen(false);
                        await onAssign(r);
                      }}
                      className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-white/5"
                    >
                      <div>
                        <div>{r.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {r.unit_code} · {r.unit_type}
                        </div>
                      </div>
                      {active && <Check className="h-3.5 w-3.5 text-primary" />}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
