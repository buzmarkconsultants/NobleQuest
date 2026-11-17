import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mpesa/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleMpesaCallback } = await import("@/lib/mpesa.server");
        return handleMpesaCallback(request);
      },
    },
  },
});
