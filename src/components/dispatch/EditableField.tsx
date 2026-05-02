import { useEffect, useRef, useState } from "react";
import { Pencil, Zap } from "lucide-react";

interface Props {
  label: string;
  value: string;
  aiFilled?: boolean;
  validate?: (v: string) => string | null;
  onSave: (v: string) => Promise<void> | void;
}

export function EditableField({
  label,
  value,
  aiFilled,
  validate,
  onSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      setError(null);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [editing, value]);

  const commit = async () => {
    const err = validate?.(draft) ?? null;
    if (err) {
      setError(err);
      return;
    }
    if (draft !== value) {
      await onSave(draft);
    }
    setEditing(false);
  };

  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {editing ? (
        <div>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            aria-label={`Edit ${label}`}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mt-1 text-xs text-red-400"
            >
              {error}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          aria-label={`Edit ${label}, current value ${value}`}
          className="group flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-left text-sm transition hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <span className="flex items-center gap-2">
            <span>{value || <em className="text-muted-foreground">empty</em>}</span>
            {aiFilled && (
              <span
                title="AI-auto-filled"
                className="flex items-center gap-0.5 rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/40"
              >
                <Zap className="h-2.5 w-2.5" /> AI
              </span>
            )}
          </span>
          <Pencil
            className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-60"
            aria-hidden
          />
        </button>
      )}
    </div>
  );
}
