"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  BarChart3,
  Database,
  Target,
  TestTube,
  BookOpen,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store/app";

interface NavItem {
  title: string;
  href: string;
  no: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { title: "工作台", no: "01", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { title: "项目中心", no: "02", href: "/projects", icon: <FolderKanban className="h-4 w-4" /> },
  { title: "PRD 生成器", no: "03", href: "/prd", icon: <FileText className="h-4 w-4" /> },
  { title: "需求分析器", no: "04", href: "/analyzer", icon: <BarChart3 className="h-4 w-4" /> },
  { title: "SQL 助手", no: "05", href: "/sql", icon: <Database className="h-4 w-4" /> },
  { title: "埋点设计器", no: "06", href: "/tracking", icon: <Target className="h-4 w-4" /> },
  { title: "测试用例", no: "07", href: "/test-cases", icon: <TestTube className="h-4 w-4" /> },
  { title: "知识库", no: "08", href: "/knowledge", icon: <BookOpen className="h-4 w-4" /> },
  { title: "Prompt 库", no: "09", href: "/prompts", icon: <Sparkles className="h-4 w-4" /> },
];

const bottomNavItems: NavItem[] = [
  { title: "设置", no: "S", href: "/settings", icon: <Settings className="h-4 w-4" /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-ink-charcoal/15 bg-ink-cream/95 backdrop-blur-sm transition-all duration-500",
        sidebarCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* Masthead */}
      <div className="relative border-b border-ink-charcoal/15 px-5 py-5">
        <div className="flex items-start justify-between gap-2">
          {!sidebarCollapsed ? (
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-ink-forest" strokeWidth={1.5} />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-ash">
                  Est. 2026
                </span>
              </div>
              <h1 className="mt-2 font-display text-2xl font-medium leading-none text-ink-charcoal">
                PMOS<span className="text-ink-forest">.</span>Lite
              </h1>
              <p className="mt-2 font-serif text-[11px] italic leading-tight text-ink-ash">
                《产品经理工坊》<br />本地化 · 离线 · 免费
              </p>
            </div>
          ) : (
            <div className="flex w-full justify-center">
              <div className="flex h-10 w-10 items-center justify-center border border-ink-charcoal/30">
                <Compass className="h-4 w-4 text-ink-forest" strokeWidth={1.5} />
              </div>
            </div>
          )}
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-7 w-7 -mr-2 text-ink-ash hover:bg-ink-forest/10 hover:text-ink-forest"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
        {sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-ink-charcoal/15 bg-ink-cream text-ink-ash hover:bg-ink-forest hover:text-ink-cream"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Nav sections */}
      <ScrollArea className="h-[calc(100vh-9rem)]">
        <div className="px-3 py-6">
          {!sidebarCollapsed && (
            <div className="mb-3 flex items-center gap-2 px-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-ash">
                § 目录
              </span>
              <span className="h-px flex-1 bg-ink-charcoal/15" />
            </div>
          )}
          <nav className="space-y-0.5">
            {navItems.map((item, i) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2.5 text-sm transition-all",
                    sidebarCollapsed && "justify-center",
                    isActive
                      ? "bg-ink-forest text-ink-cream"
                      : "text-ink-ash hover:text-ink-charcoal"
                  )}
                >
                  {!sidebarCollapsed && (
                    <span
                      className={cn(
                        "font-mono text-[10px] tracking-widest",
                        isActive ? "text-ink-cream/70" : "text-ink-ash/60"
                      )}
                    >
                      {item.no}
                    </span>
                  )}
                  <span
                    className={cn(
                      "shrink-0 transition-transform group-hover:scale-110",
                      isActive ? "text-ink-cream" : "text-ink-forest"
                    )}
                  >
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="flex-1 font-sans font-medium">
                      {item.title}
                    </span>
                  )}
                  {isActive && !sidebarCollapsed && (
                    <span className="font-mono text-xs text-ink-cream/70">●</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom section */}
        <div className="border-t border-ink-charcoal/15 px-3 py-4">
          {!sidebarCollapsed && (
            <div className="mb-3 flex items-center gap-2 px-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-ash">
                § 系统
              </span>
              <span className="h-px flex-1 bg-ink-charcoal/15" />
            </div>
          )}
          <nav className="space-y-0.5">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 text-sm transition-all",
                    sidebarCollapsed && "justify-center",
                    isActive
                      ? "bg-ink-forest text-ink-cream"
                      : "text-ink-ash hover:text-ink-charcoal"
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0",
                      isActive ? "text-ink-cream" : "text-ink-forest"
                    )}
                  >
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="font-sans font-medium">{item.title}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </ScrollArea>

      {/* Footer mark */}
      {!sidebarCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 border-t border-ink-charcoal/15 px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink-ash">
              No.001
            </span>
            <span className="font-serif text-[10px] italic text-ink-ash">
              Local First
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
