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
  ChevronDown,
  ChevronRight,
  Rocket,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavGroup {
  title: string;
  icon: React.ReactNode;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "工作台",
    icon: <Briefcase className="h-4 w-4" />,
    items: [
      { title: "工作台总览", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { title: "项目中心", href: "/projects", icon: <FolderKanban className="h-4 w-4" />, badge: "3" },
    ],
  },
  {
    title: "产品设计",
    icon: <FileText className="h-4 w-4" />,
    items: [
      { title: "PRD 生成器", href: "/prd", icon: <FileText className="h-4 w-4" /> },
      { title: "需求分析器", href: "/analyzer", icon: <BarChart3 className="h-4 w-4" /> },
      { title: "埋点设计器", href: "/tracking", icon: <Target className="h-4 w-4" /> },
    ],
  },
  {
    title: "质量保障",
    icon: <TestTube className="h-4 w-4" />,
    items: [
      { title: "测试用例", href: "/test-cases", icon: <TestTube className="h-4 w-4" /> },
      { title: "SQL 助手", href: "/sql", icon: <Database className="h-4 w-4" /> },
    ],
  },
  {
    title: "知识资产",
    icon: <BookOpen className="h-4 w-4" />,
    items: [
      { title: "知识库", href: "/knowledge", icon: <BookOpen className="h-4 w-4" /> },
      { title: "Prompt 库", href: "/prompts", icon: <Sparkles className="h-4 w-4" />, badge: "NEW" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set(["工作台", "产品设计", "质量保障", "知识资产"])
  );

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  React.useEffect(() => {
    const activeGroup = navGroups.find((g) =>
      g.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
    );
    if (activeGroup && !expandedGroups.has(activeGroup.title)) {
      setExpandedGroups((prev) => new Set(prev).add(activeGroup.title));
    }
  }, [pathname, expandedGroups]);

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
          <Rocket className="h-5 w-5" />
        </div>
        <div>
          <div className="text-base font-semibold tracking-tight text-foreground">
            PMOS Lite
          </div>
          <div className="text-xs text-muted-foreground">
            AI产品经理工作台
          </div>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 scrollbar-thin">
        <nav className="space-y-1 px-3 py-4">
          {navGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.title);
            const hasActiveItem = group.items.some(
              (item) => pathname === item.href || pathname.startsWith(item.href + "/")
            );
            return (
              <div key={group.title} className="mb-2">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    hasActiveItem
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="flex h-4 w-4 items-center justify-center text-muted-foreground">
                    {group.icon}
                  </span>
                  <span className="flex-1 text-left">{group.title}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
                {isExpanded && (
                  <div className="mt-1 space-y-0.5 pl-3">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href || pathname.startsWith(item.href + "/");
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all",
                            isActive
                              ? "bg-sidebar-active text-primary font-medium"
                              : "text-muted-foreground hover:bg-sidebar-hover hover:text-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "shrink-0",
                              isActive ? "text-primary" : "text-muted-foreground"
                            )}
                          >
                            {item.icon}
                          </span>
                          <span className="flex-1 truncate">{item.title}</span>
                          {item.badge && (
                            <span
                              className={cn(
                                "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                                item.badge === "NEW"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-secondary text-secondary-foreground"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer - Settings */}
      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all",
            pathname === "/settings"
              ? "bg-sidebar-active text-primary font-medium"
              : "text-muted-foreground hover:bg-sidebar-hover hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>设置</span>
        </Link>
      </div>
    </aside>
  );
}
