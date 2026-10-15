const CONSOLE_METHODS = ["debug", "error", "info", "log", "warn"] as const;
// On the server, errors and warnings are the only record of failed auth,
// upload errors or abuse in the Vercel logs, so keep them.
const SERVER_SILENCED_METHODS = ["debug", "info", "log"] as const;

type ConsoleMethod = (typeof CONSOLE_METHODS)[number];

let silenced = false;

export function silenceConsoleInProduction() {
  if (process.env.NODE_ENV !== "production" || silenced) return;

  const noop = () => {};
  const target = console as unknown as Record<
    ConsoleMethod,
    (...data: unknown[]) => void
  >;
  const methods =
    typeof window === "undefined" ? SERVER_SILENCED_METHODS : CONSOLE_METHODS;

  for (const method of methods) {
    target[method] = noop;
  }

  silenced = true;
}
