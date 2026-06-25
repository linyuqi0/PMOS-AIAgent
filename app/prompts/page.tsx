"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Sparkles,
  Plus,
  Search,
  Star,
  Copy,
  Trash2,
  Save,
  Tag,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select } from "@/components/ui/select";
import { db } from "@/lib/db";
import { formatDate, copyToClipboard } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { Prompt } from "@/types";

const categories = [
  "产品经理",
  "BI",
  "数据分析",
  "广告系统",
  "AI产品",
  "数仓",
  "埋点",
  "运营",
  "其他",
];

export default function PromptsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPrompt, setSelectedPrompt] = React.useState<Prompt | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [formData, setFormData] = React.useState<Partial<Prompt>>({
    title: "",
    content: "",
    category: "产品经理",
    tags: [],
    isFavorite: false,
  });
  const [tagInput, setTagInput] = React.useState("");
  const { toast } = useToast();

  const prompts = useLiveQuery(
    () => db.prompts.orderBy("updatedAt").reverse().toArray(),
    [],
    []
  );

  const filteredPrompts = React.useMemo(() => {
    return prompts.filter((p) => {
      const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [prompts, searchQuery, selectedCategory]);

  const favoritePrompts = React.useMemo(
    () => prompts.filter((p) => p.isFavorite),
    [prompts]
  );

  const categoryCount = React.useMemo(() => {
    const count: Record<string, number> = {};
    prompts.forEach((p) => {
      count[p.category] = (count[p.category] || 0) + 1;
    });
    return count;
  }, [prompts]);

  const handleCreate = () => {
    setSelectedPrompt(null);
    setIsEditing(true);
    setFormData({
      title: "",
      content: "",
      category: "产品经理",
      tags: [],
      isFavorite: false,
    });
  };

  const handleSelect = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsEditing(false);
    setFormData(prompt);
  };

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      toast({ message: "请输入Prompt标题", type: "error" });
      return;
    }
    if (!formData.content?.trim()) {
      toast({ message: "请输入Prompt内容", type: "error" });
      return;
    }

    const now = new Date();
    if (selectedPrompt?.id) {
      await db.prompts.update(selectedPrompt.id, {
        ...formData,
        updatedAt: now,
      });
      await db.addRecentEdit("prompt", selectedPrompt.id, formData.title!);
      toast({ message: "Prompt已保存", type: "success" });
      const updated = await db.prompts.get(selectedPrompt.id);
      if (updated) setSelectedPrompt(updated);
    } else {
      const id = await db.prompts.add({
        title: formData.title!,
        content: formData.content!,
        category: formData.category || "产品经理",
        tags: formData.tags || [],
        isFavorite: formData.isFavorite || false,
        createdAt: now,
        updatedAt: now,
      });
      await db.addRecentEdit("prompt", id, formData.title!);
      toast({ message: "Prompt已创建", type: "success" });
      const created = await db.prompts.get(id);
      if (created) setSelectedPrompt(created);
    }
    setIsEditing(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个Prompt吗？")) return;
    await db.prompts.delete(id);
    if (selectedPrompt?.id === id) {
      setSelectedPrompt(null);
      setIsEditing(false);
    }
    toast({ message: "Prompt已删除", type: "success" });
  };

  const handleToggleFavorite = async () => {
    if (!selectedPrompt?.id) return;
    const newFav = !formData.isFavorite;
    await db.prompts.update(selectedPrompt.id, {
      isFavorite: newFav,
      updatedAt: new Date(),
    });
    setFormData({ ...formData, isFavorite: newFav });
    toast({ message: newFav ? "已收藏" : "已取消收藏", type: "success" });
  };

  const handleCopy = async () => {
    if (!formData.content) return;
    await copyToClipboard(formData.content);
    toast({ message: "已复制到剪贴板", type: "success" });
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
    <AppLayout title="Prompt 库" description="§ 09 — A Library of Instructions">
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        <div className="w-64 shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索Prompt..."
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
                <FolderOpen className="h-4 w-4" />
                <span className="flex-1 text-left">全部</span>
                <Badge variant="secondary" className="text-xs">
                  {prompts.length}
                </Badge>
              </button>

              {favoritePrompts.length > 0 && (
                <button
                  onClick={() => setSelectedCategory("favorites")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === "favorites"
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="flex-1 text-left">收藏</span>
                  <Badge variant="secondary" className="text-xs">
                    {favoritePrompts.length}
                  </Badge>
                </button>
              )}
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 px-3">
                分类
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
                    <Sparkles className="h-4 w-4" />
                    <span className="flex-1 text-left">{cat}</span>
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
              ? "全部Prompt"
              : selectedCategory === "favorites"
              ? "我的收藏"
              : selectedCategory}
          </p>
          <ScrollArea className="h-[calc(100%-2rem)]">
            <div className="space-y-2 pr-1">
              {filteredPrompts.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  暂无Prompt
                </div>
              ) : (
                filteredPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    onClick={() => handleSelect(prompt)}
                    className={`cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/50 ${
                      selectedPrompt?.id === prompt.id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {prompt.isFavorite && (
                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                          )}
                          <p className="font-medium text-sm truncate">{prompt.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {prompt.content.slice(0, 80)}...
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {prompt.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(prompt.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {selectedPrompt || isEditing ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {isEditing ? (
                    <Input
                      value={formData.title || ""}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="输入Prompt标题"
                      className="text-lg font-semibold h-10 w-full max-w-md"
                    />
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <h2 className="text-xl font-bold truncate">{formData.title}</h2>
                      {formData.isFavorite && (
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 shrink-0" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!isEditing ? (
                    <>
                      <Button variant="ghost" size="icon" onClick={handleToggleFavorite}>
                        <Star
                          className={`h-4 w-4 ${
                            formData.isFavorite
                              ? "text-yellow-500 fill-yellow-500"
                              : ""
                          }`}
                        />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        <Copy className="mr-2 h-4 w-4" />
                        复制
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectedPrompt?.id && handleDelete(selectedPrompt.id)}
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

              {isEditing && (
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>分类</Label>
                    <Select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
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

              {!isEditing && selectedPrompt && (
                <div className="mb-4 flex items-center gap-2">
                  <Badge variant="outline">{selectedPrompt.category}</Badge>
                  {selectedPrompt.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-hidden">
                {isEditing ? (
                  <Textarea
                    value={formData.content || ""}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="输入Prompt内容...&#10;&#10;提示：使用 {变量名} 作为占位符"
                    className="h-full font-mono text-sm resize-none"
                  />
                ) : (
                  <div className="h-full rounded-lg border bg-muted/30 p-6 overflow-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono text-foreground/90">
                      {formData.content || "暂无内容"}
                    </pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">选择或创建Prompt</h3>
              <p className="text-sm text-muted-foreground mt-1">
                内置多场景Prompt模板，一键复制使用
              </p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                新建Prompt
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
