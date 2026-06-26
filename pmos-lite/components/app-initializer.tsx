"use client";

import * as React from "react";
import { seedInitialData } from "@/lib/db";

export function AppInitializer() {
  React.useEffect(() => {
    seedInitialData().catch(console.error);
  }, []);

  return null;
}
