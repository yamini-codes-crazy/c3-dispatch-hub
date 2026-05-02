import { useEffect, useRef, useState } from "react";
import { Pencil, Zap, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
  dotClass?: string;
}

interface Props {
  label: string;
  value: string;
  options: Option[];
  aiFilled?: boolean;
  onSave: (v: string) => Promise<void> | void;
}

export function SelectField({
  label,
  value,
  options,
  aiFilled,
  onSave,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref}>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={`Edit ${label}, current value ${value}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="group flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-left text-sm transition hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <span className="flex items-center gap-2">
            {current?.dotClass && (
              <span
                className={`h-2 w-2 rounded-full ${current.dotClass}`}
                aria-hidden
              />
            )}
            <span>{current?.label ?? value}</span>
            {aiFilled && (
              <span className="flex items-center gap-0.5 rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/40">
                <Zap className="h-2.5 w-2.5" /> AI
              </span>
            )}
          </span>
          <Pencil className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-60" />
        </button>
        {open && (
          <ul
            role="listbox"
            className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-xl"
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={active}
                  onClick={async () => {
                    setOpen(false);
                    if (opt.value !== value) await onSave(opt.value);
                  }}
                  className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-white/5"
                >
                  <span className="flex items-center gap-2">
                    {opt.dotClass && (
                      <span
                        className={`h-2 w-2 rounded-full ${opt.dotClass}`}
                        aria-hidden
                      />
                    )}
                    {opt.label}
                  </span>
                  {active && <Check className="h-3.5 w-3.5 text-primary" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
