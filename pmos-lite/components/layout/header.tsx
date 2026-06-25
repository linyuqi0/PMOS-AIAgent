"use client";

import * as React from "react";
import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { useAppStore } from "@/store/app";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { toggleSidebar, sidebarCollapsed } = useAppStore();

  return (
    <header className="sticky top-0 z-30 h-14 border-b bg-background/80 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>
          {title && (
            <h1 className="text-lg font-semibold">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索..."
              className="w-64 pl-9"
            />
          </div>

          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          <ThemeToggle />

          <Avatar fallback="PM" className="h-8 w-8" />
        </div>
      </div>
    </header>
  );
}
