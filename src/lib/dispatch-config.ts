// Runtime config for n8n webhooks. These are public VITE_* vars.
// If unset, the action buttons will show a friendly toast prompting the user
// to configure them in their environment.
export const N8N_LISTEN_URL = import.meta.env.VITE_N8N_LISTEN_URL ?? "";
export const N8N_SMS_URL = import.meta.env.VITE_N8N_SMS_URL ?? "";
export const N8N_BRIDGE_URL = import.meta.env.VITE_N8N_BRIDGE_URL ?? "";
export const WEBHOOK_SECRET = import.meta.env.VITE_WEBHOOK_SECRET ?? "";
