"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { marked } from "marked";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Download,
  Eye,
  Edit3,
  Copy,
  MoreHorizontal,
  Save,
  Sparkles,
  X,
  ChevronRight,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/db";
import { formatDate, downloadFile, copyToClipboard } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { PRD } from "@/types";

const prdSections = [
  { key: "background", label: "背景" },
  { key: "goals", label: "目标" },
  { key: "userStories", label: "用户故事" },
  { key: "businessFlow", label: "业务流程" },
  { key: "featureDesign", label: "功能设计" },
  { key: "exceptionFlow", label: "异常流程" },
  { key: "tracking", label: "埋点设计" },
  { key: "acceptance", label: "验收标准" },
  { key: "testSuggestions", label: "测试建议" },
];

export default function PRDPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPrd, setSelectedPrd] = React.useState<PRD | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("edit");
  const [formData, setFormData] = React.useState<Partial<PRD>>({
    title: "",
    description: "",
    background: "",
    goals: "",
    userStories: "",
    businessFlow: "",
    featureDesign: "",
    exceptionFlow: "",
    tracking: "",
    acceptance: "",
    testSuggestions: "",
  });
  const { toast } = useToast();

  const prds = useLiveQuery(
    () => db.prds.orderBy("updatedAt").reverse().toArray(),
    [],
    []
  );

  const filteredPrds = React.useMemo(
    () =>
      prds.filter(
        (p) =>
          !searchQuery ||
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [prds, searchQuery]
  );

  const handleCreate = () => {
    setSelectedPrd(null);
    setIsEditing(true);
    setActiveTab("edit");
    setFormData({
      title: "",
      description: "",
      background: "",
      goals: "",
      userStories: "",
      businessFlow: "",
      featureDesign: "",
      exceptionFlow: "",
      tracking: "",
      acceptance: "",
      testSuggestions: "",
    });
  };

  const handleSelect = (prd: PRD) => {
    setSelectedPrd(prd);
    setIsEditing(false);
    setActiveTab("preview");
    setFormData(prd);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setActiveTab("edit");
  };

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      toast({ message: "请输入PRD标题", type: "error" });
      return;
    }

    const now = new Date();
    if (selectedPrd?.id) {
      await db.prds.update(selectedPrd.id, {
        ...formData,
        updatedAt: now,
      });
      await db.addRecentEdit("prd", selectedPrd.id, formData.title!);
      toast({ message: "PRD已保存", type: "success" });
    } else {
      const id = await db.prds.add({
        title: formData.title!,
        description: formData.description || "",
        background: formData.background,
        goals: formData.goals,
        userStories: formData.userStories,
        businessFlow: formData.businessFlow,
        featureDesign: formData.featureDesign,
        exceptionFlow: formData.exceptionFlow,
        tracking: formData.tracking,
        acceptance: formData.acceptance,
        testSuggestions: formData.testSuggestions,
        content: formData.content || "",
        createdAt: now,
        updatedAt: now,
      });
      await db.addRecentEdit("prd", id, formData.title!);
      toast({ message: "PRD已创建", type: "success" });
      const created = await db.prds.get(id);
      if (created) setSelectedPrd(created);
    }
    setIsEditing(false);
    setActiveTab("preview");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个PRD吗？")) return;
    await db.prds.delete(id);
    if (selectedPrd?.id === id) {
      setSelectedPrd(null);
      setIsEditing(false);
    }
    toast({ message: "PRD已删除", type: "success" });
  };

  const generateMarkdown = (): string => {
    let md = `# ${formData.title || "未命名PRD"}\n\n`;
    if (formData.description) {
      md += `> ${formData.description}\n\n`;
    }

    const sectionLabels: Record<string, string> = {
      background: "一、背景",
      goals: "二、目标",
      userStories: "三、用户故事",
      businessFlow: "四、业务流程",
      featureDesign: "五、功能设计",
      exceptionFlow: "六、异常流程",
      tracking: "七、埋点设计",
      acceptance: "八、验收标准",
      testSuggestions: "九、测试建议",
    };

    for (const section of prdSections) {
      const content = formData[section.key as keyof PRD] as string | undefined;
      if (content) {
        md += `## ${sectionLabels[section.key]}\n\n${content}\n\n`;
      }
    }

    return md;
  };

  const handleExportMarkdown = () => {
    const md = generateMarkdown();
    downloadFile(md, `${formData.title || "prd"}.md`, "text/markdown");
    toast({ message: "Markdown已导出", type: "success" });
  };

  const handleExportHtml = () => {
    const md = generateMarkdown();
    const html = marked.parse(md) as string;
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formData.title || "PRD"}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; color: #333; }
    h1 { border-bottom: 2px solid #A8B5A0; padding-bottom: 10px; }
    h2 { margin-top: 30px; color: #4a5568; }
    blockquote { border-left: 4px solid #A8B5A0; margin: 0; padding-left: 16px; color: #718096; }
    code { background: #f7fafc; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #f7fafc; padding: 16px; border-radius: 8px; overflow-x: auto; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
    downloadFile(fullHtml, `${formData.title || "prd"}.html`, "text/html");
    toast({ message: "HTML已导出", type: "success" });
  };

  const handleCopy = async () => {
    const md = generateMarkdown();
    await copyToClipboard(md);
    toast({ message: "已复制到剪贴板", type: "success" });
  };

  const handleGenerateTemplate = () => {
    setFormData({
      ...formData,
      background: `## 背景\n\n### 1.1 项目背景\n\n请描述项目发起的背景原因，包括市场环境、业务痛点等。\n\n### 1.2 现状分析\n\n分析当前业务或产品的现状，存在的问题和机会点。`,
      goals: `## 目标\n\n### 2.1 业务目标\n\n- 目标1：量化描述\n- 目标2：量化描述\n\n### 2.2 产品目标\n\n- 目标1：具体描述\n- 目标2：具体描述`,
      userStories: `## 用户故事\n\n| ID | 用户角色 | 用户故事 | 优先级 |\n|----|---------|---------|--------|\n| US-001 | 普通用户 | 作为一个[角色]，我想要[功能]，以便于[价值] | P0 |`,
      businessFlow: `## 业务流程\n\n### 主流程\n1. 步骤一\n2. 步骤二\n3. 步骤三\n\n### 分支流程\n- 分支A：描述\n- 分支B：描述`,
      featureDesign: `## 功能设计\n\n### 功能模块1\n- 功能点1：详细描述\n- 功能点2：详细描述\n\n### 功能模块2\n- 功能点1：详细描述`,
      exceptionFlow: `## 异常流程\n\n| 异常场景 | 触发条件 | 处理方式 |\n|---------|---------|---------|\n| 网络异常 | 用户断网 | 提示用户检查网络，数据本地缓存 |`,
      tracking: `## 埋点设计\n\n### 核心事件\n| 事件名 | 触发时机 | 属性 |\n|-------|---------|------|\n| page_view | 页面曝光 | page_name, source |`,
      acceptance: `## 验收标准\n\n### 功能验收\n- [ ] 功能点1正常工作\n- [ ] 功能点2正常工作\n\n### 性能验收\n- 页面加载时间 < 2s\n- 接口响应时间 < 500ms`,
      testSuggestions: `## 测试建议\n\n### 测试重点\n1. 核心流程测试\n2. 边界条件测试\n3. 异常场景测试\n\n### 兼容性测试\n- 浏览器：Chrome、Safari、Firefox\n- 设备：iOS、Android`,
    });
    toast({ message: "模板已生成", type: "success" });
  };

  const previewHtml = React.useMemo(() => {
    const md = generateMarkdown();
    return marked.parse(md) as string;
  }, [formData]);

  return (
    <AppLayout title="PRD 生成器" description="9大模块一键生成标准PRD文档">
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        <div className="w-72 shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索PRD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleCreate} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-2">
              {filteredPrds.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  暂无PRD文档
                </div>
              ) : (
                filteredPrds.map((prd) => (
                  <div
                    key={prd.id}
                    onClick={() => handleSelect(prd)}
                    className={`cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/50 ${
                      selectedPrd?.id === prd.id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 min-w-0">
                        <FileText className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{prd.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(prd.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {selectedPrd || isEditing ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <Input
                      value={formData.title || ""}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="输入PRD标题"
                      className="text-lg font-semibold h-10 w-80"
                    />
                  ) : (
                    <h2 className="text-xl font-bold">{formData.title}</h2>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        编辑
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={handleCopy}>
                            <Copy className="mr-2 h-4 w-4" />
                            复制Markdown
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleExportMarkdown}>
                            <Download className="mr-2 h-4 w-4" />
                            导出Markdown
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleExportHtml}>
                            <Download className="mr-2 h-4 w-4" />
                            导出HTML
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => selectedPrd?.id && handleDelete(selectedPrd.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={handleGenerateTemplate}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        生成模板
                      </Button>
                      <Button size="sm" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        保存
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mb-4">
                  <Label>需求描述</Label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="简要描述需求内容..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList>
                  <TabsTrigger value="edit" disabled={!isEditing}>编辑</TabsTrigger>
                  <TabsTrigger value="preview">预览</TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="flex-1 mt-4 overflow-hidden">
                  <ScrollArea className="h-full pr-4 -mr-4">
                    <div className="space-y-6 pb-8">
                      {prdSections.map((section) => (
                        <div key={section.key}>
                          <Label className="text-sm font-medium">{section.label}</Label>
                          <Textarea
                            value={(formData as any)[section.key] || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, [section.key]: e.target.value })
                            }
                            placeholder={`输入${section.label}内容...`}
                            className="mt-2 font-mono text-sm"
                            rows={6}
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="preview" className="flex-1 mt-4 overflow-hidden">
                  <ScrollArea className="h-full pr-4 -mr-4">
                    <div
                      className="prose prose-sm max-w-none pb-8 dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/80 prose-a:text-primary prose-strong:text-foreground prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:text-foreground prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-li:text-foreground/80 prose-th:text-foreground prose-td:text-foreground/80"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">选择或创建PRD</h3>
              <p className="text-sm text-muted-foreground mt-1">
                从左侧选择，或创建一个新的PRD文档
              </p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                新建PRD
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
