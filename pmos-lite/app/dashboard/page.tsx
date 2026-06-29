"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FolderKanban,
  FileText,
  BookOpen,
  Sparkles,
  Clock,
  ArrowRight,
  Plus,
  Database,
  Target,
  TestTube,
  BarChart3,
  Users,
  Swords,
  Heart,
  TrendingUp,
  Map,
  Calculator,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db, seedInitialData } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import type { RecentEdit } from "@/types";

const statItems = [
  { label: "项目数", icon: FolderKanban, color: "text-morandi-sage", bg: "bg-morandi-sage/10" },
  { label: "PRD数", icon: FileText, color: "text-morandi-lavender", bg: "bg-morandi-lavender/10" },
  { label: "知识库数", icon: BookOpen, color: "text-morandi-sky", bg: "bg-morandi-sky/10" },
  { label: "Prompt数", icon: Sparkles, color: "text-morandi-rose", bg: "bg-morandi-rose/10" },
];

const quickActions = [
  { label: "新建项目", href: "/projects", icon: FolderKanban, desc: "创建一个新项目" },
  { label: "生成PRD", href: "/prd", icon: FileText, desc: "快速生成PRD文档" },
  { label: "SQL查询", href: "/sql", icon: Database, desc: "SQL编写与格式化" },
  { label: "埋点设计", href: "/tracking", icon: Target, desc: "事件与属性设计" },
  { label: "用例生成", href: "/test-cases", icon: TestTube, desc: "测试用例自动生成" },
  { label: "需求分析", href: "/analyzer", icon: BarChart3, desc: "智能需求拆解" },
];

const typeIcons: Record<RecentEdit["type"], React.ReactNode> = {
  project: <FolderKanban className="h-4 w-4" />,
  prd: <FileText className="h-4 w-4" />,
  requirement: <BarChart3 className="h-4 w-4" />,
  sql: <Database className="h-4 w-4" />,
  tracking: <Target className="h-4 w-4" />,
  testcase: <TestTube className="h-4 w-4" />,
  knowledge: <BookOpen className="h-4 w-4" />,
  prompt: <Sparkles className="h-4 w-4" />,
  userstory: <Users className="h-4 w-4" />,
  competitor: <Swords className="h-4 w-4" />,
  kano: <Heart className="h-4 w-4" />,
  priority: <TrendingUp className="h-4 w-4" />,
  journey: <Map className="h-4 w-4" />,
  roi: <Calculator className="h-4 w-4" />,
};

const typeLabels: Record<RecentEdit["type"], string> = {
  project: "项目",
  prd: "PRD",
  requirement: "需求",
  sql: "SQL",
  tracking: "埋点",
  testcase: "测试用例",
  knowledge: "知识库",
  prompt: "Prompt",
  userstory: "用户故事",
  competitor: "竞品分析",
  kano: "KANO模型",
  priority: "优先级",
  journey: "用户旅程",
  roi: "ROI计算",
};

const typeHrefs: Record<RecentEdit["type"], string> = {
  project: "/projects",
  prd: "/prd",
  requirement: "/analyzer",
  sql: "/sql",
  tracking: "/tracking",
  testcase: "/test-cases",
  knowledge: "/knowledge",
  prompt: "/prompts",
  userstory: "/user-stories",
  competitor: "/competitors",
  kano: "/kano",
  priority: "/priority",
  journey: "/journey",
  roi: "/roi",
};

export default function DashboardPage() {
  const projectCount = useLiveQuery(() => db.projects.count(), [], 0);
  const prdCount = useLiveQuery(() => db.prds.count(), [], 0);
  const knowledgeCount = useLiveQuery(() => db.knowledgeDocs.count(), [], 0);
  const promptCount = useLiveQuery(() => db.prompts.count(), [], 0);

  const recentEdits = useLiveQuery(
    () => db.recentEdits.orderBy("editedAt").reverse().limit(10).toArray(),
    [],
    []
  );

  const counts = [projectCount, prdCount, knowledgeCount, promptCount];

  React.useEffect(() => {
    seedInitialData();
  }, []);

  return (
    <AppLayout title="工作台">
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">欢迎回来 👋</h2>
          <p className="text-muted-foreground">
            今天也要加油哦，让我们一起打造更好的产品
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="mt-2 text-3xl font-bold">{counts[index] ?? 0}</p>
                    </div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.bg}`}>
                      <item.icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">快速入口</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {quickActions.map((action, index) => (
                    <motion.div
                      key={action.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                    >
                      <Link
                        href={action.href}
                        className="block rounded-xl border p-4 transition-all hover:border-primary/30 hover:bg-primary/5"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <action.icon className="h-5 w-5" />
                        </div>
                        <div className="mt-3">
                          <p className="font-medium text-sm">{action.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {action.desc}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  最近编辑
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentEdits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm font-medium">暂无最近编辑</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      开始创建内容后将显示在这里
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentEdits.map((edit) => (
                      <Link
                        key={edit.id}
                        href={typeHrefs[edit.type]}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                          {typeIcons[edit.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{edit.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {typeLabels[edit.type]} · {formatDateTime(edit.editedAt)}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
