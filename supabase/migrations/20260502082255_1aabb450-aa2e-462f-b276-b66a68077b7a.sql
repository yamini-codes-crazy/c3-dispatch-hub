
-- Tables
CREATE TABLE public.responders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit_code text NOT NULL,
  unit_type text NOT NULL,
  phone text NOT NULL,
  available boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','busy','offline')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','dispatched','resolved')),
  location text NOT NULL DEFAULT '',
  type text NOT NULL CHECK (type IN ('Fire','Medical','Police','Hazmat')),
  severity text NOT NULL CHECK (severity IN ('Red','Amber','Green')),
  responder_id uuid REFERENCES public.responders(id) ON DELETE SET NULL,
  transcript text DEFAULT '',
  caller_number text,
  vapi_call_id text,
  ai_filled boolean NOT NULL DEFAULT true,
  alert_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.incident_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  field_changed text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.responders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read responders" ON public.responders FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert responders" ON public.responders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update responders" ON public.responders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth read incidents" ON public.incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert incidents" ON public.incidents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update incidents" ON public.incidents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth read audit" ON public.incident_audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert audit" ON public.incident_audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- Audit trigger
CREATE OR REPLACE FUNCTION public.log_incident_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.incident_audit_log(incident_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'status', OLD.status, NEW.status, uid);
  END IF;
  IF NEW.location IS DISTINCT FROM OLD.location THEN
    INSERT INTO public.incident_audit_log(incident_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'location', OLD.location, NEW.location, uid);
  END IF;
  IF NEW.type IS DISTINCT FROM OLD.type THEN
    INSERT INTO public.incident_audit_log(incident_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'type', OLD.type, NEW.type, uid);
  END IF;
  IF NEW.severity IS DISTINCT FROM OLD.severity THEN
    INSERT INTO public.incident_audit_log(incident_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'severity', OLD.severity, NEW.severity, uid);
  END IF;
  IF NEW.responder_id IS DISTINCT FROM OLD.responder_id THEN
    INSERT INTO public.incident_audit_log(incident_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'responder_id', OLD.responder_id::text, NEW.responder_id::text, uid);
  END IF;
  IF NEW.alert_sent IS DISTINCT FROM OLD.alert_sent THEN
    INSERT INTO public.incident_audit_log(incident_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'alert_sent', OLD.alert_sent::text, NEW.alert_sent::text, uid);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER incidents_audit
AFTER UPDATE ON public.incidents
FOR EACH ROW EXECUTE FUNCTION public.log_incident_changes();

-- Realtime
ALTER TABLE public.incidents REPLICA IDENTITY FULL;
ALTER TABLE public.responders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.responders;
