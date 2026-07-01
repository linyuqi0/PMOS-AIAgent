"use client";

import * as React from "react";
import {
  Settings,
  Download,
  Upload,
  Database,
  Moon,
  Sun,
  Info,
  Shield,
  HardDrive,
  RotateCcw,
  Sparkles,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";
import { db } from "@/lib/db";
import { useToast } from "@/components/ui/toast";
import { getAIConfig, setAIConfig, isAIEnabled, type AIConfig } from "@/lib/ai-service";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [dbStats, setDbStats] = React.useState<Record<string, number>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // AI 配置
  const [aiConfig, setAiConfig] = React.useState<AIConfig>({
    enabled: false,
    apiKey: "",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-3.5-turbo",
  });
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<"idle" | "success" | "error">("idle");

  React.useEffect(() => {
    loadDbStats();
    setAiConfig(getAIConfig());
  }, []);

  const loadDbStats = async () => {
    const stats: Record<string, number> = {};
    const tables = [
      "projects", "prds", "requirements", "sqlQueries", "trackingEvents",
      "testCases", "knowledgeDocs", "prompts", "userStories", "competitors",
      "kanoItems", "priorityItems", "userJourneys", "roiCalculations",
    ];
    for (const table of tables) {
      stats[table] = await (db as any)[table].count();
    }
    setDbStats(stats);
  };

  const handleSaveAIConfig = () => {
    setAIConfig(aiConfig);
    toast({
      message: aiConfig.enabled ? "AI 配置已保存并启用" : "AI 配置已保存（未启用）",
      type: "success",
    });
  };

  const handleToggleAI = () => {
    const newConfig = { ...aiConfig, enabled: !aiConfig.enabled };
    setAiConfig(newConfig);
    setAIConfig({ enabled: newConfig.enabled });
    toast({
      message: newConfig.enabled ? "AI 已启用" : "AI 已关闭，将使用模板模式",
      type: "success",
    });
  };

  const handleTestConnection = async () => {
    if (!aiConfig.apiKey) {
      toast({ message: "请先填写 API Key", type: "error" });
      return;
    }
    setTesting(true);
    setTestResult("idle");
    try {
      // 先临时保存配置，再测试
      setAIConfig({ ...aiConfig, enabled: true });
      const response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 5,
        }),
      });
      if (response.ok) {
        setTestResult("success");
        toast({ message: "连接测试成功", type: "success" });
      } else {
        setTestResult("error");
        toast({ message: `连接失败：HTTP ${response.status}`, type: "error" });
      }
    } catch (e: any) {
      setTestResult("error");
      toast({ message: e?.message || "连接失败", type: "error" });
    } finally {
      setTesting(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await db.exportData();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pmos-lite-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ message: "数据导出成功", type: "success" });
    } catch (err) {
      toast({ message: "导出失败", type: "error" });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("导入数据会合并到现有数据中，确定继续吗？")) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const text = await file.text();
      await db.importData(text);
      toast({ message: "数据导入成功", type: "success" });
      loadDbStats();
    } catch (err) {
      toast({ message: "导入失败：文件格式错误", type: "error" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearData = async () => {
    if (!confirm("确定要清空所有数据吗？此操作不可恢复！")) return;
    if (!confirm("再次确认：所有数据将被永久删除，是否继续？")) return;

    try {
      await db.transaction("rw", db.tables, async () => {
        for (const table of db.tables) {
          await table.clear();
        }
      });
      toast({ message: "数据已清空", type: "success" });
      loadDbStats();
    } catch (err) {
      toast({ message: "清空失败", type: "error" });
    }
  };

  const tableLabels: Record<string, string> = {
    projects: "项目",
    prds: "PRD文档",
    requirements: "需求分析",
    sqlQueries: "SQL查询",
    trackingEvents: "埋点事件",
    testCases: "测试用例",
    knowledgeDocs: "知识库文档",
    prompts: "Prompt模板",
    userStories: "用户故事",
    competitors: "竞品分析",
    kanoItems: "KANO模型",
    priorityItems: "优先级",
    userJourneys: "用户旅程",
    roiCalculations: "ROI计算",
  };

  return (
    <AppLayout title="设置">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              AI 智能生成配置
            </CardTitle>
            <CardDescription>
              配置 OpenAI 兼容 API，启用后所有工具支持 AI 一键生成。未配置时自动回退到模板模式。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
              <div>
                <p className="text-sm font-medium">启用 AI 生成</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  关闭后将使用内置模板生成内容
                </p>
              </div>
              <Button
                variant={aiConfig.enabled ? "default" : "outline"}
                size="sm"
                onClick={handleToggleAI}
              >
                {aiConfig.enabled ? "已启用" : "已关闭"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="sk-..."
                    value={aiConfig.apiKey}
                    onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {testResult === "success" && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 self-center" />
                )}
                {testResult === "error" && (
                  <AlertCircle className="h-5 w-5 text-red-500 self-center" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">API Base URL</Label>
                <Input
                  id="baseUrl"
                  placeholder="https://api.openai.com/v1"
                  value={aiConfig.baseUrl}
                  onChange={(e) => setAiConfig({ ...aiConfig, baseUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">模型名称</Label>
                <Input
                  id="model"
                  placeholder="gpt-3.5-turbo"
                  value={aiConfig.model}
                  onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSaveAIConfig} size="sm">
                <Save className="mr-2 h-4 w-4" />
                保存配置
              </Button>
              <Button
                onClick={handleTestConnection}
                variant="outline"
                size="sm"
                disabled={testing || !aiConfig.apiKey}
              >
                {testing ? "测试中..." : "测试连接"}
              </Button>
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">支持的兼容服务商：</p>
              <p>• OpenAI: https://api.openai.com/v1</p>
              <p>• DeepSeek: https://api.deepseek.com/v1</p>
              <p>• 智谱 AI: https://open.bigmodel.cn/api/paas/v4</p>
              <p>• 月之暗面: https://api.moonshot.cn/v1</p>
              <p>• 其他 OpenAI 兼容接口均可配置</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Moon className="h-4 w-4" />
              外观设置
            </CardTitle>
            <CardDescription>
              自定义应用的外观和主题
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">主题模式</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  当前：{theme === "dark" ? "深色模式" : theme === "light" ? "浅色模式" : "跟随系统"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="mr-2 h-4 w-4" />
                  浅色
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="mr-2 h-4 w-4" />
                  深色
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("system")}
                >
                  系统
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              数据管理
            </CardTitle>
            <CardDescription>
              管理本地存储的数据，支持备份和恢复
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {Object.entries(tableLabels).map(([key, label]) => (
                <div key={key} className="rounded-lg border bg-card p-3 text-center">
                  <p className="text-2xl font-bold">{dbStats[key] || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">导出数据</p>
                <p className="text-xs text-muted-foreground">
                  将所有数据导出为JSON备份文件
                </p>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  导出备份
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">导入数据</p>
                <p className="text-xs text-muted-foreground">
                  从备份文件恢复数据（合并）
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  导入备份
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">清空数据</p>
                <p className="text-xs text-muted-foreground">
                  永久删除所有本地数据
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/50 hover:bg-destructive/10"
                  onClick={handleClearData}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  清空所有
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4" />
              关于
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">版本</span>
              <span>PMOS Lite v1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">存储方式</span>
              <span>IndexedDB (本地存储)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">技术栈</span>
              <span>Next.js + TypeScript + Dexie</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">部署方式</span>
              <span>GitHub Pages</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
