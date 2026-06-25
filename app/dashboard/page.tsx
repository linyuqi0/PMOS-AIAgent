"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  FolderKanban,
  FileText,
  Database,
  Sparkles,
  BookOpen,
  TestTube,
  Target,
  BarChart3,
  Quote,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { db } from "@/lib/db";
import type {
  Project,
  PRD,
  KnowledgeDoc,
  Prompt,
  RecentEdit,
} from "@/types";

interface StatItem {
  no: string;
  label: string;
  value: number;
  href: string;
  hint: string;
  icon: React.ReactNode;
}

const navLinks = [
  { no: "01", title: "项目中心", desc: "统筹你的产品矩阵", href: "/projects", icon: <FolderKanban className="h-4 w-4" /> },
  { no: "02", title: "PRD 生成器", desc: "9 大模块 · 一键成稿", href: "/prd", icon: <FileText className="h-4 w-4" /> },
  { no: "03", title: "SQL 助手", desc: "自然语言转查询", href: "/sql", icon: <Database className="h-4 w-4" /> },
  { no: "04", title: "埋点设计器", desc: "事件 + 属性 + 字典", href: "/tracking", icon: <Target className="h-4 w-4" /> },
  { no: "05", title: "测试用例", desc: "5 大类型批量生成", href: "/test-cases", icon: <TestTube className="h-4 w-4" /> },
  { no: "06", title: "知识库", desc: "TXT / MD / PDF / DOCX", href: "/knowledge", icon: <BookOpen className="h-4 w-4" /> },
  { no: "07", title: "Prompt 库", desc: "9 大内置模板", href: "/prompts", icon: <Sparkles className="h-4 w-4" /> },
  { no: "08", title: "需求分析器", desc: "拆解 + 风险 + 评估", href: "/analyzer", icon: <BarChart3 className="h-4 w-4" /> },
];

