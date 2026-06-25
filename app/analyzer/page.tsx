"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  BarChart3,
  Plus,
  Search,
  Trash2,
  Save,
  Sparkles,
  AlertTriangle,
  Code,
  Clock,
  Bug,
  Rocket,
  ChevronRight,
  ListChecks,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select } from "@/components/ui/select";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { Requirement } from "@/types";

export default function AnalyzerPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedReq, setSelectedReq] = React.useState<Requirement | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<Requirement>>({
    title: "",
    description: "",
    breakdown: "",
    riskAnalysis: "",
    devEstimate: "",
    testEstimate: "",
    launchRisk: "",
  });
  const { toast } = useToast();

  const requirements = useLiveQuery(
    () => db.requirements.orderBy("updatedAt").reverse().toArray(),
    [],
    []
  );

  const filteredReqs = React.useMemo(
    () =>
      requirements.filter(
        (r) =>
          !searchQuery ||
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [requirements, searchQuery]
  );

  const handleCreate = () => {
    setSelectedReq(null);
    setIsEditing(true);
    setFormData({
      title: "",
      description: "",
      breakdown: "",
      riskAnalysis: "",
      devEstimate: "",
      testEstimate: "",
      launchRisk: "",
    });
  };

  const handleSelect = (req: Requirement) => {
    setSelectedReq(req);
    setIsEditing(false);
    setFormData(req);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      toast({ message: "请输入需求标题", type: "error" });
      return;
    }

    const now = new Date();
    if (selectedReq?.id) {
      await db.requirements.update(selectedReq.id, {
        ...formData,
        updatedAt: now,
      });
      await db.addRecentEdit("requirement", selectedReq.id, formData.title!);
      toast({ message: "需求分析已保存", type: "success" });
      const updated = await db.requirements.get(selectedReq.id);
      if (updated) setSelectedReq(updated);
    } else {
      const id = await db.requirements.add({
        title: formData.title!,
        description: formData.description || "",
        breakdown: formData.breakdown,
        riskAnalysis: formData.riskAnalysis,
        devEstimate: formData.devEstimate,
        testEstimate: formData.testEstimate,
        launchRisk: formData.launchRisk,
        createdAt: now,
        updatedAt: now,
      });
      await db.addRecentEdit("requirement", id, formData.title!);
      toast({ message: "需求分析已创建", type: "success" });
      const created = await db.requirements.get(id);
      if (created) setSelectedReq(created);
    }
    setIsEditing(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个需求分析吗？")) return;
    await db.requirements.delete(id);
    if (selectedReq?.id === id) {
      setSelectedReq(null);
      setIsEditing(false);
    }
    toast({ message: "需求分析已删除", type: "success" });
  };

  const handleAnalyze = () => {
    if (!formData.description?.trim()) {
      toast({ message: "请先输入需求描述", type: "error" });
      return;
    }

    const desc = formData.description;
    
    setFormData({
      ...formData,
      breakdown: `## 需求拆解\n\n### 一、功能模块拆解\n\n#### 1. 核心功能模块\n- **模块A**：${desc.slice(0, 30)}相关核心能力\n  - 子功能1：基础能力实现\n  - 子功能2：数据处理逻辑\n  - 子功能3：用户交互界面\n\n#### 2. 支撑功能模块\n- 模块B：辅助功能支持\n  - 配置管理\n  - 数据统计\n  - 权限控制\n\n### 二、开发优先级排序\n\n| 优先级 | 功能点 | 说明 |\n|--------|-------|------|\n| P0 | 核心功能 | 必须实现 |\n| P1 | 重要功能 | 首版上线 |\n| P2 | 优化功能 | 迭代优化 |`,
      riskAnalysis: `## 风险分析\n\n### 技术风险\n- **风险等级**：中\n- 依赖的技术方案的技术选型是否成熟度评估\n- 性能风险与现有系统兼容性\n\n### 业务风险\n- **风险等级**：低\n- 业务逻辑复杂度评估\n- 用户接受度预测\n\n### 进度风险\n- **风险等级**：中\n- 需求变更风险\n- 人员配置风险\n\n### 风险应对措施\n1. 技术预研：提前验证关键技术点\n2. 分阶段交付：降低单次交付范围可控\n3. 备用方案：关键路径上准备B计划`,
      devEstimate: `## 开发评估\n\n### 工作量估算\n\n| 模块 | 前端(人日) | 后端(人日) | 合计 |\n|------|-----------|-----------|------|\n| 核心模块 | 5 | 8 | 13 |\n| 支撑模块 | 3 | 4 | 7 |\n| 联调测试 | 2 | 2 | 4 |\n| **总计** | **10** | **14** | **24** |\n\n### 关键技术栈建议\n- 前端：React + TypeScript\n- 后端：根据现有技术栈\n- 数据库：根据数据方案\n\n### 依赖项\n- 依赖接口：XXX 接口支持\n- 数据来源：数据准备`,
      testEstimate: `## 测试评估\n\n###测试范围\n- 功能测试：核心流程 + 异常场景\n- 性能测试：核心接口压测\n- 兼容测试：主流浏览器/设备\n\n###测试工作量\n| 测试类型 | 人日 |\n|---------|------|\n| 功能测试 | 5 |\n| 回归测试 | 2 |\n| 性能测试 | 1 |\n| **总计** | **8** |\n\n###测试重点\n1. 核心业务流程正确性\n2. 边界条件覆盖\n3. 数据一致性校验`,
      launchRisk: `## 上线风险评估\n\n###风险等级：中\n\n###主要风险点\n1. **数据迁移风险**\n   - 影响范围：存量用户数据\n   - 应对方案：灰度发布 + 数据回滚方案\n\n2. **兼容性风险**\n   - 影响范围：老版本用户\n   - 应对方案：兼容处理 + 降级方案\n\n3. **性能风险**\n   - 影响范围：系统稳定性\n   - 应对方案：流量控制 + 监控告警\n\n###上线建议\n- 推荐灰度发布，按比例逐步放量\n- 密切关注核心指标监控\n- 准备回滚预案`,
    });
    toast({ message: "分析完成", type: "success" });
  };

  const analysisItems = [
    { key: "breakdown", label: "需求拆解", icon: ListChecks, color: "text-morandi-sage" },
    { key: "riskAnalysis", label: "风险分析", icon: AlertTriangle, color: "text-morandi-rose" },
    { key: "devEstimate", label: "开发评估", icon: Code, color: "text-morandi-lavender" },
    { key: "testEstimate", label: "测试评估", icon: Bug, color: "text-morandi-sky" },
    { key: "launchRisk", label: "上线风险", icon: Rocket, color: "text-morandi-clay" },
  ];

  return (
    <AppLayout title="需求分析器" description="§ 04 — Five Lenses on Every Requirement">
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        <div className="w-72 shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索需求..."
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
              {filteredReqs.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  暂无需求分析
                </div>
              ) : (
                filteredReqs.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => handleSelect(req)}
                    className={`cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/50 ${
                      selectedReq?.id === req.id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <BarChart3 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{req.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {req.description || "暂无描述"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {selectedReq || isEditing ? (
            <>
              <div className="flex items-center justify-between mb-4">
                {isEditing ? (
                  <Input
                    value={formData.title || ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="输入需求标题"
                    className="text-lg font-semibold h-10 w-80"
                  />
                ) : (
                  <h2 className="text-xl font-bold">{formData.title}</h2>
                )}
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectedReq?.id && handleDelete(selectedReq.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={handleAnalyze}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        智能分析
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
                <div className="mb-4 space-y-2">
                  <Label>需求描述</Label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="详细描述需求内容，越详细分析结果越准确..."
                    rows={4}
                  />
                </div>
              )}

              <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="breakdown" className="h-full flex flex-col">
                  <TabsList>
                    {analysisItems.map((item) => (
                      <TabsTrigger key={item.key} value={item.key}>
                        <item.icon className={`mr-2 h-4 w-4 ${item.color}`} />
                        {item.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <div className="flex-1 mt-4 overflow-hidden">
                    {analysisItems.map((item) => (
                      <TabsContent key={item.key} value={item.key} className="h-full mt-0">
                        {isEditing ? (
                          <Textarea
                            value={(formData as any)[item.key] || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, [item.key]: e.target.value })
                            }
                            placeholder={`输入${item.label}内容...`}
                            className="h-full font-mono text-sm min-h-[400px]"
                          />
                        ) : (
                          <ScrollArea className="h-[400px]">
                            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-li:text-foreground/80 prose-th:text-foreground prose-td:text-foreground/80">
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: ((formData as any)[item.key] || "暂无内容").replace(/\n/g, "<br/>"),
                                }}
                              />
                            </div>
                          </ScrollArea>
                        )}
                      </TabsContent>
                    ))}
                  </div>
                </Tabs>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">选择或创建需求分析</h3>
              <p className="text-sm text-muted-foreground mt-1">
                输入需求描述，智能生成分析报告
              </p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                新建需求分析
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
