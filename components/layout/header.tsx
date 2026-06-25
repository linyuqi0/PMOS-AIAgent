"use client";

import * as React from "react";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppStore } from "@/store/app";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  date?: string;
}

export function Header({ title, subtitle, date }: HeaderProps) {
  const { toggleSidebar } = useAppStore();

  return (
    <header className="sticky top-0 z-30 border-b border-ink-charcoal/15 bg-ink-cream/85 backdrop-blur-md">
      {/* Top meta strip */}
      <div className="flex items-center justify-between border-b border-ink-charcoal/10 px-8 py-1.5 text-[10px]">
        <div className="flex items-center gap-3 font-mono uppercase tracking-[0.25em] text-ink-ash">
          <span>{date || new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</span>
          <span className="h-1 w-1 rounded-full bg-ink-rust" />
          <span>VOL. 01</span>
        </div>
        <div className="flex items-center gap-2 font-mono uppercase tracking-[0.25em] text-ink-ash">
          <span className="h-1.5 w-1.5 rounded-full bg-ink-forest animate-pulse" />
          <span>本地已连接</span>
        </div>
      </div>

      {/* Main bar */}
      <div className="flex h-16 items-center justify-between gap-6 px-8">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-ink-ash hover:bg-ink-forest/10 hover:text-ink-forest"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="hidden h-8 w-px bg-ink-charcoal/15 sm:block" />
          {title && (
            <div>
              <h1 className="font-display text-2xl font-medium leading-none tracking-tight text-ink-charcoal">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 font-serif text-xs italic text-ink-ash">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-ash" strokeWidth={1.5} />
            <Input
              type="search"
              placeholder="检索工作台…"
              className="h-9 w-72 border-ink-charcoal/15 bg-ink-cream/60 pl-9 font-sans text-sm placeholder:text-ink-ash/60 focus-visible:border-ink-forest focus-visible:ring-0"
            />
            <kbd className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-sm border border-ink-charcoal/15 bg-ink-paper px-1.5 py-0.5 font-mono text-[10px] text-ink-ash lg:inline">
              ⌘K
            </kbd>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