export default function DashboardPage() {
  const [stats, setStats] = React.useState({
    projects: 0,
    prds: 0,
    knowledge: 0,
    prompts: 0,
  });
  const [recents, setRecents] = React.useState<RecentEdit[]>([]);
  const [activeProjects, setActiveProjects] = React.useState<Project[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const [projects, prds, knowledge, prompts, recents] = await Promise.all([
          db.projects.toArray(),
          db.prds.toArray(),
          db.knowledgeDocs.toArray(),
          db.prompts.toArray(),
          db.recentEdits.orderBy("editedAt").reverse().limit(5).toArray(),
        ]);
        setStats({
          projects: projects.filter((p) => p.status !== "archived").length,
          prds: prds.length,
          knowledge: knowledge.length,
          prompts: prompts.length,
        });
        setRecents(recents.slice(0, 5));
        setActiveProjects(projects.filter((p) => p.status !== "archived").slice(0, 3));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const statItems: StatItem[] = [
    {
      no: "i",
      label: "进行中项目",
      value: stats.projects,
      href: "/projects",
      hint: "在 §02 项目中心管理",
      icon: <FolderKanban className="h-3.5 w-3.5" />,
    },
    {
      no: "ii",
      label: "PRD 文档",
      value: stats.prds,
      href: "/prd",
      hint: "在 §03 PRD 生成器中",
      icon: <FileText className="h-3.5 w-3.5" />,
    },
    {
      no: "iii",
      label: "知识档案",
      value: stats.knowledge,
      href: "/knowledge",
      hint: "在 §08 知识库中",
      icon: <BookOpen className="h-3.5 w-3.5" />,
    },
    {
      no: "iv",
      label: "Prompt 模板",
      value: stats.prompts,
      href: "/prompts",
      hint: "在 §09 Prompt 库中",
      icon: <Sparkles className="h-3.5 w-3.5" />,
    },
  ];

  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <AppLayout title="工作台" subtitle="The Workbench — 你的每日编辑室" date={today}>
      <div className="mx-auto max-w-[1400px] px-8 py-10">
        {/* Masthead / Cover */}
        <section className="relative grid grid-cols-12 gap-6 border-b-2 border-ink-charcoal pb-12">
          {/* Drop cap column */}
          <div className="col-span-12 lg:col-span-8">
            <div className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-ash">
              <span>Vol. 01</span>
              <span className="h-px w-12 bg-ink-charcoal" />
              <span>Issue No.001</span>
              <span className="h-px w-12 bg-ink-charcoal" />
              <span className="text-ink-rust">本期主打</span>
            </div>

            <h2 className="font-display text-[clamp(3rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-tight text-ink-charcoal">
              欢迎回来<br />
              <span className="italic text-ink-forest">Welcome</span>
              <span className="text-ink-rust">.</span>
            </h2>

            <p className="mt-6 max-w-xl font-serif text-lg italic leading-relaxed text-ink-ash">
              「一个属于产品经理的本地化工作台 —— 不上传、不联网、不打扰。打开浏览器，便是一间安静的编辑室。」
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/projects"
                className="group inline-flex items-center gap-2 border border-ink-charcoal bg-ink-charcoal px-5 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-ink-cream transition-all hover:bg-ink-forest hover:border-ink-forest"
              >
                <FolderKanban className="h-3.5 w-3.5" />
                开始一个新项目
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/prd"
                className="group inline-flex items-center gap-2 border border-ink-charcoal/40 bg-transparent px-5 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-ink-charcoal transition-all hover:border-ink-forest hover:bg-ink-cream"
              >
                <FileText className="h-3.5 w-3.5" />
                撰写 PRD
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>

          {/* Quote / Day card */}
          <div className="col-span-12 lg:col-span-4">
            <div className="relative h-full border border-ink-charcoal/20 bg-ink-cream/60 p-6">
              <Quote
                className="absolute -top-3 left-4 h-6 w-6 rotate-180 bg-ink-paper p-1 text-ink-forest"
                strokeWidth={1.5}
              />
              <p className="mt-3 font-serif text-base leading-relaxed text-ink-charcoal">
                <span className="font-display text-2xl italic text-ink-rust">「</span>
                把注意力放回到 <em>产品</em> 本身。让工具退后，让思考向前。
                <span className="font-display text-2xl italic text-ink-rust">」</span>
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-ink-charcoal/15 pt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-ash">
                <span>— 本期寄语</span>
                <Calendar className="h-3 w-3" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats row — Editorial numbering */}
        <section className="grid grid-cols-2 gap-0 border-b border-ink-charcoal/15 lg:grid-cols-4">
          {statItems.map((s, i) => (
            <Link
              key={s.label}
              href={s.href}
              className="group relative border-b border-ink-charcoal/15 p-6 transition-colors hover:bg-ink-cream/60 lg:border-b-0 lg:border-r lg:last:border-r-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-ash">
                  № {s.no}
                </span>
                <span className="text-ink-forest opacity-60 transition-opacity group-hover:opacity-100">
                  {s.icon}
                </span>
              </div>
              <div className="mt-3 font-display text-5xl font-medium tabular-nums leading-none text-ink-charcoal">
                {String(s.value).padStart(2, "0")}
              </div>
              <div className="mt-2 font-sans text-sm font-medium text-ink-charcoal">
                {s.label}
              </div>
              <div className="mt-1 font-serif text-[11px] italic text-ink-ash">
                {s.hint}
              </div>
              <ArrowUpRight className="absolute right-4 top-4 h-3.5 w-3.5 -translate-x-1 translate-y-1 text-ink-charcoal opacity-0 transition-all group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
            </Link>
          ))}
        </section>

        {/* Two-column main: TOC + recents */}
        <section className="mt-12 grid grid-cols-12 gap-10">
          {/* Table of Contents */}
          <div className="col-span-12 lg:col-span-7">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-ash">
                  Contents
                </div>
                <h3 className="mt-1 font-display text-3xl font-medium text-ink-charcoal">
                  本期目录
                </h3>
              </div>
              <span className="font-serif text-sm italic text-ink-ash">
                八大功能，一次收录
              </span>
            </div>

            <div className="border-t-2 border-ink-charcoal">
              {navLinks.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-4 border-b border-ink-charcoal/15 py-4 transition-colors hover:bg-ink-cream/40"
                >
                  <span className="font-mono text-xs tabular-nums text-ink-ash group-hover:text-ink-rust">
                    §{item.no}
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-ink-charcoal/30 text-ink-forest transition-colors group-hover:border-ink-forest group-hover:bg-ink-forest group-hover:text-ink-cream">
                    {item.icon}
                  </span>
                  <div className="flex-1">
                    <div className="font-display text-lg font-medium text-ink-charcoal">
                      {item.title}
                    </div>
                    <div className="font-serif text-sm italic text-ink-ash">
                      {item.desc}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-ink-ash transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink-forest" />
                </Link>
              ))}
            </div>
          </div>

          {/* Right column: Recents + Active */}
          <div className="col-span-12 space-y-10 lg:col-span-5">
            {/* Recents */}
            <div>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-ash">
                    Recent
                  </div>
                  <h3 className="mt-1 font-display text-2xl font-medium text-ink-charcoal">
                    最近编辑
                  </h3>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-ash">
                  Last 5
                </span>
              </div>
              <div className="border-t-2 border-ink-charcoal">
                {recents.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="font-serif text-sm italic text-ink-ash">
                      尚无编辑记录。开始你的第一次创作。
                    </p>
                  </div>
                ) : (
                  recents.map((r, i) => (
                    <div
                      key={r.id}
                      className="flex items-start gap-3 border-b border-ink-charcoal/15 py-3"
                    >
                      <span className="font-mono text-[10px] tabular-nums text-ink-ash">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <div className="font-sans text-sm font-medium text-ink-charcoal line-clamp-1">
                          {r.title}
                        </div>
                        <div className="font-serif text-[11px] italic text-ink-ash">
                          {r.type} · {new Date(r.editedAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active Projects */}
            <div>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-ash">
                    In Progress
                  </div>
                  <h3 className="mt-1 font-display text-2xl font-medium text-ink-charcoal">
                    进行中项目
                  </h3>
                </div>
                <Link
                  href="/projects"
                  className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-forest hover:underline"
                >
                  全部 →
                </Link>
              </div>
              <div className="border-t-2 border-ink-charcoal">
                {activeProjects.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="font-serif text-sm italic text-ink-ash">
                      还没有进行中的项目。
                    </p>
                    <Link
                      href="/projects"
                      className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.25em] text-ink-forest hover:underline"
                    >
                      + 新建项目
                    </Link>
                  </div>
                ) : (
                  activeProjects.map((p, i) => (
                    <div
                      key={p.id}
                      className="flex items-start gap-3 border-b border-ink-charcoal/15 py-3"
                    >
                      <span className="font-mono text-[10px] tabular-nums text-ink-ash">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <div className="font-sans text-sm font-medium text-ink-charcoal">
                          {p.name}
                        </div>
                        {p.description && (
                          <div className="font-serif text-[11px] italic text-ink-ash line-clamp-1">
                            {p.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer ribbon */}
        <section className="mt-16 border-t-2 border-ink-charcoal pt-6">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-ash">
                Local
              </div>
              <div className="mt-1 font-display text-lg font-medium text-ink-charcoal">
                数据留本地
              </div>
              <p className="mt-1 font-serif text-xs italic text-ink-ash">
                写入浏览器 IndexedDB，从不上传
              </p>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-ash">
                Offline
              </div>
              <div className="mt-1 font-display text-lg font-medium text-ink-charcoal">
                完全离线
              </div>
              <p className="mt-1 font-serif text-xs italic text-ink-ash">
                PWA · 安装即用 · 无需登录
              </p>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-ash">
                Free
              </div>
              <div className="mt-1 font-display text-lg font-medium text-ink-charcoal">
                永久免费
              </div>
              <p className="mt-1 font-serif text-xs italic text-ink-ash">
                开源 · 部署在 GitHub Pages
              </p>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-ash">
                Open
              </div>
              <div className="mt-1 font-display text-lg font-medium text-ink-charcoal">
                公开访问
              </div>
              <p className="mt-1 font-serif text-xs italic text-ink-ash">
                任何人都可直接打开使用
              </p>
            </div>
          </div>
        </section>

        {/* Imprint */}
        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-ink-charcoal/15 py-4 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-ash">
          <span>© 2026 PMOS Lite — An Independent Periodical</span>
          <span className="flex items-center gap-2">
            <span>Set in</span>
            <span className="italic normal-case text-ink-forest">Fraunces</span>
            <span>&</span>
            <span className="italic normal-case text-ink-forest">IBM Plex Sans</span>
          </span>
        </footer>
      </div>
    </AppLayout>
  );
}
