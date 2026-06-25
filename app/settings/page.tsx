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
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";
import { db } from "@/lib/db";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [dbStats, setDbStats] = React.useState<Record<string, number>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    loadDbStats();
  }, []);

  const loadDbStats = async () => {
    const stats: Record<string, number> = {};
    const tables = ["projects", "prds", "requirements", "sqlQueries", "trackingEvents", "testCases", "knowledgeDocs", "prompts"];
    for (const table of tables) {
      stats[table] = await (db as any)[table].count();
    }
    setDbStats(stats);
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
  };

  return (
    <AppLayout title="设置" description="管理外观、数据和偏好设置">
      <div className="max-w-3xl mx-auto space-y-6">
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
            <div className="grid grid-cols-4 gap-3">
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
