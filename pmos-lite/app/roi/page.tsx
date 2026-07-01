"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  DollarSign,
  Clock,
  Users,
  BarChart3,
  PieChart,
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
import type { RoiCalculation } from "@/types";
import { AIGenerateBar } from "@/components/ai-generate-bar";
import { generateROI } from "@/lib/ai-service";

export default function RoiPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedRoi, setSelectedRoi] = React.useState<RoiCalculation | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>("cost");
  const [formData, setFormData] = React.useState<Partial<RoiCalculation>>({
    name: "",
    description: "",
    developmentCost: 0,
    operationCost: 0,
    expectedRevenue: 0,
    timeSaved: 0,
    userGrowth: 0,
    period: 12,
    roi: 0,
    paybackPeriod: 0,
    tags: [],
  });
  const { toast } = useToast();

  const roiCalculations = useLiveQuery(
    () => db.roiCalculations.orderBy("updatedAt").reverse().toArray(),
    [],
    []
  );

  const filteredCalculations = React.useMemo(
    () =>
      roiCalculations.filter(
        (r) =>
          !searchQuery ||
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    [roiCalculations, searchQuery]
  );

  const timeSavedValue = React.useMemo(() => {
    return (formData.timeSaved || 0) * 200 * 12;
  }, [formData.timeSaved]);

  const userGrowthValue = React.useMemo(() => {
    return (formData.userGrowth || 0) / 100 * (formData.expectedRevenue || 0);
  }, [formData.userGrowth, formData.expectedRevenue]);

  const totalRevenue = React.useMemo(() => {
    return (formData.expectedRevenue || 0) + timeSavedValue + userGrowthValue;
  }, [formData.expectedRevenue, timeSavedValue, userGrowthValue]);

  const totalCost = React.useMemo(() => {
    return (formData.developmentCost || 0) + (formData.operationCost || 0) * (formData.period || 0) / 12;
  }, [formData.developmentCost, formData.operationCost, formData.period]);

  const calculatedRoi = React.useMemo(() => {
    if (totalCost === 0) return 0;
    return ((totalRevenue - totalCost) / totalCost) * 100;
  }, [totalRevenue, totalCost]);

  const calculatedPaybackPeriod = React.useMemo(() => {
    const monthlyNetBenefit = (totalRevenue - (formData.operationCost || 0)) / (formData.period || 12);
    if (monthlyNetBenefit <= 0) return -1;
    return (formData.developmentCost || 0) / monthlyNetBenefit;
  }, [totalRevenue, formData.operationCost, formData.period, formData.developmentCost]);

  const handleCreate = () => {
    setSelectedRoi(null);
    setIsEditing(true);
    setActiveTab("cost");
    setFormData({
      name: "",
      description: "",
      developmentCost: 0,
      operationCost: 0,
      expectedRevenue: 0,
      timeSaved: 0,
      userGrowth: 0,
      period: 12,
      roi: 0,
      paybackPeriod: 0,
      tags: [],
    });
  };

  const handleSelect = (roi: RoiCalculation) => {
    setSelectedRoi(roi);
    setIsEditing(false);
    setActiveTab("cost");
    setFormData(roi);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast({ message: "请输入ROI计算名称", type: "error" });
      return;
    }

    const now = new Date();
    const roiData = {
      ...formData,
      roi: Number(calculatedRoi.toFixed(2)),
      paybackPeriod: Number(calculatedPaybackPeriod.toFixed(2)),
    };

    if (selectedRoi?.id) {
      await db.roiCalculations.update(selectedRoi.id, {
        ...roiData,
        updatedAt: now,
      });
      await db.addRecentEdit("roi", selectedRoi.id, formData.name!);
      toast({ message: "ROI计算已保存", type: "success" });
      const updated = await db.roiCalculations.get(selectedRoi.id);
      if (updated) setSelectedRoi(updated);
    } else {
      const id = await db.roiCalculations.add({
        name: formData.name!,
        description: formData.description || "",
        developmentCost: formData.developmentCost || 0,
        operationCost: formData.operationCost || 0,
        expectedRevenue: formData.expectedRevenue || 0,
        timeSaved: formData.timeSaved || 0,
        userGrowth: formData.userGrowth || 0,
        period: formData.period || 12,
        roi: Number(calculatedRoi.toFixed(2)),
        paybackPeriod: Number(calculatedPaybackPeriod.toFixed(2)),
        tags: formData.tags || [],
        createdAt: now,
        updatedAt: now,
      });
      await db.addRecentEdit("roi", id, formData.name!);
      toast({ message: "ROI计算已创建", type: "success" });
      const created = await db.roiCalculations.get(id);
      if (created) setSelectedRoi(created);
    }
    setIsEditing(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个ROI计算吗？")) return;
    await db.roiCalculations.delete(id);
    if (selectedRoi?.id === id) {
      setSelectedRoi(null);
      setIsEditing(false);
    }
    toast({ message: "ROI计算已删除", type: "success" });
  };

  const handleInputChange = (field: keyof RoiCalculation, value: string | number) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const getRoiBadgeClass = (roi: number) => {
    if (roi >= 0) {
      return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
    }
    return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const costBreakdown = React.useMemo(() => {
    const devCost = formData.developmentCost || 0;
    const opCost = (formData.operationCost || 0) * (formData.period || 0) / 12;
    const total = devCost + opCost;
    if (total === 0) return { devPercent: 50, opPercent: 50 };
    return {
      devPercent: (devCost / total) * 100,
      opPercent: (opCost / total) * 100,
    };
  }, [formData.developmentCost, formData.operationCost, formData.period]);

  const revenueBreakdown = React.useMemo(() => {
    const expRev = formData.expectedRevenue || 0;
    const timeRev = timeSavedValue;
    const growthRev = userGrowthValue;
    const total = expRev + timeRev + growthRev;
    if (total === 0) return { expPercent: 33, timePercent: 33, growthPercent: 34 };
    return {
      expPercent: (expRev / total) * 100,
      timePercent: (timeRev / total) * 100,
      growthPercent: (growthRev / total) * 100,
    };
  }, [formData.expectedRevenue, timeSavedValue, userGrowthValue]);

  return (
    <AppLayout title="ROI投资回报率">
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        <div className="w-72 shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索ROI计算..."
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
              {filteredCalculations.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  暂无ROI计算记录
                </div>
              ) : (
                filteredCalculations.map((roi) => (
                  <div
                    key={roi.id}
                    onClick={() => handleSelect(roi)}
                    className={`cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/50 ${
                      selectedRoi?.id === roi.id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{roi.name}</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-xs shrink-0 ${getRoiBadgeClass(roi.roi)}`}
                      >
                        {roi.roi >= 0 ? "+" : ""}{roi.roi.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        回收周期：{roi.paybackPeriod > 0 ? `${roi.paybackPeriod.toFixed(1)}个月` : "无法回收"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(roi.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {selectedRoi || isEditing ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <Input
                      value={formData.name || ""}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="输入ROI计算名称"
                      className="text-lg font-semibold h-10 w-64"
                    />
                  ) : (
                    <h2 className="text-xl font-bold">{formData.name}</h2>
                  )}
                  <Badge
                    variant="secondary"
                    className={getRoiBadgeClass(formData.roi || calculatedRoi)}
                  >
                    {(formData.roi || calculatedRoi) >= 0 ? "+" : ""}
                    {(formData.roi || calculatedRoi).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectedRoi?.id && handleDelete(selectedRoi.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </Button>
                    </>
                  ) : (
                    <>
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
                  <AIGenerateBar
                    placeholder="输入项目描述，AI 自动估算开发成本、运营成本、预期收益并计算 ROI..."
                    buttonLabel="AI 估算 ROI"
                    examples={["搭建用户积分商城", "上线 AI 智能客服", "重构推荐算法"]}
                    onGenerate={(input) => generateROI(input)}
                    onGenerated={(data, input) =>
                      setFormData((prev) => ({
                        ...prev,
                        ...data,
                        name: data.name || prev.name || `${input} - ROI分析`,
                      }))
                    }
                  />
                </div>
              )}

              {isEditing && (
                <div className="mb-4">
                  <Label>描述</Label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="输入项目描述..."
                    rows={2}
                    className="mt-1 resize-none"
                  />
                </div>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList>
                  <TabsTrigger value="cost">
                    <DollarSign className="mr-2 h-4 w-4" />
                    成本收益
                  </TabsTrigger>
                  <TabsTrigger value="result">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    计算结果
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cost" className="flex-1 mt-4 overflow-hidden">
                  <ScrollArea className="h-full pr-4">
                    <div className="grid grid-cols-2 gap-6 pb-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            成本投入
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>开发成本（元）</Label>
                            <Input
                              type="number"
                              value={formData.developmentCost || 0}
                              onChange={(e) => handleInputChange("developmentCost", Number(e.target.value))}
                              readOnly={!isEditing}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>运营成本（元/年）</Label>
                            <Input
                              type="number"
                              value={formData.operationCost || 0}
                              onChange={(e) => handleInputChange("operationCost", Number(e.target.value))}
                              readOnly={!isEditing}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>计算周期（月）</Label>
                            <Input
                              type="number"
                              value={formData.period || 12}
                              onChange={(e) => handleInputChange("period", Number(e.target.value))}
                              readOnly={!isEditing}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            预期收益
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>预期收益（元/年）</Label>
                            <Input
                              type="number"
                              value={formData.expectedRevenue || 0}
                              onChange={(e) => handleInputChange("expectedRevenue", Number(e.target.value))}
                              readOnly={!isEditing}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              节省时间（小时/月）
                            </Label>
                            <Input
                              type="number"
                              value={formData.timeSaved || 0}
                              onChange={(e) => handleInputChange("timeSaved", Number(e.target.value))}
                              readOnly={!isEditing}
                            />
                            <p className="text-xs text-muted-foreground">
                              按 200元/小时 折算，年价值：{formatCurrency(timeSavedValue)}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              用户增长（%）
                            </Label>
                            <Input
                              type="number"
                              value={formData.userGrowth || 0}
                              onChange={(e) => handleInputChange("userGrowth", Number(e.target.value))}
                              readOnly={!isEditing}
                            />
                            <p className="text-xs text-muted-foreground">
                              折算年增收：{formatCurrency(userGrowthValue)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="result" className="flex-1 mt-4 overflow-hidden">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-6 pb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Card className={`border-2 ${
                          (formData.roi || calculatedRoi) >= 0
                            ? "border-green-200 dark:border-green-800"
                            : "border-red-200 dark:border-red-800"
                        }`}>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">投资回报率 (ROI)</p>
                                <p className={`text-4xl font-bold mt-2 ${
                                  (formData.roi || calculatedRoi) >= 0
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}>
                                  {(formData.roi || calculatedRoi) >= 0 ? "+" : ""}
                                  {(formData.roi || calculatedRoi).toFixed(1)}%
                                </p>
                              </div>
                              <div className={`p-3 rounded-full ${
                                (formData.roi || calculatedRoi) >= 0
                                  ? "bg-green-100 dark:bg-green-900"
                                  : "bg-red-100 dark:bg-red-900"
                              }`}>
                                {(formData.roi || calculatedRoi) >= 0 ? (
                                  <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                                ) : (
                                  <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-2 border-blue-200 dark:border-blue-800">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">投资回收期</p>
                                <p className="text-4xl font-bold mt-2 text-blue-600 dark:text-blue-400">
                                  {(formData.paybackPeriod || calculatedPaybackPeriod) > 0
                                    ? `${(formData.paybackPeriod || calculatedPaybackPeriod).toFixed(1)}个月`
                                    : "无法回收"}
                                </p>
                              </div>
                              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                                <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <PieChart className="h-4 w-4" />
                              成本构成
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>开发成本</span>
                                <span>{formatCurrency(formData.developmentCost || 0)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>运营成本（{formData.period || 12}个月）</span>
                                <span>{formatCurrency((formData.operationCost || 0) * (formData.period || 0) / 12)}</span>
                              </div>
                              <div className="flex justify-between text-sm font-medium pt-2 border-t">
                                <span>总成本</span>
                                <span>{formatCurrency(totalCost)}</span>
                              </div>
                            </div>
                            <div className="h-4 w-full rounded-full overflow-hidden bg-muted flex">
                              <div
                                className="bg-orange-500 h-full transition-all"
                                style={{ width: `${costBreakdown.devPercent}%` }}
                              />
                              <div
                                className="bg-amber-500 h-full transition-all"
                                style={{ width: `${costBreakdown.opPercent}%` }}
                              />
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-sm bg-orange-500" />
                                <span>开发 {costBreakdown.devPercent.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-sm bg-amber-500" />
                                <span>运营 {costBreakdown.opPercent.toFixed(1)}%</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <PieChart className="h-4 w-4" />
                              收益构成
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>预期收益</span>
                                <span>{formatCurrency(formData.expectedRevenue || 0)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>节省时间价值</span>
                                <span>{formatCurrency(timeSavedValue)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>用户增长增收</span>
                                <span>{formatCurrency(userGrowthValue)}</span>
                              </div>
                              <div className="flex justify-between text-sm font-medium pt-2 border-t">
                                <span>总收益</span>
                                <span>{formatCurrency(totalRevenue)}</span>
                              </div>
                            </div>
                            <div className="h-4 w-full rounded-full overflow-hidden bg-muted flex">
                              <div
                                className="bg-green-500 h-full transition-all"
                                style={{ width: `${revenueBreakdown.expPercent}%` }}
                              />
                              <div
                                className="bg-emerald-500 h-full transition-all"
                                style={{ width: `${revenueBreakdown.timePercent}%` }}
                              />
                              <div
                                className="bg-teal-500 h-full transition-all"
                                style={{ width: `${revenueBreakdown.growthPercent}%` }}
                              />
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-sm bg-green-500" />
                                <span>预期收益 {revenueBreakdown.expPercent.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                                <span>时间价值 {revenueBreakdown.timePercent.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-sm bg-teal-500" />
                                <span>用户增长 {revenueBreakdown.growthPercent.toFixed(1)}%</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            收益趋势说明
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                (formData.roi || calculatedRoi) >= 0
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`} />
                              <div>
                                <p className="font-medium">
                                  {(formData.roi || calculatedRoi) >= 0
                                    ? "项目盈利，值得投资"
                                    : "项目亏损，建议谨慎投资"}
                                </p>
                                <p className="text-muted-foreground mt-1">
                                  在 {formData.period || 12} 个月的计算周期内，
                                  总投入 {formatCurrency(totalCost)}，
                                  总收益 {formatCurrency(totalRevenue)}，
                                  净收益 {formatCurrency(totalRevenue - totalCost)}。
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-blue-500" />
                              <div>
                                <p className="font-medium">
                                  {(formData.paybackPeriod || calculatedPaybackPeriod) > 0
                                    ? `预计 ${(formData.paybackPeriod || calculatedPaybackPeriod).toFixed(1)} 个月收回开发成本`
                                    : "无法在计算周期内收回开发成本"}
                                </p>
                                <p className="text-muted-foreground mt-1">
                                  月均净收益约 {formatCurrency((totalRevenue - (formData.operationCost || 0)) / (formData.period || 12))}，
                                  开发成本 {formatCurrency(formData.developmentCost || 0)}。
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-purple-500" />
                              <div>
                                <p className="font-medium">收益构成分析</p>
                                <p className="text-muted-foreground mt-1">
                                  预期收益占比 {revenueBreakdown.expPercent.toFixed(1)}%，
                                  节省时间价值占比 {revenueBreakdown.timePercent.toFixed(1)}%，
                                  用户增长增收占比 {revenueBreakdown.growthPercent.toFixed(1)}%。
                                  {timeSavedValue > (formData.expectedRevenue || 0) ? (
                                    " 节省时间是主要收益来源，建议重点关注效率提升。"
                                  ) : userGrowthValue > (formData.expectedRevenue || 0) ? (
                                    " 用户增长是主要收益来源，建议重点关注增长策略。"
                                  ) : (
                                    " 直接收益是主要来源，建议持续优化营收模式。"
                                  )}
                                </p>
                              </div>
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
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">选择或创建ROI计算</h3>
              <p className="text-sm text-muted-foreground mt-1">
                从左侧选择，或创建一个新的ROI投资回报率计算
              </p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                新建ROI计算
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
