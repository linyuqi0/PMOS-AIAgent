"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  TestTube,
  Plus,
  Search,
  Trash2,
  Save,
  Sparkles,
  Download,
  CheckCircle,
  AlertCircle,
  Shield,
  Monitor,
  List,
  Filter,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { formatDate, downloadFile } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { TestCase } from "@/types";
import { AIGenerateBar } from "@/components/ai-generate-bar";
import { generateTestCases } from "@/lib/ai-service";

const typeConfig: Record<TestCase["type"], { label: string; icon: any; color: string; bg: string }> = {
  normal: { label: "正常流程", icon: CheckCircle, color: "text-green-600", bg: "bg-green-100 dark:bg-green-950" },
  exception: { label: "异常流程", icon: AlertCircle, color: "text-red-600", bg: "bg-red-100 dark:bg-red-950" },
  boundary: { label: "边界场景", icon: Filter, color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-950" },
  permission: { label: "权限场景", icon: Shield, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-950" },
  compatibility: { label: "兼容场景", icon: Monitor, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950" },
};

const priorityConfig: Record<TestCase["priority"], { label: string; color: string }> = {
  high: { label: "高", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  medium: { label: "中", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300" },
  low: { label: "低", color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
};

export default function TestCasesPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCase, setSelectedCase] = React.useState<TestCase | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [activeType, setActiveType] = React.useState<"all" | TestCase["type"]>("all");
  const [genInput, setGenInput] = React.useState("");
  const [formData, setFormData] = React.useState<Partial<TestCase>>({
    title: "",
    type: "normal",
    description: "",
    steps: "",
    expected: "",
    priority: "medium",
    status: "active",
  });
  const { toast } = useToast();

  const testCases = useLiveQuery(
    () => db.testCases.orderBy("updatedAt").reverse().toArray(),
    [],
    []
  );

  const filteredCases = React.useMemo(() => {
    return testCases.filter((c) => {
      const matchType = activeType === "all" || c.type === activeType;
      const matchSearch =
        !searchQuery ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [testCases, searchQuery, activeType]);

  const stats = React.useMemo(() => {
    const total = testCases.length;
    const byType: Record<string, number> = {};
    testCases.forEach((c) => {
      byType[c.type] = (byType[c.type] || 0) + 1;
    });
    return { total, byType };
  }, [testCases]);

  const handleCreate = (type?: TestCase["type"]) => {
    setSelectedCase(null);
    setIsEditing(true);
    setFormData({
      title: "",
      type: type || "normal",
      description: "",
      steps: "",
      expected: "",
      priority: "medium",
      status: "active",
    });
  };

  const handleSelect = (tc: TestCase) => {
    setSelectedCase(tc);
    setIsEditing(false);
    setFormData(tc);
  };

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      toast({ message: "请输入用例标题", type: "error" });
      return;
    }

    const now = new Date();
    if (selectedCase?.id) {
      await db.testCases.update(selectedCase.id, {
        ...formData,
        updatedAt: now,
      });
      await db.addRecentEdit("testcase", selectedCase.id, formData.title!);
      toast({ message: "用例已保存", type: "success" });
      const updated = await db.testCases.get(selectedCase.id);
      if (updated) setSelectedCase(updated);
    } else {
      const id = await db.testCases.add({
        title: formData.title!,
        type: formData.type || "normal",
        description: formData.description || "",
        steps: formData.steps || "",
        expected: formData.expected || "",
        priority: formData.priority || "medium",
        status: formData.status || "active",
        createdAt: now,
        updatedAt: now,
      });
      await db.addRecentEdit("testcase", id, formData.title!);
      toast({ message: "用例已创建", type: "success" });
      const created = await db.testCases.get(id);
      if (created) setSelectedCase(created);
    }
    setIsEditing(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个测试用例吗？")) return;
    await db.testCases.delete(id);
    if (selectedCase?.id === id) {
      setSelectedCase(null);
      setIsEditing(false);
    }
    toast({ message: "用例已删除", type: "success" });
  };

  const handleGenerate = () => {
    if (!genInput.trim()) {
      toast({ message: "请输入功能描述", type: "error" });
      return;
    }

    const templates = {
      normal: [
        {
          title: "正常登录流程",
          steps: "1. 打开登录页面\n2. 输入正确的用户名和密码\n3. 点击登录按钮",
          expected: "成功登录，跳转到首页，显示用户信息",
        },
        {
          title: "正常提交表单",
          steps: "1. 填写表单所有必填项\n2. 点击提交按钮\n3. 等待处理完成",
          expected: "表单提交成功，显示成功提示，数据正确保存",
        },
      ],
      exception: [
        {
          title: "用户名或密码错误",
          steps: "1. 打开登录页面\n2. 输入错误的用户名或密码\n3. 点击登录按钮",
          expected: "登录失败，显示错误提示信息，用户可重新输入",
        },
        {
          title: "必填项为空提交",
          steps: "1. 不填写必填项\n2. 直接点击提交按钮",
          expected: "提交失败，对应字段显示错误提示，无法提交",
        },
      ],
      boundary: [
        {
          title: "输入字符数达到上限",
          steps: "1. 在输入框输入最大长度字符\n2. 继续输入更多字符",
          expected: "无法继续输入，达到最大长度限制",
        },
        {
          title: "分页边界测试",
          steps: "1. 查看列表最后一页\n2. 点击下一页",
          expected: "保持在最后一页，显示正确提示",
        },
      ],
      permission: [
        {
          title: "未登录访问受限页面",
          steps: "1. 未登录状态\n2. 直接访问需要登录的页面URL",
          expected: "跳转到登录页，或显示无权限提示",
        },
        {
          title: "普通用户访问管理员功能",
          steps: "1. 使用普通用户账号登录\n2. 尝试访问管理员专属功能",
          expected: "无法访问，显示无权限提示",
        },
      ],
      compatibility: [
        {
          title: "主流浏览器兼容性",
          steps: "1. 在Chrome浏览器打开页面\n2. 在Safari浏览器打开页面\n3. 在Firefox浏览器打开页面",
          expected: "各浏览器下页面显示正常，功能可用",
        },
        {
          title: "移动端适配",
          steps: "1. 使用手机浏览器访问\n2. 查看各页面布局\n3. 测试核心功能",
          expected: "移动端布局适配良好，核心功能正常使用",
        },
      ],
    };

    const allTypes: TestCase["type"][] = ["normal", "exception", "boundary", "permission", "compatibility"];
    const now = new Date();
    let count = 0;

    allTypes.forEach(async (type) => {
      const typeTemplates = templates[type] || [];
      typeTemplates.forEach(async (tpl) => {
        await db.testCases.add({
          title: `${genInput.slice(0, 10)} - ${tpl.title}`,
          type,
          description: `针对「${genInput}」的${typeConfig[type].label}测试`,
          steps: tpl.steps,
          expected: tpl.expected,
          priority: type === "normal" ? "high" : type === "exception" ? "high" : "medium",
          status: "active",
          createdAt: now,
          updatedAt: now,
        });
        count++;
      });
    });

    toast({ message: `已生成 ${count} 条测试用例`, type: "success" });
    setGenInput("");
  };

  const handleExport = () => {
    let doc = "# 测试用例文档\n\n";
    doc += `> 生成时间：${new Date().toLocaleString("zh-CN")}\n\n`;
    doc += `共 ${testCases.length} 条测试用例\n\n`;

    const types: TestCase["type"][] = ["normal", "exception", "boundary", "permission", "compatibility"];
    types.forEach((type) => {
      const cases = testCases.filter((c) => c.type === type);
      if (cases.length === 0) return;

      doc += `## ${typeConfig[type].label} (${cases.length})\n\n`;
      doc += `| 用例标题 | 优先级 | 前置条件 | 测试步骤 | 预期结果 |\n`;
      doc += `|---------|--------|---------|---------|---------|\n`;
      cases.forEach((c) => {
        doc += `| ${c.title} | ${priorityConfig[c.priority].label} | ${c.description || "-"} | ${c.steps.replace(/\n/g, "<br/>")} | ${c.expected.replace(/\n/g, "<br/>")} |\n`;
      });
      doc += `\n`;
    });

    downloadFile(doc, "测试用例文档.md", "text/markdown");
    toast({ message: "用例已导出", type: "success" });
  };

  return (
    <AppLayout title="测试用例生成器">
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        <div className="w-80 shrink-0 flex flex-col gap-4">
          <AIGenerateBar
            placeholder="输入功能描述，AI 批量生成测试用例（正常/异常/边界/权限/兼容）..."
            buttonLabel="AI 生成用例"
            examples={["用户登录功能", "购物车结算", "内容审核流程"]}
            onGenerate={(input) => generateTestCases(input)}
            onGenerated={async (data, _input) => {
              await Promise.all(data.map((t: any) => db.testCases.add(t)));
              toast({ message: `已生成 ${data.length} 条测试用例`, type: "success" });
            }}
          />
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索用例..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => handleCreate()} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1">
            <Button
              variant={activeType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveType("all")}
              className="h-7 text-xs"
            >
              全部 {stats.total}
            </Button>
            {(Object.keys(typeConfig) as TestCase["type"][]).map((type) => (
              <Button
                key={type}
                variant={activeType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveType(type)}
                className="h-7 text-xs"
              >
                {typeConfig[type].label} {stats.byType[type] || 0}
              </Button>
            ))}
          </div>

          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-2">
              {filteredCases.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  暂无测试用例
                </div>
              ) : (
                filteredCases.map((tc) => (
                  <div
                    key={tc.id}
                    onClick={() => handleSelect(tc)}
                    className={`cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/50 ${
                      selectedCase?.id === tc.id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <div className={`p-1.5 rounded ${typeConfig[tc.type].bg}`}>
                        {React.createElement(typeConfig[tc.type].icon, {
                          className: `h-3.5 w-3.5 ${typeConfig[tc.type].color}`,
                        })}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{tc.title}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Badge
                            className={`text-xs ${priorityConfig[tc.priority].color}`}
                            variant="secondary"
                          >
                            P{priorityConfig[tc.priority].label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(tc.updatedAt)}
                          </span>
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
          {selectedCase || isEditing ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <Input
                      value={formData.title || ""}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="输入用例标题"
                      className="text-lg font-semibold h-10 w-96"
                    />
                  ) : (
                    <h2 className="text-xl font-bold">{formData.title}</h2>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        导出
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectedCase?.id && handleDelete(selectedCase.id)}
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
                <div className="mb-4 grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>用例类型</Label>
                    <Select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as TestCase["type"],
                        })
                      }
                    >
                      {(Object.keys(typeConfig) as TestCase["type"][]).map((t) => (
                        <option key={t} value={t}>
                          {typeConfig[t].label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>优先级</Label>
                    <Select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: e.target.value as TestCase["priority"],
                        })
                      }
                    >
                      <option value="high">高</option>
                      <option value="medium">中</option>
                      <option value="low">低</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>状态</Label>
                    <Select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as TestCase["status"],
                        })
                      }
                    >
                      <option value="active">启用</option>
                      <option value="draft">草稿</option>
                    </Select>
                  </div>
                </div>
              )}

              <Tabs defaultValue="detail" className="flex-1 flex flex-col">
                <TabsList>
                  <TabsTrigger value="detail">用例详情</TabsTrigger>
                  <TabsTrigger value="generate">批量生成</TabsTrigger>
                </TabsList>

                <TabsContent value="detail" className="flex-1 mt-4 overflow-hidden">
                  <ScrollArea className="h-full pr-4 -mr-4">
                    <div className="space-y-6 pb-8">
                      <div>
                        <Label className="text-sm font-medium">前置条件 / 描述</Label>
                        {isEditing ? (
                          <Textarea
                            value={formData.description || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, description: e.target.value })
                            }
                            placeholder="描述测试的前置条件..."
                            className="mt-2"
                            rows={3}
                          />
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                            {formData.description || "暂无描述"}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium">测试步骤</Label>
                        {isEditing ? (
                          <Textarea
                            value={formData.steps || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, steps: e.target.value })
                            }
                            placeholder="1. 步骤一&#10;2. 步骤二&#10;3. 步骤三"
                            className="mt-2 font-mono text-sm"
                            rows={8}
                          />
                        ) : (
                          <div className="mt-2 rounded-lg border bg-muted/30 p-4">
                            <pre className="text-sm whitespace-pre-wrap">
                              {formData.steps || "暂无步骤"}
                            </pre>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium">预期结果</Label>
                        {isEditing ? (
                          <Textarea
                            value={formData.expected || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, expected: e.target.value })
                            }
                            placeholder="描述预期结果..."
                            className="mt-2"
                            rows={5}
                          />
                        ) : (
                          <div className="mt-2 rounded-lg border bg-muted/30 p-4">
                            <pre className="text-sm whitespace-pre-wrap">
                              {formData.expected || "暂无预期结果"}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="generate" className="flex-1 mt-4 overflow-hidden">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">智能生成测试用例</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>功能描述</Label>
                            <Textarea
                              value={genInput}
                              onChange={(e) => setGenInput(e.target.value)}
                              placeholder="输入功能描述，自动生成各类测试用例..."
                              rows={4}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            将自动生成：正常流程、异常流程、边界场景、权限场景、兼容场景 共 10+ 条用例
                          </p>
                          <Button onClick={handleGenerate}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            生成用例
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-5 gap-3">
                      {(Object.keys(typeConfig) as TestCase["type"][]).map((type) => (
                        <Card key={type} className="cursor-pointer hover:border-primary/50" onClick={() => handleCreate(type)}>
                          <CardContent className="p-4 text-center">
                            <div className={`inline-flex p-2 rounded-lg ${typeConfig[type].bg} mb-2`}>
                              {React.createElement(typeConfig[type].icon, {
                                className: `h-5 w-5 ${typeConfig[type].color}`,
                              })}
                            </div>
                            <p className="text-sm font-medium">{typeConfig[type].label}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {stats.byType[type] || 0} 条
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <TestTube className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">选择或创建测试用例</h3>
              <p className="text-sm text-muted-foreground mt-1">
                输入功能描述，一键生成全场景测试用例
              </p>
              <Button onClick={() => handleCreate()} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                新建用例
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
