"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Building2,
  Plus,
  Search,
  Trash2,
  Save,
  Edit,
  Star,
  Target,
  DollarSign,
  Zap,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { Competitor } from "@/types";

const getScoreColor = (score: number) => {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
};

const getScoreTextColor = (score: number) => {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 40) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
};

export default function CompetitorsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCompetitor, setSelectedCompetitor] = React.useState<Competitor | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>("basic");
  const [tagInput, setTagInput] = React.useState("");
  const [formData, setFormData] = React.useState<Partial<Competitor>>({
    name: "",
    website: "",
    positioning: "",
    targetUsers: "",
    coreFeatures: "",
    strengths: "",
    weaknesses: "",
    pricing: "",
    score: 50,
    tags: [],
  });
  const { toast } = useToast();

  const competitors = useLiveQuery(
    () => db.competitors.orderBy("updatedAt").reverse().toArray(),
    [],
    []
  );

  const filteredCompetitors = React.useMemo(
    () =>
      competitors.filter(
        (c) =>
          !searchQuery ||
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.positioning.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    [competitors, searchQuery]
  );

  const handleCreate = () => {
    setSelectedCompetitor(null);
    setIsEditing(true);
    setActiveTab("basic");
    setFormData({
      name: "",
      website: "",
      positioning: "",
      targetUsers: "",
      coreFeatures: "",
      strengths: "",
      weaknesses: "",
      pricing: "",
      score: 50,
      tags: [],
    });
  };

  const handleSelect = (competitor: Competitor) => {
    setSelectedCompetitor(competitor);
    setIsEditing(false);
    setActiveTab("basic");
    setFormData(competitor);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast({ message: "请输入竞品名称", type: "error" });
      return;
    }

    const now = new Date();
    if (selectedCompetitor?.id) {
      await db.competitors.update(selectedCompetitor.id, {
        ...formData,
        updatedAt: now,
      });
      await db.addRecentEdit("competitor", selectedCompetitor.id, formData.name!);
      toast({ message: "竞品已保存", type: "success" });
      const updated = await db.competitors.get(selectedCompetitor.id);
      if (updated) setSelectedCompetitor(updated);
    } else {
      const id = await db.competitors.add({
        name: formData.name!,
        website: formData.website || "",
        positioning: formData.positioning || "",
        targetUsers: formData.targetUsers || "",
        coreFeatures: formData.coreFeatures || "",
        strengths: formData.strengths || "",
        weaknesses: formData.weaknesses || "",
        pricing: formData.pricing || "",
        score: formData.score ?? 50,
        tags: formData.tags || [],
        createdAt: now,
        updatedAt: now,
      });
      await db.addRecentEdit("competitor", id, formData.name!);
      toast({ message: "竞品已创建", type: "success" });
      const created = await db.competitors.get(id);
      if (created) setSelectedCompetitor(created);
    }
    setIsEditing(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个竞品吗？")) return;
    await db.competitors.delete(id);
    if (selectedCompetitor?.id === id) {
      setSelectedCompetitor(null);
      setIsEditing(false);
    }
    toast({ message: "竞品已删除", type: "success" });
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (formData.tags?.includes(tagInput.trim())) {
      setTagInput("");
      return;
    }
    setFormData({
      ...formData,
      tags: [...(formData.tags || []), tagInput.trim()],
    });
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter((t) => t !== tag),
    });
  };

  return (
    <AppLayout title="竞品分析">
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        <div className="w-72 shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索竞品..."
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
              {filteredCompetitors.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  暂无竞品
                </div>
              ) : (
                filteredCompetitors.map((competitor) => (
                  <div
                    key={competitor.id}
                    onClick={() => handleSelect(competitor)}
                    className={`cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/50 ${
                      selectedCompetitor?.id === competitor.id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{competitor.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {competitor.positioning}
                        </p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className={`text-sm font-bold ${getScoreTextColor(competitor.score)}`}>
                          {competitor.score}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getScoreColor(competitor.score)}`}
                        style={{ width: `${competitor.score}%` }}
                      />
                    </div>
                    {competitor.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {competitor.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {competitor.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{competitor.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {selectedCompetitor || isEditing ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    {isEditing ? (
                      <Input
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="输入竞品名称"
                        className="text-lg font-semibold h-10 w-64"
                      />
                    ) : (
                      <h2 className="text-xl font-bold">{formData.name}</h2>
                    )}
                    {!isEditing && formData.website && (
                      <a
                        href={formData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        {formData.website}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectedCompetitor?.id && handleDelete(selectedCompetitor.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      保存
                    </Button>
                  )}
                </div>
              </div>

              {!isEditing && (
                <div className="mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-muted-foreground">综合评分</span>
                        <span className={`text-lg font-bold ${getScoreTextColor(formData.score ?? 0)}`}>
                          {formData.score ?? 0}/100
                        </span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getScoreColor(formData.score ?? 0)}`}
                          style={{ width: `${formData.score ?? 0}%` }}
                        />
                      </div>
                    </div>
                    {formData.tags && formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 ml-4">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    更新于 {formatDate(formData.updatedAt ?? new Date())}
                  </p>
                </div>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList>
                  <TabsTrigger value="basic">
                    <Star className="mr-2 h-4 w-4" />
                    基本信息
                  </TabsTrigger>
                  <TabsTrigger value="features">
                    <Zap className="mr-2 h-4 w-4" />
                    功能分析
                  </TabsTrigger>
                  <TabsTrigger value="business">
                    <DollarSign className="mr-2 h-4 w-4" />
                    商业模式
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="flex-1 mt-4 overflow-hidden">
                  <ScrollArea className="h-full pr-2">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label>竞品名称</Label>
                        <Input
                          value={formData.name || ""}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="输入竞品名称"
                          readOnly={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>官网</Label>
                        <Input
                          value={formData.website || ""}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://example.com"
                          readOnly={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          <Target className="inline-block h-4 w-4 mr-1" />
                          定位
                        </Label>
                        <Textarea
                          value={formData.positioning || ""}
                          onChange={(e) => setFormData({ ...formData, positioning: e.target.value })}
                          placeholder="简述产品定位..."
                          rows={3}
                          readOnly={!isEditing}
                          className={!isEditing ? "bg-transparent resize-none" : ""}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          <Building2 className="inline-block h-4 w-4 mr-1" />
                          目标用户
                        </Label>
                        <Textarea
                          value={formData.targetUsers || ""}
                          onChange={(e) => setFormData({ ...formData, targetUsers: e.target.value })}
                          placeholder="描述目标用户群体..."
                          rows={3}
                          readOnly={!isEditing}
                          className={!isEditing ? "bg-transparent resize-none" : ""}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          <Star className="inline-block h-4 w-4 mr-1" />
                          评分 ({formData.score ?? 0}/100)
                        </Label>
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={formData.score ?? 50}
                              onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) })}
                              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">0</span>
                              <span className={`text-sm font-bold ${getScoreTextColor(formData.score ?? 0)}`}>
                                {formData.score ?? 50} 分
                              </span>
                              <span className="text-xs text-muted-foreground">100</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getScoreColor(formData.score ?? 0)}`}
                              style={{ width: `${formData.score ?? 0}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>标签</Label>
                        {isEditing ? (
                          <>
                            <div className="flex gap-2">
                              <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                                placeholder="添加标签"
                              />
                              <Button variant="outline" size="icon" onClick={handleAddTag}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            {formData.tags && formData.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {formData.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="cursor-pointer"
                                    onClick={handleRemoveTag.bind(null, tag)}
                                  >
                                    {tag} <X className="ml-1 h-3 w-3" />
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {formData.tags && formData.tags.length > 0 ? (
                              formData.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">暂无标签</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="features" className="flex-1 mt-4 overflow-hidden">
                  <ScrollArea className="h-full pr-2">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label>
                          <Zap className="inline-block h-4 w-4 mr-1" />
                          核心功能
                        </Label>
                        <Textarea
                          value={formData.coreFeatures || ""}
                          onChange={(e) => setFormData({ ...formData, coreFeatures: e.target.value })}
                          placeholder="列出竞品的核心功能..."
                          rows={6}
                          readOnly={!isEditing}
                          className={!isEditing ? "bg-transparent resize-none" : ""}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-emerald-200 dark:border-emerald-900">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              优势
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Textarea
                              value={formData.strengths || ""}
                              onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                              placeholder="描述竞品的优势..."
                              rows={8}
                              readOnly={!isEditing}
                              className="bg-transparent resize-none border-none p-0 focus-visible:ring-0"
                            />
                          </CardContent>
                        </Card>

                        <Card className="border-red-200 dark:border-red-900">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2 text-red-600 dark:text-red-400">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              劣势
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Textarea
                              value={formData.weaknesses || ""}
                              onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
                              placeholder="描述竞品的劣势..."
                              rows={8}
                              readOnly={!isEditing}
                              className="bg-transparent resize-none border-none p-0 focus-visible:ring-0"
                            />
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="business" className="flex-1 mt-4 overflow-hidden">
                  <ScrollArea className="h-full pr-2">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label>
                          <DollarSign className="inline-block h-4 w-4 mr-1" />
                          定价策略
                        </Label>
                        <Textarea
                          value={formData.pricing || ""}
                          onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
                          placeholder="描述竞品的定价策略，如：免费版、付费版价格、企业版报价等..."
                          rows={6}
                          readOnly={!isEditing}
                          className={!isEditing ? "bg-transparent resize-none" : ""}
                        />
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            盈利模式分析
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            结合定价策略和产品定位，分析竞品的主要盈利方式：
                          </p>
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-lg border p-3">
                              <p className="text-xs text-muted-foreground mb-1">订阅制</p>
                              <p className="text-sm font-medium">
                                {formData.pricing?.toLowerCase().includes("月") || formData.pricing?.toLowerCase().includes("年") || formData.pricing?.includes("/") ? "✅ 可能" : "❓ 待确认"}
                              </p>
                            </div>
                            <div className="rounded-lg border p-3">
                              <p className="text-xs text-muted-foreground mb-1">免费增值</p>
                              <p className="text-sm font-medium">
                                {formData.pricing?.toLowerCase().includes("免费") || formData.pricing?.toLowerCase().includes("freemium") ? "✅ 可能" : "❓ 待确认"}
                              </p>
                            </div>
                            <div className="rounded-lg border p-3">
                              <p className="text-xs text-muted-foreground mb-1">企业版</p>
                              <p className="text-sm font-medium">
                                {formData.pricing?.toLowerCase().includes("企业") || formData.pricing?.toLowerCase().includes("enterprise") ? "✅ 可能" : "❓ 待确认"}
                              </p>
                            </div>
                            <div className="rounded-lg border p-3">
                              <p className="text-xs text-muted-foreground mb-1">按用量付费</p>
                              <p className="text-sm font-medium">
                                {formData.pricing?.toLowerCase().includes("用量") || formData.pricing?.toLowerCase().includes("按次") ? "✅ 可能" : "❓ 待确认"}
                              </p>
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
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">选择或创建竞品</h3>
              <p className="text-sm text-muted-foreground mt-1">
                从左侧选择竞品，或创建新的竞品分析
              </p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                新建竞品
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
