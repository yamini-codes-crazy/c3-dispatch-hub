import { useMemo } from "react";
import type { Incident } from "@/hooks/useIncidents";
import type { Responder } from "@/hooks/useResponders";
import { supabase } from "@/integrations/supabase/client";
import { shortId } from "@/lib/format";
import { StatusSelector } from "./StatusSelector";
import { EditableField } from "./EditableField";
import { SelectField } from "./SelectField";
import { AssignUnit } from "./AssignUnit";
import { ActionBar } from "./ActionBar";
import { Zap } from "lucide-react";
import { toast } from "sonner";

interface Props {
  incident: Incident;
  responders: Responder[];
  onPatch: (id: string, fields: Partial<Incident>) => void;
}

export function IncidentDetail({ incident, responders, onPatch }: Props) {
  const assigned = useMemo(
    () => responders.find((r) => r.id === incident.responder_id) ?? null,
    [responders, incident.responder_id],
  );

  const update = async (fields: Partial<Incident>) => {
    onPatch(incident.id, fields);
    const { error } = await supabase
      .from("incidents")
      .update(fields)
      .eq("id", incident.id);
    if (error) {
      toast.error("Update failed", { description: error.message });
    }
  };

  return (
    <div className="glass flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Incident
          </div>
          <div className="font-mono text-2xl font-bold tracking-wider">
            #{shortId(incident.id)}
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            {new Date(incident.created_at).toLocaleString()}
          </div>
        </div>
        {incident.vapi_call_id && (
          <span className="flex items-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-400 ring-1 ring-red-500/40">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            LIVE CALL
          </span>
        )}
      </div>

      {/* Status */}
      <div className="mb-5">
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Status
        </div>
        <StatusSelector
          value={incident.status as "new" | "dispatched" | "resolved"}
          onChange={(v) => update({ status: v })}
        />
      </div>

      {/* Editable fields */}
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <EditableField
          label="Location"
          value={incident.location}
          aiFilled={incident.ai_filled}
          validate={(v) => (v.trim() === "" ? "Location cannot be empty" : null)}
          onSave={(v) => update({ location: v.trim() })}
        />
        <SelectField
          label="Emergency Type"
          value={incident.type}
          aiFilled={incident.ai_filled}
          options={[
            { value: "Fire", label: "Fire" },
            { value: "Medical", label: "Medical" },
            { value: "Police", label: "Police" },
            { value: "Hazmat", label: "Hazmat" },
          ]}
          onSave={(v) => update({ type: v })}
        />
        <SelectField
          label="Severity"
          value={incident.severity}
          aiFilled={incident.ai_filled}
          options={[
            { value: "Red", label: "Red", dotClass: "bg-severity-red" },
            { value: "Amber", label: "Amber", dotClass: "bg-severity-amber" },
            { value: "Green", label: "Green", dotClass: "bg-severity-green" },
          ]}
          onSave={(v) => update({ severity: v })}
        />
        <AssignUnit
          responders={responders}
          assigned={assigned}
          onAssign={(r) => update({ responder_id: r.id })}
        />
      </div>

      {/* Transcript */}
      <div className="mb-5">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Zap className="h-3 w-3 text-primary" /> AI Transcript
        </div>
        <div className="glass-inset max-h-[120px] overflow-y-auto p-3 font-mono text-sm leading-relaxed">
          {incident.transcript || (
            <span className="text-muted-foreground">No transcript.</span>
          )}
        </div>
      </div>

      {/* Caller */}
      {incident.caller_number && (
        <div className="mb-5 text-xs text-muted-foreground">
          Caller:{" "}
          <span className="font-mono text-foreground">
            {incident.caller_number}
          </span>
        </div>
      )}

      <div className="mt-auto">
        <ActionBar
          incident={incident}
          responder={assigned}
          onPatch={(fields) => onPatch(incident.id, fields)}
        />
      </div>
    </div>
  );
}
