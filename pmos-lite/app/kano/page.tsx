"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Sparkles,
  Plus,
  Search,
  Trash2,
  Save,
  Tag,
  ChevronRight,
  Star,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Minus,
  AlertTriangle,
  Info,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select } from "@/components/ui/select";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { KanoItem } from "@/types";

const categoryMap: Record<KanoItem['category'], { label: string; color: string; icon: React.ReactNode }> = {
  basic: { label: "基本型", color: "bg-red-100 text-red-700 border-red-200", icon: <AlertTriangle className="h-4 w-4" /> },
  performance: { label: "期望型", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <Star className="h-4 w-4" /> },
  excitement: { label: "兴奋型", color: "bg-green-100 text-green-700 border-green-200", icon: <Zap className="h-4 w-4" /> },
  indifferent: { label: "无差异型", color: "bg-gray-100 text-gray-700 border-gray-200", icon: <Minus className="h-4 w-4" /> },
  reverse: { label: "反向型", color: "bg-purple-100 text-purple-700 border-purple-200", icon: <ThumbsDown className="h-4 w-4" /> },
};

const categories: KanoItem['category'][] = ['basic', 'performance', 'excitement', 'indifferent', 'reverse'];

export default function KanoPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedItem, setSelectedItem] = React.useState<KanoItem | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [formData, setFormData] = React.useState<Partial<KanoItem>>({
    featureName: "",
    category: "basic",
    description: "",
    positiveQuestion: "",
    negativeQuestion: "",
    satisfaction: 3,
    importance: 3,
    tags: [],
  });
  const [tagInput, setTagInput] = React.useState("");
  const { toast } = useToast();

  const kanoItems = useLiveQuery(
    () => db.kanoItems.orderBy("updatedAt").reverse().toArray(),
    [],
    []
  );

  const filteredItems = React.useMemo(() => {
    return kanoItems.filter((item) => {
      const matchCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        item.featureName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [kanoItems, searchQuery, selectedCategory]);

  const categoryCount = React.useMemo(() => {
    const count: Record<string, number> = {};
    kanoItems.forEach((item) => {
      count[item.category] = (count[item.category] || 0) + 1;
    });
    return count;
  }, [kanoItems]);

  const handleCreate = () => {
    setSelectedItem(null);
    setIsEditing(true);
    setFormData({
      featureName: "",
      category: "basic",
      description: "",
      positiveQuestion: "",
      negativeQuestion: "",
      satisfaction: 3,
      importance: 3,
      tags: [],
    });
  };

  const handleSelect = (item: KanoItem) => {
    setSelectedItem(item);
    setIsEditing(false);
    setFormData(item);
  };

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    if (!formData.featureName?.trim()) {
      toast({ message: "请输入功能名称", type: "error" });
      return;
    }

    const now = new Date();
    if (selectedItem?.id) {
      await db.kanoItems.update(selectedItem.id, {
        ...formData,
        updatedAt: now,
      });
      await db.addRecentEdit("kano", selectedItem.id, formData.featureName!);
      toast({ message: "KANO分析项已保存", type: "success" });
      const updated = await db.kanoItems.get(selectedItem.id);
      if (updated) setSelectedItem(updated);
    } else {
      const id = await db.kanoItems.add({
        featureName: formData.featureName!,
        category: formData.category || "basic",
        description: formData.description || "",
        positiveQuestion: formData.positiveQuestion || "",
        negativeQuestion: formData.negativeQuestion || "",
        satisfaction: formData.satisfaction || 3,
        importance: formData.importance || 3,
        tags: formData.tags || [],
        createdAt: now,
        updatedAt: now,
      });
      await db.addRecentEdit("kano", id, formData.featureName!);
      toast({ message: "KANO分析项已创建", type: "success" });
      const created = await db.kanoItems.get(id);
      if (created) setSelectedItem(created);
    }
    setIsEditing(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个KANO分析项吗？")) return;
    await db.kanoItems.delete(id);
    if (selectedItem?.id === id) {
      setSelectedItem(null);
      setIsEditing(false);
    }
    toast({ message: "KANO分析项已删除", type: "success" });
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

  const renderStars = (value: number, onChange?: (v: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange?.(n)}
            className={`p-0.5 transition-colors ${
              onChange ? "cursor-pointer hover:scale-110" : "cursor-default"
            }`}
            disabled={!onChange}
          >
            <Star
              className={`h-5 w-5 ${
                n <= value
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <AppLayout title="KANO模型分析">
      <div className="flex flex-col gap-4 h-[calc(100vh-8rem)]">
        <Card className="shrink-0">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">KANO 模型理论说明</CardTitle>
            </div>
            <CardDescription>
              KANO模型是东京理工大学狩野纪昭教授提出的需求分类模型，用于分析用户需求对用户满意度的影响。
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-5 gap-3">
              {categories.map((cat) => (
                <div key={cat} className="flex items-start gap-2 p-3 rounded-lg border bg-muted/20">
                  <div className={`p-1.5 rounded-md ${categoryMap[cat].color.split(' ')[0]}`}>
                    {categoryMap[cat].icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{categoryMap[cat].label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cat === 'basic' && '必须具备的基础功能，缺少会导致不满'}
                      {cat === 'performance' && '做得越好满意度越高的期望型功能'}
                      {cat === 'excitement' && '超出预期的惊喜功能，大幅提升满意度'}
                      {cat === 'indifferent' && '用户不关心的功能，有无都不影响满意度'}
                      {cat === 'reverse' && '用户不想要的反向功能，提供反而降低满意度'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-6 flex-1 min-h-0">
          <div className="w-64 shrink-0 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索功能..."
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
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === "all"
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="flex-1 text-left">全部</span>
                  <Badge variant="secondary" className="text-xs">
                    {kanoItems.length}
                  </Badge>
                </button>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 px-3">
                  KANO 分类
                </p>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === cat
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {categoryMap[cat].icon}
                      <span className="flex-1 text-left">{categoryMap[cat].label}</span>
                      {categoryCount[cat] > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {categoryCount[cat]}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>

          <div className="w-80 shrink-0 border rounded-xl p-4">
            <p className="text-sm font-medium mb-3">
              {selectedCategory === "all"
                ? "全部功能"
                : categoryMap[selectedCategory as KanoItem['category']]?.label || "功能列表"}
            </p>
            <ScrollArea className="h-[calc(100%-2rem)]">
              <div className="space-y-2 pr-1">
                {filteredItems.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    暂无KANO分析项
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
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{item.featureName}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge variant="outline" className={`text-xs ${categoryMap[item.category].color}`}>
                          {categoryMap[item.category].label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(item.updatedAt)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          <span>满意度 {item.satisfaction}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          <span>重要性 {item.importance}</span>
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
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isEditing ? (
                      <Input
                        value={formData.featureName || ""}
                        onChange={(e) => setFormData({ ...formData, featureName: e.target.value })}
                        placeholder="输入功能名称"
                        className="text-lg font-semibold h-10 w-full max-w-md"
                      />
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">
                        <h2 className="text-xl font-bold truncate">{formData.featureName}</h2>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!isEditing ? (
                      <>
                        <Button variant="outline" size="sm" onClick={handleEdit}>
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
                      <Button size="sm" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        保存
                      </Button>
                    )}
                  </div>
                </div>

                <ScrollArea className="flex-1 -mx-4 px-4">
                  <div className="space-y-4 pb-4">
                    {!isEditing && selectedItem && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={categoryMap[selectedItem.category].color}>
                          {categoryMap[selectedItem.category].label}
                        </Badge>
                        {selectedItem.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {isEditing && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>KANO 分类</Label>
                          <Select
                            value={formData.category}
                            onChange={(e) =>
                              setFormData({ ...formData, category: e.target.value as KanoItem['category'] })
                            }
                          >
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {categoryMap[cat].label}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>标签</Label>
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
                                  onClick={() => handleRemoveTag(tag)}
                                >
                                  {tag} ×
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>功能描述</Label>
                      {isEditing ? (
                        <Textarea
                          value={formData.description || ""}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="描述这个功能的具体内容和作用..."
                          className="resize-none"
                          rows={3}
                        />
                      ) : (
                        <div className="rounded-lg border bg-muted/30 p-4">
                          <p className="text-sm">{formData.description || "暂无描述"}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <ThumbsUp className="h-4 w-4 text-green-500" />
                          正向问题
                        </Label>
                        {isEditing ? (
                          <Textarea
                            value={formData.positiveQuestion || ""}
                            onChange={(e) => setFormData({ ...formData, positiveQuestion: e.target.value })}
                            placeholder="如果产品有这个功能，用户会觉得？"
                            className="resize-none text-sm"
                            rows={3}
                          />
                        ) : (
                          <div className="rounded-lg border bg-green-50/50 border-green-200 p-4">
                            <p className="text-sm text-green-800">{formData.positiveQuestion || "暂无正向问题"}</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <ThumbsDown className="h-4 w-4 text-red-500" />
                          反向问题
                        </Label>
                        {isEditing ? (
                          <Textarea
                            value={formData.negativeQuestion || ""}
                            onChange={(e) => setFormData({ ...formData, negativeQuestion: e.target.value })}
                            placeholder="如果产品没有这个功能，用户会觉得？"
                            className="resize-none text-sm"
                            rows={3}
                          />
                        ) : (
                          <div className="rounded-lg border bg-red-50/50 border-red-200 p-4">
                            <p className="text-sm text-red-800">{formData.negativeQuestion || "暂无反向问题"}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <ThumbsUp className="h-4 w-4" />
                          满意度评分
                          <span className="ml-auto text-muted-foreground font-normal">
                            {formData.satisfaction || 0} / 5
                          </span>
                        </Label>
                        {isEditing ? (
                          <div className="space-y-3">
                            {renderStars(formData.satisfaction || 3, (v) =>
                              setFormData({ ...formData, satisfaction: v })
                            )}
                            <input
                              type="range"
                              min="1"
                              max="5"
                              step="1"
                              value={formData.satisfaction || 3}
                              onChange={(e) =>
                                setFormData({ ...formData, satisfaction: parseInt(e.target.value) })
                              }
                              className="w-full"
                            />
                          </div>
                        ) : (
                          <div className="rounded-lg border bg-muted/30 p-4">
                            {renderStars(formData.satisfaction || 0)}
                            <p className="text-xs text-muted-foreground mt-2">
                              用户对该功能的满意程度
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          重要性评分
                          <span className="ml-auto text-muted-foreground font-normal">
                            {formData.importance || 0} / 5
                          </span>
                        </Label>
                        {isEditing ? (
                          <div className="space-y-3">
                            {renderStars(formData.importance || 3, (v) =>
                              setFormData({ ...formData, importance: v })
                            )}
                            <input
                              type="range"
                              min="1"
                              max="5"
                              step="1"
                              value={formData.importance || 3}
                              onChange={(e) =>
                                setFormData({ ...formData, importance: parseInt(e.target.value) })
                              }
                              className="w-full"
                            />
                          </div>
                        ) : (
                          <div className="rounded-lg border bg-muted/30 p-4">
                            {renderStars(formData.importance || 0)}
                            <p className="text-xs text-muted-foreground mt-2">
                              用户认为该功能的重要程度
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isEditing && selectedItem && (
                      <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t">
                        <span>创建时间：{formatDate(selectedItem.createdAt)}</span>
                        <span>更新时间：{formatDate(selectedItem.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-semibold">选择或创建KANO分析项</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  使用KANO模型对产品功能需求进行分类和优先级排序
                </p>
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  新建KANO分析项
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
