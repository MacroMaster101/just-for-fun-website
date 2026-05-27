"use client";

import { useEffect } from "react";
import { silenceConsoleInProduction } from "@/lib/silenceConsole";

export const ConsoleSilencer = () => {
  useEffect(() => {
    silenceConsoleInProduction();
  }, []);

  return null;
};
