"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Database,
  Plus,
  Search,
  Star,
  Copy,
  Trash2,
  Save,
  Sparkles,
  Wand2,
  ChevronRight,
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
import { Select } from "@/components/ui/select";
import { db } from "@/lib/db";
import { formatDate, copyToClipboard } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { SQLQuery } from "@/types";

const dialects: { value: SQLQuery["dialect"]; label: string; color: string }[] = [
  { value: "mysql", label: "MySQL", color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  { value: "hive", label: "Hive", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  { value: "clickhouse", label: "ClickHouse", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300" },
  { value: "starrocks", label: "StarRocks", color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
];

const sqlTemplates = [
  {
    name: "用户行为统计",
    dialect: "mysql" as const,
    sql: `SELECT 
  user_id,
  COUNT(*) AS action_count,
  DATE(created_at) AS action_date
FROM user_actions
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY user_id, DATE(created_at)
ORDER BY action_count DESC
LIMIT 100;`,
  },
  {
    name: "漏斗分析",
    dialect: "clickhouse" as const,
    sql: `SELECT
  step,
  COUNT(DISTINCT user_id) AS user_count,
  ROUND(COUNT(DISTINCT user_id) * 100.0 / 
    (SELECT COUNT(DISTINCT user_id) FROM funnel WHERE step = 1), 2) AS conversion_rate
FROM funnel
WHERE event_date = today()
GROUP BY step
ORDER BY step;`,
  },
  {
    name: "留存分析",
    dialect: "hive" as const,
    sql: `WITH first_visit AS (
  SELECT 
    user_id,
    MIN(dt) AS first_dt
  FROM user_events
  GROUP BY user_id
)
SELECT
  f.first_dt AS first_day,
  COUNT(DISTINCT CASE WHEN e.dt = f.first_dt THEN f.user_id END) AS day0,
  COUNT(DISTINCT CASE WHEN e.dt = date_add(f.first_dt, 1) THEN f.user_id END) AS day1,
  COUNT(DISTINCT CASE WHEN e.dt = date_add(f.first_dt, 7) THEN f.user_id END) AS day7
FROM first_visit f
LEFT JOIN user_events e ON f.user_id = e.user_id
WHERE f.first_dt >= '2024-01-01'
GROUP BY f.first_dt
ORDER BY f.first_dt DESC;`,
  },
];

export default function SQLPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedSql, setSelectedSql] = React.useState<SQLQuery | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>("editor");
  const [formData, setFormData] = React.useState<Partial<SQLQuery>>({
    title: "",
    description: "",
    sql: "",
    dialect: "mysql",
    isFavorite: false,
    tags: [],
  });
  const [tagInput, setTagInput] = React.useState("");
  const [nlInput, setNlInput] = React.useState("");
  const { toast } = useToast();

  const sqlQueries = useLiveQuery(
    () => db.sqlQueries.orderBy("updatedAt").reverse().toArray(),
    [],
    []
  );

  const favoriteQueries = React.useMemo(
    () => sqlQueries.filter((q) => q.isFavorite),
    [sqlQueries]
  );

  const filteredQueries = React.useMemo(
    () =>
      sqlQueries.filter(
        (q) =>
          !searchQuery ||
          q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.sql.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    [sqlQueries, searchQuery]
  );

  const handleCreate = () => {
    setSelectedSql(null);
    setIsEditing(true);
    setActiveTab("editor");
    setFormData({
      title: "",
      description: "",
      sql: "",
      dialect: "mysql",
      isFavorite: false,
      tags: [],
    });
  };

  const handleSelect = (sql: SQLQuery) => {
    setSelectedSql(sql);
    setIsEditing(false);
    setActiveTab("editor");
    setFormData(sql);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      toast({ message: "请输入SQL标题", type: "error" });
      return;
    }
    if (!formData.sql?.trim()) {
      toast({ message: "请输入SQL语句", type: "error" });
      return;
    }

    const now = new Date();
    if (selectedSql?.id) {
      await db.sqlQueries.update(selectedSql.id, {
        ...formData,
        updatedAt: now,
      });
      await db.addRecentEdit("sql", selectedSql.id, formData.title!);
      toast({ message: "SQL已保存", type: "success" });
      const updated = await db.sqlQueries.get(selectedSql.id);
      if (updated) setSelectedSql(updated);
    } else {
      const id = await db.sqlQueries.add({
        title: formData.title!,
        description: formData.description || "",
        sql: formData.sql!,
        dialect: formData.dialect || "mysql",
        isFavorite: formData.isFavorite || false,
        tags: formData.tags || [],
        createdAt: now,
        updatedAt: now,
      });
      await db.addRecentEdit("sql", id, formData.title!);
      toast({ message: "SQL已创建", type: "success" });
      const created = await db.sqlQueries.get(id);
      if (created) setSelectedSql(created);
    }
    setIsEditing(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这条SQL吗？")) return;
    await db.sqlQueries.delete(id);
    if (selectedSql?.id === id) {
      setSelectedSql(null);
      setIsEditing(false);
    }
    toast({ message: "SQL已删除", type: "success" });
  };

  const handleToggleFavorite = async () => {
    if (!selectedSql?.id) return;
    const newFav = !formData.isFavorite;
    await db.sqlQueries.update(selectedSql.id, {
      isFavorite: newFav,
      updatedAt: new Date(),
    });
    setFormData({ ...formData, isFavorite: newFav });
    toast({ message: newFav ? "已收藏" : "已取消收藏", type: "success" });
  };

  const handleCopy = async () => {
    if (!formData.sql) return;
    await copyToClipboard(formData.sql);
    toast({ message: "已复制到剪贴板", type: "success" });
  };

  const handleFormat = () => {
    if (!formData.sql) return;
    
    let formatted = formData.sql
      .replace(/\s+/g, " ")
      .replace(/\s*([(),;])\s*/g, "$1")
      .replace(/\s*(=|<>|!=|<=|>=|<|>)\s*/g, " $1 ")
      .trim();
    
    const keywords = [
      "SELECT", "FROM", "WHERE", "AND", "OR", "ORDER BY", "GROUP BY",
      "HAVING", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "ON",
      "LIMIT", "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM",
      "CREATE TABLE", "ALTER TABLE", "DROP TABLE", "UNION", "UNION ALL",
      "WITH", "AS", "CASE", "WHEN", "THEN", "ELSE", "END",
    ];
    
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, "gi");
      formatted = formatted.replace(regex, (m) => "\n" + m);
    }
    formatted = formatted.trim();
    formatted = formatted.replace(/\n{3,}/g, "\n\n");
    
    setFormData({ ...formData, sql: formatted });
    toast({ message: "SQL已格式化", type: "success" });
  };

  const handleGenerateFromNL = () => {
    if (!nlInput.trim()) {
      toast({ message: "请输入自然语言描述", type: "error" });
      return;
    }

    const dialect = formData.dialect || "mysql";
    const nl = nlInput.toLowerCase();
    
    let generatedSql = "";
    
    if (nl.includes("统计") || nl.includes("数量") || nl.includes("count")) {
      generatedSql = `SELECT
  COUNT(*) AS total_count
FROM table_name
WHERE 1=1
  AND created_at >= '2024-01-01'
  AND created_at < '2024-02-01';`;
    } else if (nl.includes("分组") || nl.includes("group")) {
      generatedSql = `SELECT
  category,
  COUNT(*) AS cnt,
  SUM(amount) AS total_amount
FROM table_name
WHERE status = 'active'
GROUP BY category
ORDER BY cnt DESC
LIMIT 10;`;
    } else if (nl.includes("用户") && nl.includes("留存")) {
      generatedSql = `WITH first_day AS (
  SELECT
    user_id,
    MIN(dt) AS first_dt
  FROM user_events
  GROUP BY user_id
)
SELECT
  f.first_dt,
  COUNT(DISTINCT f.user_id) AS new_users,
  COUNT(DISTINCT CASE WHEN e.dt = f.first_dt + 1 THEN e.user_id END) AS day1_retention
FROM first_day f
LEFT JOIN user_events e ON f.user_id = e.user_id
GROUP BY f.first_dt
ORDER BY f.first_dt DESC;`;
    } else {
      generatedSql = `SELECT
  *
FROM table_name
WHERE 1=1
ORDER BY created_at DESC
LIMIT 100;`;
    }

    setFormData({ ...formData, sql: generatedSql });
    setActiveTab("editor");
    toast({ message: "SQL已生成", type: "success" });
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

  const applyTemplate = (template: typeof sqlTemplates[0]) => {
    setFormData({
      ...formData,
      sql: template.sql,
      dialect: template.dialect,
    });
    setActiveTab("editor");
    if (!isEditing) setIsEditing(true);
    toast({ message: "模板已应用", type: "success" });
  };

  return (
    <AppLayout title="SQL 助手" description="多方言支持，常用模板一键套用">
      <div className="flex sticky top-6 h-[calc(100vh-7rem)] gap-6">
        <div className="w-72 shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索SQL..."
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
            <div className="space-y-4">
              {favoriteQueries.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                    ⭐ 收藏
                  </p>
                  <div className="space-y-1">
                    {favoriteQueries.slice(0, 5).map((sql) => (
                      <div
                        key={sql.id}
                        onClick={() => handleSelect(sql)}
                        className={`cursor-pointer rounded-lg border p-2 transition-all hover:border-primary/50 text-sm ${
                          selectedSql?.id === sql.id
                            ? "border-primary bg-primary/5"
                            : ""
                        }`}
                      >
                        <p className="font-medium truncate">{sql.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                  全部SQL
                </p>
                <div className="space-y-2">
                  {filteredQueries.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      暂无SQL记录
                    </div>
                  ) : (
                    filteredQueries.map((sql) => (
                      <div
                        key={sql.id}
                        onClick={() => handleSelect(sql)}
                        className={`cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/50 ${
                          selectedSql?.id === sql.id
                            ? "border-primary bg-primary/5"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{sql.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                              {sql.sql.slice(0, 40)}...
                            </p>
                          </div>
                          {sql.isFavorite && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {dialects.find((d) => d.value === sql.dialect)?.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(sql.updatedAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {selectedSql || isEditing ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <Input
                      value={formData.title || ""}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="输入SQL标题"
                      className="text-lg font-semibold h-10 w-64"
                    />
                  ) : (
                    <h2 className="text-xl font-bold">{formData.title}</h2>
                  )}
                  <Badge
                    variant="secondary"
                    className={dialects.find((d) => d.value === formData.dialect)?.color}
                  >
                    {dialects.find((d) => d.value === formData.dialect)?.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleFavorite}
                      >
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
                        onClick={() => selectedSql?.id && handleDelete(selectedSql.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={handleFormat}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        格式化
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
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>数据库类型</Label>
                    <Select
                      value={formData.dialect}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dialect: e.target.value as SQLQuery["dialect"],
                        })
                      }
                    >
                      {dialects.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
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

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList>
                  <TabsTrigger value="editor">SQL编辑器</TabsTrigger>
                  <TabsTrigger value="nl2sql">自然语言转SQL</TabsTrigger>
                  <TabsTrigger value="templates">模板库</TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="flex-1 mt-4 overflow-hidden">
                  <Textarea
                    value={formData.sql || ""}
                    onChange={(e) => setFormData({ ...formData, sql: e.target.value })}
                    placeholder="输入SQL语句..."
                    className="h-full font-mono text-sm min-h-[400px] resize-none"
                    readOnly={!isEditing}
                  />
                </TabsContent>

                <TabsContent value="nl2sql" className="flex-1 mt-4 overflow-hidden">
                  <div className="h-full flex flex-col gap-4">
                    <div className="space-y-2">
                      <Label>用自然语言描述你想要查询的内容</Label>
                      <Textarea
                        value={nlInput}
                        onChange={(e) => setNlInput(e.target.value)}
                        placeholder="例如：统计过去一个月每天的新增用户数和次日留存率..."
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleGenerateFromNL} className="self-start">
                      <Sparkles className="mr-2 h-4 w-4" />
                      生成SQL
                    </Button>
                    {formData.sql && (
                      <div className="flex-1">
                        <Label>生成结果</Label>
                        <div className="mt-2 rounded-lg border bg-muted/30 p-4">
                          <pre className="text-sm font-mono whitespace-pre-wrap">
                            {formData.sql}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="templates" className="flex-1 mt-4 overflow-hidden">
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-1 gap-4">
                      {sqlTemplates.map((template, idx) => (
                        <Card key={idx}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">{template.name}</CardTitle>
                              <Badge
                                variant="secondary"
                                className={
                                  dialects.find((d) => d.value === template.dialect)?.color
                                }
                              >
                                {dialects.find((d) => d.value === template.dialect)?.label}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <pre className="text-xs font-mono bg-muted rounded p-3 overflow-x-auto">
                              {template.sql}
                            </pre>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3 w-full"
                              onClick={() => applyTemplate(template)}
                            >
                              使用此模板
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Database className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">选择或创建SQL</h3>
              <p className="text-sm text-muted-foreground mt-1">
                从左侧选择，或创建一条新的SQL查询
              </p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                新建SQL
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
