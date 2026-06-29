"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Plus,
  Search,
  Trash2,
  Save,
  User,
  Target,
  Smile,
  Meh,
  Frown,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Map,
  Calendar,
  Tag,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/db";
import { formatDate, generateId } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { UserJourney, JourneyStage } from "@/types";

const emotionMap = {
  happy: { label: "愉悦", icon: Smile, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
  neutral: { label: "一般", icon: Meh, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
  sad: { label: "沮丧", icon: Frown, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
};

const defaultStages: Omit<JourneyStage, "id">[] = [
  { name: "发现", description: "", touchpoint: "", emotion: "neutral", painPoints: "", opportunities: "" },
  { name: "注册", description: "", touchpoint: "", emotion: "neutral", painPoints: "", opportunities: "" },
  { name: "首次使用", description: "", touchpoint: "", emotion: "neutral", painPoints: "", opportunities: "" },
  { name: "深度使用", description: "", touchpoint: "", emotion: "neutral", painPoints: "", opportunities: "" },
  { name: "留存回访", description: "", touchpoint: "", emotion: "neutral", painPoints: "", opportunities: "" },
];

export default function JourneyPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedJourney, setSelectedJourney] = React.useState<UserJourney | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedStageId, setSelectedStageId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<Partial<UserJourney>>({
    persona: "",
    goal: "",
    stages: [],
    tags: [],
  });
  const [tagInput, setTagInput] = React.useState("");
  const { toast } = useToast();

  const journeys = useLiveQuery(
    () => db.userJourneys.orderBy("updatedAt").reverse().toArray(),
    [],
    []
  );

  const filteredJourneys = React.useMemo(() => {
    return journeys.filter((j) => {
      const matchSearch =
        !searchQuery ||
        j.persona.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSearch;
    });
  }, [journeys, searchQuery]);

  const selectedStage = React.useMemo(() => {
    if (!selectedStageId || !formData.stages) return null;
    return formData.stages.find((s) => s.id === selectedStageId) || null;
  }, [selectedStageId, formData.stages]);

  const handleCreate = () => {
    setSelectedJourney(null);
    setIsEditing(true);
    setSelectedStageId(null);
    const now = new Date();
    setFormData({
      persona: "",
      goal: "",
      stages: defaultStages.map((s, i) => ({
        ...s,
        id: generateId() + i,
      })),
      tags: [],
    });
  };

  const handleSelect = (journey: UserJourney) => {
    setSelectedJourney(journey);
    setIsEditing(false);
    setSelectedStageId(journey.stages[0]?.id || null);
    setFormData(journey);
  };

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    if (!formData.persona?.trim()) {
      toast({ message: "请输入用户画像", type: "error" });
      return;
    }
    if (!formData.goal?.trim()) {
      toast({ message: "请输入旅程目标", type: "error" });
      return;
    }
    if (!formData.stages || formData.stages.length === 0) {
      toast({ message: "至少需要一个阶段", type: "error" });
      return;
    }

    const now = new Date();
    if (selectedJourney?.id) {
      await db.userJourneys.update(selectedJourney.id, {
        ...formData,
        updatedAt: now,
      });
      await db.addRecentEdit("journey", selectedJourney.id, formData.persona!);
      toast({ message: "旅程已保存", type: "success" });
      const updated = await db.userJourneys.get(selectedJourney.id);
      if (updated) {
        setSelectedJourney(updated);
        setFormData(updated);
      }
    } else {
      const id = await db.userJourneys.add({
        persona: formData.persona!,
        goal: formData.goal!,
        stages: formData.stages || [],
        tags: formData.tags || [],
        createdAt: now,
        updatedAt: now,
      });
      await db.addRecentEdit("journey", id, formData.persona!);
      toast({ message: "旅程已创建", type: "success" });
      const created = await db.userJourneys.get(id);
      if (created) {
        setSelectedJourney(created);
        setFormData(created);
      }
    }
    setIsEditing(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个用户旅程吗？")) return;
    await db.userJourneys.delete(id);
    if (selectedJourney?.id === id) {
      setSelectedJourney(null);
      setIsEditing(false);
      setSelectedStageId(null);
    }
    toast({ message: "旅程已删除", type: "success" });
  };

  const handleAddStage = () => {
    if (!isEditing) return;
    const newStage: JourneyStage = {
      id: generateId(),
      name: "新阶段",
      description: "",
      touchpoint: "",
      emotion: "neutral",
      painPoints: "",
      opportunities: "",
    };
    setFormData({
      ...formData,
      stages: [...(formData.stages || []), newStage],
    });
    setSelectedStageId(newStage.id);
  };

  const handleDeleteStage = (stageId: string) => {
    if (!isEditing || !formData.stages) return;
    if (formData.stages.length <= 1) {
      toast({ message: "至少保留一个阶段", type: "error" });
      return;
    }
    const newStages = formData.stages.filter((s) => s.id !== stageId);
    setFormData({ ...formData, stages: newStages });
    if (selectedStageId === stageId) {
      setSelectedStageId(newStages[0]?.id || null);
    }
  };

  const handleMoveStage = (stageId: string, direction: "up" | "down") => {
    if (!isEditing || !formData.stages) return;
    const index = formData.stages.findIndex((s) => s.id === stageId);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === formData.stages.length - 1) return;

    const newStages = [...formData.stages];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];
    setFormData({ ...formData, stages: newStages });
  };

  const handleUpdateStage = (stageId: string, updates: Partial<JourneyStage>) => {
    if (!isEditing || !formData.stages) return;
    setFormData({
      ...formData,
      stages: formData.stages.map((s) =>
        s.id === stageId ? { ...s, ...updates } : s
      ),
    });
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

  const EmotionIcon = ({ emotion, size = 16 }: { emotion: JourneyStage["emotion"]; size?: number }) => {
    const { icon: Icon, color } = emotionMap[emotion];
    return <Icon className={`${color}`} style={{ width: size, height: size }} />;
  };

  return (
    <AppLayout title="用户旅程地图">
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        <div className="w-64 shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索旅程..."
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
              {filteredJourneys.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <Map className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  暂无旅程
                </div>
              ) : (
                filteredJourneys.map((journey) => (
                  <div
                    key={journey.id}
                    onClick={() => handleSelect(journey)}
                    className={`cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/50 ${
                      selectedJourney?.id === journey.id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <p className="font-medium text-sm line-clamp-2">{journey.persona}</p>
                    </div>
                    <div className="flex items-start gap-2 mt-2">
                      <Target className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground line-clamp-2">{journey.goal}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex gap-1">
                        {journey.stages.slice(0, 3).map((stage) => (
                          <EmotionIcon key={stage.id} emotion={stage.emotion} size={14} />
                        ))}
                        {journey.stages.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{journey.stages.length - 3}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(journey.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="w-80 shrink-0 border rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">阶段时间线</p>
            {isEditing && (
              <Button variant="outline" size="sm" onClick={handleAddStage}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                添加
              </Button>
            )}
          </div>
          <ScrollArea className="flex-1">
            {!selectedJourney && !isEditing ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Map className="h-8 w-8 mx-auto mb-2 opacity-50" />
                选择或创建旅程
              </div>
            ) : (
              <div className="space-y-3 pr-1">
                {(formData.stages || []).map((stage, index) => {
                  const EmotionIconComp = emotionMap[stage.emotion].icon;
                  return (
                    <div
                      key={stage.id}
                      onClick={() => setSelectedStageId(stage.id)}
                      className={`relative rounded-lg border p-3 cursor-pointer transition-all ${
                        selectedStageId === stage.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                    >
                      {index < (formData.stages?.length || 0) - 1 && (
                        <div className="absolute left-5 top-full w-0.5 h-3 bg-border -z-10" />
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${emotionMap[stage.emotion].bg}`}>
                          <EmotionIconComp className={emotionMap[stage.emotion].color} style={{ width: 16, height: 16 }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium">
                              阶段 {index + 1}
                            </span>
                          </div>
                          <p className="font-medium text-sm mt-1">{stage.name}</p>
                          {stage.touchpoint && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              接触点: {stage.touchpoint}
                            </p>
                          )}
                        </div>
                      </div>
                      {isEditing && (
                        <div className="flex items-center gap-1 mt-2 pl-11">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveStage(stage.id, "up");
                            }}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveStage(stage.id, "down");
                            }}
                            disabled={index === (formData.stages?.length || 0) - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <GripVertical className="h-4 w-4 text-muted-foreground ml-1" />
                          <div className="flex-1" />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStage(stage.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {selectedJourney || isEditing ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <Input
                        value={formData.persona || ""}
                        onChange={(e) => setFormData({ ...formData, persona: e.target.value })}
                        placeholder="输入用户画像"
                        className="text-lg font-semibold h-10"
                      />
                    ) : (
                      <h2 className="text-xl font-bold truncate">{formData.persona}</h2>
                    )}
                  </div>
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
                        onClick={() => selectedJourney?.id && handleDelete(selectedJourney.id)}
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

              <div className="flex-1 overflow-hidden flex flex-col gap-4">
                <Card className="shrink-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      基本信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>旅程目标</Label>
                      {isEditing ? (
                        <Textarea
                          value={formData.goal || ""}
                          onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                          placeholder="描述用户想要达成的目标"
                          className="resize-none min-h-[60px]"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{formData.goal || "暂无目标"}</p>
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
                                  {tag} ×
                                </Badge>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {formData.tags && formData.tags.length > 0 ? (
                            formData.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                <Tag className="mr-1 h-3 w-3" />
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">暂无标签</span>
                          )}
                        </div>
                      )}
                    </div>
                    {!isEditing && selectedJourney && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          创建于 {formatDate(selectedJourney.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          更新于 {formatDate(selectedJourney.updatedAt)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="flex-1 overflow-hidden flex flex-col">
                  <CardHeader className="pb-3 shrink-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Map className="h-4 w-4" />
                      阶段详情
                      {selectedStage && (
                        <Badge variant="outline" className="ml-2 font-normal">
                          {selectedStage.name}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    {!selectedStage ? (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <GripVertical className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">选择左侧阶段查看详情</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-full pr-2">
                        <div className="space-y-4 pb-4">
                          <div className="space-y-2">
                            <Label>阶段名称</Label>
                            {isEditing ? (
                              <Input
                                value={selectedStage.name}
                                onChange={(e) =>
                                  handleUpdateStage(selectedStage.id, { name: e.target.value })
                                }
                                placeholder="输入阶段名称"
                              />
                            ) : (
                              <p className="font-medium">{selectedStage.name}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>情绪</Label>
                            {isEditing ? (
                              <div className="flex gap-2">
                                {(["happy", "neutral", "sad"] as const).map((emotion) => {
                                  const { icon: Icon, label, color, bg } = emotionMap[emotion];
                                  return (
                                    <button
                                      key={emotion}
                                      onClick={() =>
                                        handleUpdateStage(selectedStage.id, { emotion })
                                      }
                                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                                        selectedStage.emotion === emotion
                                          ? `${bg} border-primary`
                                          : "hover:border-primary/50"
                                      }`}
                                    >
                                      <Icon className={color} style={{ width: 18, height: 18 }} />
                                      <span className="text-sm">{label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <EmotionIcon emotion={selectedStage.emotion} size={18} />
                                <span className="text-sm">
                                  {emotionMap[selectedStage.emotion].label}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>接触点</Label>
                            {isEditing ? (
                              <Input
                                value={selectedStage.touchpoint}
                                onChange={(e) =>
                                  handleUpdateStage(selectedStage.id, {
                                    touchpoint: e.target.value,
                                  })
                                }
                                placeholder="用户在这个阶段的接触点"
                              />
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {selectedStage.touchpoint || "暂无"}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>阶段描述</Label>
                            {isEditing ? (
                              <Textarea
                                value={selectedStage.description}
                                onChange={(e) =>
                                  handleUpdateStage(selectedStage.id, {
                                    description: e.target.value,
                                  })
                                }
                                placeholder="描述这个阶段用户的行为和体验"
                                className="resize-none min-h-[80px]"
                              />
                            ) : (
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {selectedStage.description || "暂无描述"}
                              </p>
                            )}
                          </div>

                          <Separator />

                          <div className="space-y-2">
                            <Label className="text-red-500">痛点</Label>
                            {isEditing ? (
                              <Textarea
                                value={selectedStage.painPoints}
                                onChange={(e) =>
                                  handleUpdateStage(selectedStage.id, {
                                    painPoints: e.target.value,
                                  })
                                }
                                placeholder="用户在这个阶段遇到的问题和痛点"
                                className="resize-none min-h-[80px]"
                              />
                            ) : (
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {selectedStage.painPoints || "暂无"}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-green-500">机会点</Label>
                            {isEditing ? (
                              <Textarea
                                value={selectedStage.opportunities}
                                onChange={(e) =>
                                  handleUpdateStage(selectedStage.id, {
                                    opportunities: e.target.value,
                                  })
                                }
                                placeholder="可以优化和改进的机会点"
                                className="resize-none min-h-[80px]"
                              />
                            ) : (
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {selectedStage.opportunities || "暂无"}
                              </p>
                            )}
                          </div>
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Map className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">选择或创建用户旅程</h3>
              <p className="text-sm text-muted-foreground mt-1">
                可视化用户体验旅程，识别痛点和机会点
              </p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                新建旅程
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
