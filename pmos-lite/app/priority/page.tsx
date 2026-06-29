"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  Target,
  Gauge,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
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
import type { PriorityItem } from "@/types";

const moscowMap: Record<PriorityItem["moscowCategory"], { label: string; color: string }> = {
  must: { label: "必须做", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  should: { label: "应该做", color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  could: { label: "可以做", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  wont: { label: "暂不做", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const moscowDescriptions: Record<PriorityItem["moscowCategory"], string> = {
  must: "必须做的需求，是产品成功的关键，没有它产品就无法发布或失去核心价值。",
  should: "应该做的需求，对产品很重要但不是必须的，可以在主要功能完成后添加。",
  could: "可以做的需求，有了更好，没有也不影响核心功能，时间充裕时可以考虑。",
  wont: "暂不做的需求，本次迭代不考虑，可能在未来版本中评估。",
};

const quadrants = [
  { id: "q1", name: "高价值低复杂度", position: "top-left", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", borderColor: "border-emerald-200 dark:border-emerald-800" },
  { id: "q2", name: "高价值高复杂度", position: "top-right", bgColor: "bg-amber-50 dark:bg-amber-950/30", borderColor: "border-amber-200 dark:border-amber-800" },
  { id: "q3", name: "低价值低复杂度", position: "bottom-left", bgColor: "bg-sky-50 dark:bg-sky-950/30", borderColor: "border-sky-200 dark:border-sky-800" },
  { id: "q4", name: "低价值高复杂度", position: "bottom-right", bgColor: "bg-rose-50 dark:bg-rose-950/30", borderColor: "border-rose-200 dark:border-rose-800" },
];

export default function PriorityPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedItem, setSelectedItem] = React.useState<PriorityItem | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>("rice");
  const [formData, setFormData] = React.useState<Partial<PriorityItem>>({
    name: "",
    description: "",
    reach: 1000,
    impact: 3,
    confidence: 0.8,
    effort: 10,
    riceScore: 0,
    moscowCategory: "should",
    value: 5,
    complexity: 5,
    tags: [],
  });
  const { toast } = useToast();

  const priorityItems = useLiveQuery(
    () => db.priorityItems.orderBy("updatedAt").reverse().toArray(),
    [],
    []
  );

  const filteredItems = React.useMemo(
    () =>
      priorityItems.filter(
        (item) =>
          !searchQuery ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    [priorityItems, searchQuery]
  );

  const riceScore = React.useMemo(() => {
    const reach = formData.reach || 0;
    const impact = formData.impact || 0;
    const confidence = formData.confidence || 0;
    const effort = formData.effort || 1;
    return Math.round((reach * impact * confidence) / effort);
  }, [formData.reach, formData.impact, formData.confidence, formData.effort]);

  const handleCreate = () => {
    setSelectedItem(null);
    setIsEditing(true);
    setActiveTab("rice");
    setFormData({
      name: "",
      description: "",
      reach: 1000,
      impact: 3,
      confidence: 0.8,
      effort: 10,
      riceScore: 0,
      moscowCategory: "should",
      value: 5,
      complexity: 5,
      tags: [],
    });
  };

  const handleSelect = (item: PriorityItem) => {
    setSelectedItem(item);
    setIsEditing(false);
    setActiveTab("rice");
    setFormData(item);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (selectedItem) {
      setFormData(selectedItem);
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast({ message: "请输入功能名称", type: "error" });
      return;
    }

    const now = new Date();
    const finalRiceScore = riceScore;

    if (selectedItem?.id) {
      await db.priorityItems.update(selectedItem.id, {
        ...formData,
        riceScore: finalRiceScore,
        updatedAt: now,
      });
      await db.addRecentEdit("priority", selectedItem.id, formData.name!);
      toast({ message: "优先级已保存", type: "success" });
      const updated = await db.priorityItems.get(selectedItem.id);
      if (updated) setSelectedItem(updated);
    } else {
      const id = await db.priorityItems.add({
        name: formData.name!,
        description: formData.description || "",
        reach: formData.reach || 0,
        impact: formData.impact || 0,
        confidence: formData.confidence || 0,
        effort: formData.effort || 1,
        riceScore: finalRiceScore,
        moscowCategory: formData.moscowCategory || "should",
        value: formData.value || 5,
        complexity: formData.complexity || 5,
        tags: formData.tags || [],
        createdAt: now,
        updatedAt: now,
      });
      await db.addRecentEdit("priority", id, formData.name!);
      toast({ message: "优先级已创建", type: "success" });
      const created = await db.priorityItems.get(id);
      if (created) setSelectedItem(created);
    }
    setIsEditing(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个功能项吗？")) return;
    await db.priorityItems.delete(id);
    if (selectedItem?.id === id) {
      setSelectedItem(null);
      setIsEditing(false);
    }
    toast({ message: "功能项已删除", type: "success" });
  };

  return (
    <AppLayout title="优先级矩阵">
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        <div className="w-80 shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索功能项..."
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
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  暂无功能项
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/50 ${
                      selectedItem?.id === item.id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${moscowMap[item.moscowCategory].color}`}
                      >
                        {moscowMap[item.moscowCategory].label}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Gauge className="h-3 w-3" />
                        <span>{item.riceScore}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {selectedItem || isEditing ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <Input
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="输入功能名称"
                      className="text-lg font-semibold h-10 w-72"
                    />
                  ) : (
                    <h2 className="text-xl font-bold">{formData.name}</h2>
                  )}
                  <Badge
                    variant="secondary"
                    className={moscowMap[formData.moscowCategory as PriorityItem["moscowCategory"]]?.color}
                  >
                    {moscowMap[formData.moscowCategory as PriorityItem["moscowCategory"]]?.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectedItem?.id && handleDelete(selectedItem.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={handleCancel}>
                        <X className="mr-2 h-4 w-4" />
                        取消
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
                  <Label>功能描述</Label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="描述这个功能的具体内容..."
                    rows={2}
                    className="mt-1.5 resize-none"
                  />
                </div>
              )}

              {!isEditing && (
                <div className="mb-4 text-sm text-muted-foreground">
                  {formData.description}
                </div>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList>
                  <TabsTrigger value="rice">RICE评分</TabsTrigger>
                  <TabsTrigger value="moscow">MoSCoW</TabsTrigger>
                  <TabsTrigger value="matrix">价值复杂度矩阵</TabsTrigger>
                </TabsList>

                <TabsContent value="rice" className="flex-1 mt-4 overflow-hidden">
                  <ScrollArea className="h-full pr-2">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            RICE 评分模型
                          </CardTitle>
                          <CardDescription>
                            通过 Reach、Impact、Confidence、Effort 四个维度计算功能优先级
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                          <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Label htmlFor="reach">Reach - 覆盖人数</Label>
                              <Input
                                id="reach"
                                type="number"
                                value={formData.reach || 0}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    reach: Number(e.target.value),
                                  })
                                }
                                readOnly={!isEditing}
                                min={0}
                              />
                              <p className="text-xs text-muted-foreground">
                                每个周期内影响的用户数量
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="impact">Impact - 影响程度</Label>
                              <Select
                                id="impact"
                                value={String(formData.impact || 3)}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    impact: Number(e.target.value),
                                  })
                                }
                                disabled={!isEditing}
                              >
                                <option value={1}>1 - 极低影响</option>
                                <option value={2}>2 - 低影响</option>
                                <option value={3}>3 - 中等影响</option>
                                <option value={4}>4 - 高影响</option>
                                <option value={5}>5 - 极高影响</option>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                对用户体验或业务目标的影响程度
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confidence">Confidence - 置信度</Label>
                              <Input
                                id="confidence"
                                type="number"
                                step={0.05}
                                min={0}
                                max={1}
                                value={formData.confidence || 0}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    confidence: Number(e.target.value),
                                  })
                                }
                                readOnly={!isEditing}
                              />
                              <p className="text-xs text-muted-foreground">
                                当前评估的置信程度 (0 - 1)
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="effort">Effort - 投入人天</Label>
                              <Input
                                id="effort"
                                type="number"
                                min={0.5}
                                step={0.5}
                                value={formData.effort || 0}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    effort: Number(e.target.value),
                                  })
                                }
                                readOnly={!isEditing}
                              />
                              <p className="text-xs text-muted-foreground">
                                实现该功能需要的人天数
                              </p>
                            </div>
                          </div>

                          <div className="pt-4 border-t">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-base">RICE Score</Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                  公式: (Reach × Impact × Confidence) / Effort
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-4xl font-bold text-primary">
                                  {riceScore.toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  分/人天
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="moscow" className="flex-1 mt-4 overflow-hidden">
                  <ScrollArea className="h-full pr-2">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            MoSCoW 分类法
                          </CardTitle>
                          <CardDescription>
                            将需求按优先级分为必须做、应该做、可以做、暂不做四类
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="moscow">优先级分类</Label>
                            <Select
                              id="moscow"
                              value={formData.moscowCategory || "should"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  moscowCategory: e.target.value as PriorityItem["moscowCategory"],
                                })
                              }
                              disabled={!isEditing}
                            >
                              <option value="must">Must - 必须做</option>
                              <option value="should">Should - 应该做</option>
                              <option value="could">Could - 可以做</option>
                              <option value="wont">Won&apos;t - 暂不做</option>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {(
                              Object.entries(moscowMap) as [
                                PriorityItem["moscowCategory"],
                                { label: string; color: string }
                              ][]
                            ).map(([key, val]) => (
                              <div
                                key={key}
                                className={`p-3 rounded-lg border ${
                                  formData.moscowCategory === key
                                    ? "border-primary bg-primary/5"
                                    : "border-muted"
                                }`}
                              >
                                <Badge variant="secondary" className={val.color}>
                                  {val.label}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {moscowDescriptions[key]}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="matrix" className="flex-1 mt-4 overflow-hidden">
                  <ScrollArea className="h-full pr-2">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Gauge className="h-5 w-5 text-primary" />
                            价值复杂度矩阵
                          </CardTitle>
                          <CardDescription>
                            从业务价值和实现复杂度两个维度评估功能优先级
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                          <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Label htmlFor="value">Value - 业务价值</Label>
                              <Input
                                id="value"
                                type="number"
                                min={1}
                                max={10}
                                value={formData.value || 5}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    value: Math.min(10, Math.max(1, Number(e.target.value))),
                                  })
                                }
                                readOnly={!isEditing}
                              />
                              <p className="text-xs text-muted-foreground">
                                1-10 分，分数越高价值越大
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="complexity">Complexity - 复杂度</Label>
                              <Input
                                id="complexity"
                                type="number"
                                min={1}
                                max={10}
                                value={formData.complexity || 5}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    complexity: Math.min(10, Math.max(1, Number(e.target.value))),
                                  })
                                }
                                readOnly={!isEditing}
                              />
                              <p className="text-xs text-muted-foreground">
                                1-10 分，分数越高越复杂
                              </p>
                            </div>
                          </div>

                          <div className="pt-4 border-t">
                            <div className="relative w-full aspect-square max-w-md mx-auto">
                              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1">
                                {quadrants.map((q) => (
                                  <div
                                    key={q.id}
                                    className={`rounded-lg border ${q.bgColor} ${q.borderColor} p-3 relative`}
                                  >
                                    <p className="text-xs font-medium text-muted-foreground">
                                      {q.name}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-2 pointer-events-none">
                                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                                <ArrowDownRight className="h-4 w-4 text-amber-600" />
                              </div>
                              <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex flex-col justify-between py-2 pointer-events-none">
                                <ArrowUpRight className="h-4 w-4 text-sky-600" />
                                <ArrowDownRight className="h-4 w-4 text-rose-600" />
                              </div>

                              <div
                                className="absolute w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10"
                                style={{
                                  left: `${((formData.value || 5) - 1) / 9 * 100}%`,
                                  top: `${100 - ((formData.complexity || 5) - 1) / 9 * 100}%`,
                                }}
                              >
                                {(formData.value || 5) > (formData.complexity || 5) ? "✓" : "○"}
                              </div>

                              <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-xs font-medium text-muted-foreground whitespace-nowrap">
                                复杂度 →
                              </div>
                              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                                价值 →
                              </div>
                            </div>

                            <div className="mt-10 flex justify-center gap-6">
                              {quadrants.map((q) => (
                                <div key={q.id} className="flex items-center gap-2">
                                  <div
                                    className={`w-3 h-3 rounded-sm border ${q.bgColor} ${q.borderColor}`}
                                  />
                                  <span className="text-xs text-muted-foreground">{q.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">全量矩阵视图</CardTitle>
                          <CardDescription>所有功能项在价值复杂度矩阵中的分布</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="relative w-full aspect-video max-w-2xl mx-auto">
                            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1">
                              {quadrants.map((q) => (
                                <div
                                  key={q.id}
                                  className={`rounded-lg border ${q.bgColor} ${q.borderColor} p-2`}
                                >
                                  <p className="text-xs font-medium text-muted-foreground">
                                    {q.name}
                                  </p>
                                </div>
                              ))}
                            </div>

                            {priorityItems.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                className={`absolute w-4 h-4 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-150 hover:z-20 ${
                                  selectedItem?.id === item.id
                                    ? "bg-primary ring-2 ring-primary ring-offset-2 z-10"
                                    : "bg-primary/60 hover:bg-primary"
                                }`}
                                style={{
                                  left: `${(item.value - 1) / 9 * 100}%`,
                                  top: `${100 - (item.complexity - 1) / 9 * 100}%`,
                                }}
                                title={item.name}
                              />
                            ))}

                            <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-xs font-medium text-muted-foreground whitespace-nowrap">
                              复杂度 →
                            </div>
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                              价值 →
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">选择或创建功能项</h3>
              <p className="text-sm text-muted-foreground mt-1">
                从左侧选择，或创建一个新的功能项进行优先级评估
              </p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                新建功能项
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
