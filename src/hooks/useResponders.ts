import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Responder = Database["public"]["Tables"]["responders"]["Row"];

export function useResponders() {
  const [responders, setResponders] = useState<Responder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase
      .from("responders")
      .select("*")
      .order("name");
    if (!error && data) setResponders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel("responders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "responders" },
        () => {
          fetchAll();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  return { responders, loading };
}
