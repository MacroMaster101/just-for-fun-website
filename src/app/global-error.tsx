"use client";

import { useEffect } from "react";

/**
 * Last-resort error boundary for failures in the root layout itself (where
 * the normal error.tsx can't render because the layout chain is broken).
 * Must supply its own <html>/<body>. Kept dependency-free and inline-styled
 * so it works even if fonts/providers/CSS fail to load.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#070707",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: 900, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ color: "#a3a3a3", maxWidth: "28rem", marginTop: "12px" }}>
          The site hit a critical error. Please reload the page.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "24px",
            border: "none",
            borderRadius: "8px",
            background: "linear-gradient(to right, #ff0033, #ff2d55)",
            color: "#fff",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
