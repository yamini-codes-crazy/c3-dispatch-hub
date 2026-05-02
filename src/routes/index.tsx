import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dispatch/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "C3 Hub — Emergency Dispatch Dashboard" },
      {
        name: "description",
        content:
          "Mission-critical emergency dispatch console with live calls, AI triage, and one-tap responder dispatch.",
      },
      { property: "og:title", content: "C3 Hub — Emergency Dispatch" },
      {
        property: "og:description",
        content:
          "Real-time incident triage, dispatch, and call bridging for emergency responders.",
      },
    ],
  }),
  component: IndexRoute,
});

function IndexRoute() {
  return <Dashboard />;
}
