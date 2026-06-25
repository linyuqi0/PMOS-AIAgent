"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  FolderKanban,
  FileText,
  Database,
  Sparkles,
  BookOpen,
  TestTube,
  Target,
  BarChart3,
  Clock,
  Plus,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

interface StatCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  color: string;
}

interface ModuleCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  tags: string[];
}

const modules: ModuleCard[] = [
  {
    title: "PRD 生成器",
    description: "9大模块一键生成标准PRD文档",
    icon: <FileText className="h-5 w-5" />,
    href: "/prd",
    color: "from-blue-500 to-blue-600",
    tags: ["产品文档", "需求文档"],
  },
  {
    title: "需求分析器",
    description: "多维度分析需求风险与可行性",
    icon: <BarChart3 className="h-5 w-5" />,
    href: "/analyzer",
    color: "from-violet-500 to-violet-600",
    tags: ["需求拆解", "风险评估"],
  },
  {
    title: "SQL 助手",
    description: "多方言支持，常用模板一键套用",
    icon: <Database className="h-5 w-5" />,
    href: "/sql",
    color: "from-emerald-500 to-emerald-600",
    tags: ["MySQL", "Hive", "ClickHouse"],
  },
  {
    title: "埋点设计器",
    description: "事件属性管理，自动生成埋点文档",
    icon: <Target className="h-5 w-5" />,
    href: "/tracking",
    color: "from-orange-500 to-orange-600",
    tags: ["数据埋点", "事件设计"],
  },
  {
    title: "测试用例",
    description: "5大用例类型，批量生成测试场景",
    icon: <TestTube className="h-5 w-5" />,
    href: "/test-cases",
    color: "from-rose-500 to-rose-600",
    tags: ["功能测试", "边界测试"],
  },
  {
    title: "知识库",
    description: "多格式文档管理，全文检索",
    icon: <BookOpen className="h-5 w-5" />,
    href: "/knowledge",
    color: "from-indigo-500 to-indigo-600",
    tags: ["文档管理", "知识沉淀"],
  },
  {
    title: "Prompt 库",
    description: "9大分类内置模板，一键复制",
    icon: <Sparkles className="h-5 w-5" />,
    href: "/prompts",
    color: "from-pink-500 to-pink-600",
    tags: ["AI提示词", "模板库"],
  },
  {
    title: "项目中心",
    description: "统筹管理你的所有产品项目",
    icon: <FolderKanban className="h-5 w-5" />,
    href: "/projects",
    color: "from-cyan-500 to-cyan-600",
    tags: ["项目管理", "团队协作"],
  },
];

export default function DashboardPage() {
  const [stats, setStats] = React.useState({
    projects: 0,
    prds: 0,
    testCases: 0,
    sqlTemplates: 0,
  });
  const [recents, setRecents] = React.useState<{ id?: number; title: string; type: string; editedAt: Date }[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const [projects, prds, testCases, sqlQueries, recents] = await Promise.all([
          db.projects.count(),
          db.prds.count(),
          db.testCases.count(),
          db.sqlQueries.count(),
          db.recentEdits.orderBy("editedAt").reverse().limit(5).toArray(),
        ]);
        setStats({
          projects,
          prds,
          testCases,
          sqlTemplates: sqlQueries,
        });
        setRecents(recents);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const statCards: StatCard[] = [
    { label: "项目总数", value: stats.projects, icon: <FolderKanban className="h-5 w-5" />, href: "/projects", color: "bg-blue-50 text-blue-600" },
    { label: "PRD 文档", value: stats.prds, icon: <FileText className="h-5 w-5" />, href: "/prd", color: "bg-violet-50 text-violet-600" },
    { label: "测试用例", value: stats.testCases, icon: <TestTube className="h-5 w-5" />, href: "/test-cases", color: "bg-emerald-50 text-emerald-600" },
    { label: "SQL 模板", value: stats.sqlTemplates, icon: <Database className="h-5 w-5" />, href: "/sql", color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <AppLayout title="工作台总览" description="查看项目进度和快速访问常用工具">
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 text-white shadow-lg">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              全新升级
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              欢迎使用 PMOS Lite
            </h2>
            <p className="mt-2 text-white/80">
              你的本地化 AI 产品经理工作台。PRD 撰写、需求分析、SQL 编写、埋点设计、测试用例——一站式搞定。
            </p>
            <div className="mt-5 flex gap-3">
              <Link href="/projects">
                <Button className="bg-white text-blue-600 hover:bg-white/90">
                  <Plus className="mr-2 h-4 w-4" />
                  新建项目
                </Button>
              </Link>
              <Link href="/prd">
                <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border border-white/20">
                  开始写 PRD
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-10 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">
                    {stat.value}
                  </p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-muted-foreground">
                <span className="group-hover:text-primary group-hover:underline">
                  查看全部
                </span>
                <ArrowRight className="ml-1 h-3 w-3 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>

        {/* Main content: Modules + Recents */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Modules */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">功能模块</h3>
              <span className="text-sm text-muted-foreground">共 8 个工具</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {modules.map((mod) => (
                <Link
                  key={mod.title}
                  href={mod.href}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${mod.color} text-white shadow-sm`}>
                      {mod.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {mod.title}
                      </h4>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {mod.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {mod.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <ArrowRight className="absolute right-4 top-5 h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar: Recents + Quick Actions */}
          <div className="space-y-6">
            {/* Recent edits */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-foreground">最近编辑</h3>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              {recents.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">暂无编辑记录</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">开始你的第一次创作吧</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recents.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Start */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="mb-3 font-semibold text-foreground">快速开始</h3>
              <div className="space-y-2">
                {[
                  { label: "创建第一个项目", href: "/projects", icon: <FolderKanban className="h-4 w-4" /> },
                  { label: "写一份 PRD", href: "/prd", icon: <FileText className="h-4 w-4" /> },
                  { label: "设计埋点方案", href: "/tracking", icon: <Target className="h-4 w-4" /> },
                  { label: "积累 Prompt", href: "/prompts", icon: <Sparkles className="h-4 w-4" /> },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <span className="text-primary">{item.icon}</span>
                    <span>{item.label}</span>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 transition-all group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
