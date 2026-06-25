"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useAppStore } from "@/store/app";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  date?: string;
}

export function AppLayout({ children, title, subtitle, date }: AppLayoutProps) {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-ink-paper text-ink-charcoal">
      <Sidebar />
      <div
        className="transition-all duration-500"
        style={{ marginLeft: sidebarCollapsed ? 80 : 288 }}
      >
        <Header title={title} subtitle={subtitle} date={date} />
        <main className="relative">{children}</main>
      </div>
    </div>
  );
}
