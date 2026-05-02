interface Props {
  value: "new" | "dispatched" | "resolved";
  onChange: (v: "new" | "dispatched" | "resolved") => void;
}

const OPTIONS: Array<{
  value: "new" | "dispatched" | "resolved";
  label: string;
  cls: string;
}> = [
  {
    value: "new",
    label: "New",
    cls: "bg-status-new/20 text-status-new ring-status-new/50",
  },
  {
    value: "dispatched",
    label: "Dispatched",
    cls: "bg-status-dispatched/20 text-status-dispatched ring-status-dispatched/50",
  },
  {
    value: "resolved",
    label: "Resolved",
    cls: "bg-status-resolved/30 text-foreground ring-status-resolved/50",
  },
];

export function StatusSelector({ value, onChange }: Props) {
  const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = (idx + dir + OPTIONS.length) % OPTIONS.length;
      onChange(OPTIONS[next].value);
      const buttons = (e.currentTarget.parentElement?.querySelectorAll(
        "button",
      ) ?? []) as NodeListOf<HTMLButtonElement>;
      buttons[next]?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Incident status"
      className="inline-flex gap-1 rounded-xl border border-white/10 bg-black/30 p-1"
    >
      {OPTIONS.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            aria-label={`Set status to ${opt.label}`}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary ${
              active
                ? `ring-1 ${opt.cls}`
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
