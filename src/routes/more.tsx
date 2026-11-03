import { createFileRoute, redirect } from "@tanstack/react-router";

// The More page was folded into the side menu; keep old links working.
export const Route = createFileRoute("/more")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
