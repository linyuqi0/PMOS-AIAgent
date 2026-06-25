"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function AppLayout({ children, title, description, actions }: AppLayoutProps) {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex h-screen flex-col ml-64">
        <Header title={title} description={description} actions={actions} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
