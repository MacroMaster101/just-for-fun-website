import { silenceConsoleInProduction } from "@/lib/silenceConsole";

export function register() {
  silenceConsoleInProduction();
}
