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
  Briefcase,
  Users,
  Swords,
  Heart,
  TrendingUp,
  Map,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store/app";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  { title: "工作台", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: "项目中心", href: "/projects", icon: <FolderKanban className="h-5 w-5" /> },
  { title: "PRD生成器", href: "/prd", icon: <FileText className="h-5 w-5" /> },
  { title: "需求分析器", href: "/analyzer", icon: <BarChart3 className="h-5 w-5" /> },
  { title: "用户故事", href: "/user-stories", icon: <Users className="h-5 w-5" /> },
  { title: "竞品分析", href: "/competitors", icon: <Swords className="h-5 w-5" /> },
  { title: "KANO模型", href: "/kano", icon: <Heart className="h-5 w-5" /> },
  { title: "优先级矩阵", href: "/priority", icon: <TrendingUp className="h-5 w-5" /> },
  { title: "用户旅程", href: "/journey", icon: <Map className="h-5 w-5" /> },
  { title: "ROI计算器", href: "/roi", icon: <Calculator className="h-5 w-5" /> },
  { title: "SQL助手", href: "/sql", icon: <Database className="h-5 w-5" /> },
  { title: "埋点设计器", href: "/tracking", icon: <Target className="h-5 w-5" /> },
  { title: "测试用例", href: "/test-cases", icon: <TestTube className="h-5 w-5" /> },
  { title: "知识库", href: "/knowledge", icon: <BookOpen className="h-5 w-5" /> },
  { title: "Prompt库", href: "/prompts", icon: <Sparkles className="h-5 w-5" /> },
];

const bottomNavItems: NavItem[] = [
  { title: "设置", href: "/settings", icon: <Settings className="h-5 w-5" /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="font-semibold">PMOS Lite</span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="flex w-full justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn("h-8 w-8", sidebarCollapsed && "hidden")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-3.5rem)] py-2">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  sidebarCollapsed && "justify-center px-0"
                )}
              >
                {item.icon}
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t pt-4">
          <nav className="space-y-1 px-2">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    sidebarCollapsed && "justify-center px-0"
                  )}
                >
                  {item.icon}
                  {!sidebarCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </ScrollArea>

      {sidebarCollapsed && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </aside>
  );
}
