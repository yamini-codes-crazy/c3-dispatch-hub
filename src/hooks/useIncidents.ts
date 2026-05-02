import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Incident = Database["public"]["Tables"]["incidents"]["Row"];

export function useIncidents(onInsert?: (row: Incident) => void) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const onInsertRef = useRef(onInsert);
  onInsertRef.current = onInsert;

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setIncidents(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel("incidents-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "incidents" },
        (payload) => {
          const row = payload.new as Incident;
          setIncidents((prev) =>
            prev.some((i) => i.id === row.id) ? prev : [row, ...prev],
          );
          onInsertRef.current?.(row);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "incidents" },
        (payload) => {
          const row = payload.new as Incident;
          setIncidents((prev) => prev.map((i) => (i.id === row.id ? row : i)));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  // Optimistic local patch
  const patch = useCallback((id: string, fields: Partial<Incident>) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...fields } : i)),
    );
  }, []);

  return { incidents, loading, refresh: fetchAll, patch };
}
