"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  BookOpen,
  Plus,
  Search,
  Copy,
  Trash2,
  Save,
  Tag,
  ChevronRight,
  Layers,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  Star,
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
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/db";
import { formatDate, copyToClipboard } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { UserStory } from "@/types";
import { AIGenerateBar } from "@/components/ai-generate-bar";
import { generateUserStories } from "@/lib/ai-service";

const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21];

const PRIORITY_CONFIG = {
  must: { label: "Must", className: "bg-red-100 text-red-700 border-red-200" },
  should: { label: "Should", className: "bg-orange-100 text-orange-700 border-orange-200" },
  could: { label: "Could", className: "bg-blue-100 text-blue-700 border-blue-200" },
  wont: { label: "Won't", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

const STATUS_CONFIG = {
  backlog: { label: "待办", icon: Circle, className: "text-muted-foreground" },
  doing: { label: "进行中", icon: Loader2, className: "text-blue-500" },
  done: { label: "已完成", icon: CheckCircle2, className: "text-green-500" },
};

export default function UserStoriesPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStory, setSelectedStory] = React.useState<UserStory | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedEpic, setSelectedEpic] = React.useState<string>("all");
  const [formData, setFormData] = React.useState<Partial<UserStory>>({
    epic: "",
    role: "",
    action: "",
    value: "",
    acceptanceCriteria: "",
    storyPoints: 3,
    priority: "should",
    status: "backlog",
    tags: [],
  });
  const [tagInput, setTagInput] = React.useState("");
  const { toast } = useToast();

  const userStories = useLiveQuery(
    () => db.userStories.orderBy("updatedAt").reverse().toArray(),
    [],
    []
  );

  const epics = React.useMemo(() => {
    const epicSet = new Set(userStories.map((s) => s.epic));
    return Array.from(epicSet).sort();
  }, [userStories]);

  const epicStats = React.useMemo(() => {
    const stats: Record<string, { total: number; backlog: number; doing: number; done: number }> = {};
    userStories.forEach((s) => {
      if (!stats[s.epic]) {
        stats[s.epic] = { total: 0, backlog: 0, doing: 0, done: 0 };
      }
      stats[s.epic].total++;
      stats[s.epic][s.status]++;
    });
    return stats;
  }, [userStories]);

  const overallStats = React.useMemo(() => {
    return userStories.reduce(
      (acc, s) => {
        acc.total++;
        acc[s.status]++;
        return acc;
      },
      { total: 0, backlog: 0, doing: 0, done: 0 }
    );
  }, [userStories]);

  const filteredStories = React.useMemo(() => {
    return userStories.filter((s) => {
      const matchEpic = selectedEpic === "all" || s.epic === selectedEpic;
      const matchSearch =
        !searchQuery ||
        s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchEpic && matchSearch;
    });
  }, [userStories, searchQuery, selectedEpic]);

  const storyTitle = (story: UserStory) => {
    return `作为${story.role}，我想要${story.action}`;
  };

  const handleCreate = () => {
    setSelectedStory(null);
    setIsEditing(true);
    setFormData({
      epic: selectedEpic === "all" ? "" : selectedEpic,
      role: "",
      action: "",
      value: "",
      acceptanceCriteria: "",
      storyPoints: 3,
      priority: "should",
      status: "backlog",
      tags: [],
    });
  };

  const handleSelect = (story: UserStory) => {
    setSelectedStory(story);
    setIsEditing(false);
    setFormData(story);
  };

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    if (!formData.epic?.trim()) {
      toast({ message: "请输入Epic名称", type: "error" });
      return;
    }
    if (!formData.role?.trim()) {
      toast({ message: "请输入用户角色", type: "error" });
      return;
    }
    if (!formData.action?.trim()) {
      toast({ message: "请输入用户行动", type: "error" });
      return;
    }
    if (!formData.value?.trim()) {
      toast({ message: "请输入价值描述", type: "error" });
      return;
    }

    const now = new Date();
    if (selectedStory?.id) {
      await db.userStories.update(selectedStory.id, {
        ...formData,
        updatedAt: now,
      });
      await db.addRecentEdit("userstory", selectedStory.id, storyTitle({ ...selectedStory, ...formData } as UserStory));
      toast({ message: "用户故事已保存", type: "success" });
      const updated = await db.userStories.get(selectedStory.id);
      if (updated) setSelectedStory(updated);
    } else {
      const id = await db.userStories.add({
        epic: formData.epic!,
        role: formData.role!,
        action: formData.action!,
        value: formData.value!,
        acceptanceCriteria: formData.acceptanceCriteria || "",
        storyPoints: formData.storyPoints || 3,
        priority: formData.priority || "should",
        status: formData.status || "backlog",
        tags: formData.tags || [],
        createdAt: now,
        updatedAt: now,
      });
      await db.addRecentEdit("userstory", id, storyTitle({ ...formData } as UserStory));
      toast({ message: "用户故事已创建", type: "success" });
      const created = await db.userStories.get(id);
      if (created) setSelectedStory(created);
    }
    setIsEditing(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个用户故事吗？")) return;
    await db.userStories.delete(id);
    if (selectedStory?.id === id) {
      setSelectedStory(null);
      setIsEditing(false);
    }
    toast({ message: "用户故事已删除", type: "success" });
  };

  const handleCopy = async () => {
    const text = `作为${formData.role}，我想要${formData.action}，以便于${formData.value}`;
    await copyToClipboard(text);
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

  const StatusIcon = selectedStory ? STATUS_CONFIG[selectedStory.status].icon : Circle;

  return (
    <AppLayout title="用户故事地图">
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        <div className="w-64 shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索用户故事..."
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
                onClick={() => setSelectedEpic("all")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedEpic === "all"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Layers className="h-4 w-4" />
                <span className="flex-1 text-left">全部Epic</span>
                <Badge variant="secondary" className="text-xs">
                  {overallStats.total}
                </Badge>
              </button>

              {overallStats.total > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 text-xs">
                  <div className="flex items-center gap-1">
                    <Circle className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{overallStats.backlog}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 text-blue-500" />
                    <span className="text-muted-foreground">{overallStats.doing}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span className="text-muted-foreground">{overallStats.done}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 px-3">
                Epic 分组
              </p>
              <div className="space-y-1">
                {epics.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                    暂无Epic
                  </div>
                ) : (
                  epics.map((epic) => (
                    <button
                      key={epic}
                      onClick={() => setSelectedEpic(epic)}
                      className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedEpic === epic
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left truncate">{epic}</span>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {epicStats[epic]?.total || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 pl-6 text-xs">
                        <div className="flex items-center gap-1">
                          <Circle className="h-2.5 w-2.5 text-muted-foreground" />
                          <span>{epicStats[epic]?.backlog || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Loader2 className="h-2.5 w-2.5 text-blue-500" />
                          <span>{epicStats[epic]?.doing || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />
                          <span>{epicStats[epic]?.done || 0}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="w-80 shrink-0 border rounded-xl p-4 flex flex-col">
          <AIGenerateBar
            placeholder="输入功能描述，AI 批量生成用户故事（标准句式 + 故事点 + 优先级）..."
            buttonLabel="AI 生成故事"
            examples={["用户注册登录", "购物车功能", "内容发布与审核"]}
            onGenerate={(input) => generateUserStories(input)}
            onGenerated={async (data) => {
              await Promise.all(
                data.map((s: Omit<UserStory, "id">) => db.userStories.add(s))
              );
              toast({
                message: `已生成 ${data.length} 条用户故事`,
                type: "success",
              });
            }}
            className="mb-3"
          />
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">
              {selectedEpic === "all" ? "全部用户故事" : selectedEpic}
            </p>
            <Badge variant="outline" className="text-xs">
              {filteredStories.length} 个
            </Badge>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-2 pr-1">
              {filteredStories.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  暂无用户故事
                </div>
              ) : (
                filteredStories.map((story) => {
                  const StatusIcon = STATUS_CONFIG[story.status].icon;
                  const priorityConf = PRIORITY_CONFIG[story.priority];
                  return (
                    <div
                      key={story.id}
                      onClick={() => handleSelect(story)}
                      className={`cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/50 ${
                        selectedStory?.id === story.id
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <StatusIcon
                              className={`h-3.5 w-3.5 shrink-0 ${STATUS_CONFIG[story.status].className}`}
                            />
                            <p className="font-medium text-sm line-clamp-2">
                              作为{story.role}，我想要{story.action}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            以便于{story.value}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={`text-xs border ${priorityConf.className}`}
                          >
                            {priorityConf.label}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {story.storyPoints} SP
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(story.updatedAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {selectedStory || isEditing ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {selectedStory && (
                    <div className="flex items-center gap-2 shrink-0">
                      {(() => {
                        const Icon = STATUS_CONFIG[selectedStory.status].icon;
                        return (
                          <Icon
                            className={`h-5 w-5 ${STATUS_CONFIG[selectedStory.status].className}`}
                          />
                        );
                      })()}
                      <Badge variant="outline" className="text-sm">
                        {STATUS_CONFIG[selectedStory.status].label}
                      </Badge>
                    </div>
                  )}
                  <h2 className="text-xl font-bold truncate">
                    {isEditing ? (selectedStory ? "编辑用户故事" : "新建用户故事") : "用户故事详情"}
                  </h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!isEditing ? (
                    <>
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
                        onClick={() => selectedStory?.id && handleDelete(selectedStory.id)}
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

              <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-6 pb-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">标准句式</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg leading-relaxed bg-muted/30 rounded-lg p-4 border">
                        <span className="text-muted-foreground">作为</span>
                        <span className="font-medium text-primary">
                          {" "}
                          {formData.role || "[角色]"}
                          {" "}
                        </span>
                        <span className="text-muted-foreground">，我想要</span>
                        <span className="font-medium text-primary">
                          {" "}
                          {formData.action || "[行动]"}
                          {" "}
                        </span>
                        <span className="text-muted-foreground">，以便于</span>
                        <span className="font-medium text-primary">
                          {" "}
                          {formData.value || "[价值]"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Epic</Label>
                      {isEditing ? (
                        <Input
                          value={formData.epic || ""}
                          onChange={(e) => setFormData({ ...formData, epic: e.target.value })}
                          placeholder="输入Epic名称"
                        />
                      ) : (
                        <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/30">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formData.epic}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>故事点估算</Label>
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          {STORY_POINTS.map((sp) => (
                            <button
                              key={sp}
                              onClick={() => setFormData({ ...formData, storyPoints: sp })}
                              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                                formData.storyPoints === sp
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background hover:bg-muted border-input"
                              }`}
                            >
                              {sp}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/30">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">{formData.storyPoints} 故事点</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>用户角色</Label>
                    {isEditing ? (
                      <Input
                        value={formData.role || ""}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="例如：新用户、运营人员、管理员"
                      />
                    ) : (
                      <div className="h-9 px-3 rounded-md border bg-muted/30 flex items-center">
                        <span className="text-sm">{formData.role}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>用户行动</Label>
                    {isEditing ? (
                      <Input
                        value={formData.action || ""}
                        onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                        placeholder="描述用户想要做什么"
                      />
                    ) : (
                      <div className="h-9 px-3 rounded-md border bg-muted/30 flex items-center">
                        <span className="text-sm">{formData.action}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>价值描述</Label>
                    {isEditing ? (
                      <Input
                        value={formData.value || ""}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        placeholder="描述这个功能带来的价值"
                      />
                    ) : (
                      <div className="h-9 px-3 rounded-md border bg-muted/30 flex items-center">
                        <span className="text-sm">{formData.value}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>优先级 (MoSCoW)</Label>
                      {isEditing ? (
                        <Select
                          value={formData.priority}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              priority: e.target.value as UserStory["priority"],
                            })
                          }
                        >
                          <option value="must">Must - 必须有</option>
                          <option value="should">Should - 应该有</option>
                          <option value="could">Could - 可以有</option>
                          <option value="wont">Won&apos;t - 这次不会有</option>
                        </Select>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`text-sm px-3 py-1.5 border ${PRIORITY_CONFIG[formData.priority as keyof typeof PRIORITY_CONFIG].className}`}
                        >
                          {PRIORITY_CONFIG[formData.priority as keyof typeof PRIORITY_CONFIG].label}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>状态</Label>
                      {isEditing ? (
                        <Select
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              status: e.target.value as UserStory["status"],
                            })
                          }
                        >
                          <option value="backlog">待办</option>
                          <option value="doing">进行中</option>
                          <option value="done">已完成</option>
                        </Select>
                      ) : (
                        <Badge variant="outline" className="text-sm px-3 py-1.5">
                          {STATUS_CONFIG[formData.status as keyof typeof STATUS_CONFIG].label}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>验收标准</Label>
                    {isEditing ? (
                      <Textarea
                        value={formData.acceptanceCriteria || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, acceptanceCriteria: e.target.value })
                        }
                        placeholder="列出验收标准，每行一条&#10;例如：&#10;1. 用户可以成功注册&#10;2. 注册后自动登录&#10;3. 密码长度至少8位"
                        className="min-h-[150px] resize-none"
                      />
                    ) : (
                      <div className="rounded-lg border bg-muted/30 p-4 min-h-[100px]">
                        {formData.acceptanceCriteria ? (
                          <div className="text-sm whitespace-pre-wrap">
                            {formData.acceptanceCriteria}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">暂无验收标准</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>标签</Label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && (e.preventDefault(), handleAddTag())
                            }
                            placeholder="添加标签"
                          />
                          <Button variant="outline" size="icon" onClick={handleAddTag}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {formData.tags && formData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
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
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {formData.tags && formData.tags.length > 0 ? (
                          formData.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">暂无标签</span>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedStory && !isEditing && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>创建于 {formatDate(selectedStory.createdAt)}</span>
                        <span>更新于 {formatDate(selectedStory.updatedAt)}</span>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">选择或创建用户故事</h3>
              <p className="text-sm text-muted-foreground mt-1">
                敏捷用户故事管理，按 Epic 分组，估算故事点
              </p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                新建用户故事
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
