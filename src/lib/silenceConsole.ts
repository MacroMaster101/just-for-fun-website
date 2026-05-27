const CONSOLE_METHODS = ["debug", "error", "info", "log", "warn"] as const;

type ConsoleMethod = (typeof CONSOLE_METHODS)[number];

let silenced = false;

export function silenceConsoleInProduction() {
  if (process.env.NODE_ENV !== "production" || silenced) return;

  const noop = () => {};
  const target = console as unknown as Record<
    ConsoleMethod,
    (...data: unknown[]) => void
  >;

  for (const method of CONSOLE_METHODS) {
    target[method] = noop;
  }

  silenced = true;
}
