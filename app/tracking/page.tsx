"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Target,
  Plus,
  Search,
  Trash2,
  Save,
  Download,
  PlusCircle,
  X,
  Tag,
  FileText,
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
import type { TrackingEvent, TrackingProperty } from "@/types";

export default function TrackingPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedEvent, setSelectedEvent] = React.useState<TrackingEvent | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("events");
  const [formData, setFormData] = React.useState<{
    eventName: string;
    eventDescription: string;
    properties: TrackingProperty[];
  }>({
    eventName: "",
    eventDescription: "",
    properties: [],
  });
  const { toast } = useToast();

  const events = useLiveQuery(
    () => db.trackingEvents.orderBy("updatedAt").reverse().toArray(),
    [],
    []
  );

  const filteredEvents = React.useMemo(
    () =>
      events.filter(
        (e) =>
          !searchQuery ||
          e.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.eventDescription.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [events, searchQuery]
  );

  const allProperties = React.useMemo(() => {
    const propMap = new Map<string, { name: string; type: string; description: string; events: string[] }>();
    events.forEach((event) => {
      event.properties.forEach((prop) => {
        if (propMap.has(prop.name)) {
          propMap.get(prop.name)!.events.push(event.eventName);
        } else {
          propMap.set(prop.name, {
            name: prop.name,
            type: prop.type,
            description: prop.description,
            events: [event.eventName],
          });
        }
      });
    });
    return Array.from(propMap.values());
  }, [events]);

  const handleCreate = () => {
    setSelectedEvent(null);
    setIsEditing(true);
    setActiveTab("events");
    setFormData({
      eventName: "",
      eventDescription: "",
      properties: [],
    });
  };

  const handleSelect = (event: TrackingEvent) => {
    setSelectedEvent(event);
    setIsEditing(false);
    setActiveTab("events");
    setFormData({
      eventName: event.eventName,
      eventDescription: event.eventDescription,
      properties: event.properties,
    });
  };

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    if (!formData.eventName.trim()) {
      toast({ message: "请输入事件名称", type: "error" });
      return;
    }

    const now = new Date();
    if (selectedEvent?.id) {
      await db.trackingEvents.update(selectedEvent.id, {
        eventName: formData.eventName,
        eventDescription: formData.eventDescription,
        properties: formData.properties,
        updatedAt: now,
      });
      await db.addRecentEdit("tracking", selectedEvent.id, formData.eventName);
      toast({ message: "事件已保存", type: "success" });
      const updated = await db.trackingEvents.get(selectedEvent.id);
      if (updated) setSelectedEvent(updated);
    } else {
      const id = await db.trackingEvents.add({
        eventName: formData.eventName,
        eventDescription: formData.eventDescription,
        properties: formData.properties,
        createdAt: now,
        updatedAt: now,
      });
      await db.addRecentEdit("tracking", id, formData.eventName);
      toast({ message: "事件已创建", type: "success" });
      const created = await db.trackingEvents.get(id);
      if (created) setSelectedEvent(created);
    }
    setIsEditing(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个埋点事件吗？")) return;
    await db.trackingEvents.delete(id);
    if (selectedEvent?.id === id) {
      setSelectedEvent(null);
      setIsEditing(false);
    }
    toast({ message: "事件已删除", type: "success" });
  };

  const addProperty = () => {
    setFormData({
      ...formData,
      properties: [
        ...formData.properties,
        { name: "", type: "string", description: "", required: false },
      ],
    });
  };

  const updateProperty = (index: number, field: keyof TrackingProperty, value: any) => {
    const newProps = [...formData.properties];
    newProps[index] = { ...newProps[index], [field]: value };
    setFormData({ ...formData, properties: newProps });
  };

  const removeProperty = (index: number) => {
    const newProps = formData.properties.filter((_, i) => i !== index);
    setFormData({ ...formData, properties: newProps });
  };

  const handleExport = () => {
    let doc = "# 埋点设计文档\n\n";
    doc += `> 生成时间：${new Date().toLocaleString("zh-CN")}\n\n`;
    doc += `## 事件总览\n\n`;
    doc += `共 ${events.length} 个事件，${allProperties.length} 个属性\n\n`;

    doc += `## 事件详情\n\n`;
    events.forEach((event) => {
      doc += `### ${event.eventName}\n\n`;
      doc += `${event.eventDescription || "暂无描述"}\n\n`;
      if (event.properties.length > 0) {
        doc += `| 属性名 | 类型 | 必填 | 描述 |\n`;
        doc += `|-------|------|------|------|\n`;
        event.properties.forEach((p) => {
          doc += `| ${p.name} | ${p.type} | ${p.required ? "是" : "否"} | ${p.description} |\n`;
        });
        doc += `\n`;
      }
    });

    doc += `## 属性字典\n\n`;
    doc += `| 属性名 | 类型 | 描述 | 出现事件数 |\n`;
    doc += `|-------|------|------|----------|\n`;
    allProperties.forEach((p) => {
      doc += `| ${p.name} | ${p.type} | ${p.description} | ${p.events.length} |\n`;
    });

    downloadFile(doc, "埋点设计文档.md", "text/markdown");
    toast({ message: "文档已导出", type: "success" });
  };

  return (
    <AppLayout title="埋点设计器" subtitle="§ 06 — Events, Properties, A Dictionary">
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        <div className="w-72 shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索事件..."
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
              {filteredEvents.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  暂无埋点事件
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleSelect(event)}
                    className={`cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/50 ${
                      selectedEvent?.id === event.id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <Target className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm font-mono truncate">
                          {event.eventName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {event.eventDescription || "暂无描述"}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {event.properties.length} 个属性
                          </Badge>
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
          {selectedEvent || isEditing ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <Input
                      value={formData.eventName}
                      onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                      placeholder="输入事件名称"
                      className="text-lg font-semibold h-10 w-80 font-mono"
                    />
                  ) : (
                    <h2 className="text-xl font-bold font-mono">{formData.eventName}</h2>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        导出文档
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectedEvent?.id && handleDelete(selectedEvent.id)}
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

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList>
                  <TabsTrigger value="events">事件详情</TabsTrigger>
                  <TabsTrigger value="properties">属性总览</TabsTrigger>
                </TabsList>

                <TabsContent value="events" className="flex-1 mt-4 overflow-hidden">
                  <ScrollArea className="h-full pr-4 -mr-4">
                    <div className="space-y-6 pb-8">
                      <div>
                        <Label>事件描述</Label>
                        {isEditing ? (
                          <Textarea
                            value={formData.eventDescription}
                            onChange={(e) =>
                              setFormData({ ...formData, eventDescription: e.target.value })
                            }
                            placeholder="描述事件的触发时机和业务含义..."
                            className="mt-2"
                            rows={3}
                          />
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {formData.eventDescription || "暂无描述"}
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <Label>事件属性</Label>
                          {isEditing && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={addProperty}
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              添加属性
                            </Button>
                          )}
                        </div>

                        <div className="mt-3 rounded-lg border overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted">
                              <tr>
                                <th className="text-left px-4 py-2 font-medium">属性名</th>
                                <th className="text-left px-4 py-2 font-medium">类型</th>
                                <th className="text-left px-4 py-2 font-medium">必填</th>
                                <th className="text-left px-4 py-2 font-medium">描述</th>
                                {isEditing && <th className="w-10"></th>}
                              </tr>
                            </thead>
                            <tbody>
                              {formData.properties.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={isEditing ? 5 : 4}
                                    className="text-center py-8 text-muted-foreground"
                                  >
                                    暂无属性
                                  </td>
                                </tr>
                              ) : (
                                formData.properties.map((prop, index) => (
                                  <tr key={index} className="border-t">
                                    <td className="px-4 py-2">
                                      {isEditing ? (
                                        <Input
                                          value={prop.name}
                                          onChange={(e) =>
                                            updateProperty(index, "name", e.target.value)
                                          }
                                          className="h-8 font-mono text-xs"
                                          placeholder="property_name"
                                        />
                                      ) : (
                                        <span className="font-mono text-xs">{prop.name}</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2">
                                      {isEditing ? (
                                        <Select
                                          value={prop.type}
                                          onChange={(e) =>
                                            updateProperty(index, "type", e.target.value)
                                          }
                                          className="h-8 text-xs"
                                        >
                                          <option value="string">string</option>
                                          <option value="number">number</option>
                                          <option value="boolean">boolean</option>
                                          <option value="object">object</option>
                                          <option value="array">array</option>
                                        </Select>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">
                                          {prop.type}
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="px-4 py-2">
                                      {isEditing ? (
                                        <input
                                          type="checkbox"
                                          checked={prop.required}
                                          onChange={(e) =>
                                            updateProperty(index, "required", e.target.checked)
                                          }
                                          className="h-4 w-4"
                                        />
                                      ) : (
                                        prop.required ? "是" : "否"
                                      )}
                                    </td>
                                    <td className="px-4 py-2">
                                      {isEditing ? (
                                        <Input
                                          value={prop.description}
                                          onChange={(e) =>
                                            updateProperty(index, "description", e.target.value)
                                          }
                                          className="h-8 text-xs"
                                          placeholder="属性描述"
                                        />
                                      ) : (
                                        <span className="text-xs text-muted-foreground">
                                          {prop.description || "-"}
                                        </span>
                                      )}
                                    </td>
                                    {isEditing && (
                                      <td className="px-2 py-2">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => removeProperty(index)}
                                        >
                                          <X className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </td>
                                    )}
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="properties" className="flex-1 mt-4 overflow-hidden">
                  <ScrollArea className="h-full pr-4 -mr-4">
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium">属性名</th>
                            <th className="text-left px-4 py-3 font-medium">类型</th>
                            <th className="text-left px-4 py-3 font-medium">描述</th>
                            <th className="text-left px-4 py-3 font-medium">关联事件</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allProperties.length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="text-center py-12 text-muted-foreground"
                              >
                                暂无属性数据
                              </td>
                            </tr>
                          ) : (
                            allProperties.map((prop) => (
                              <tr key={prop.name} className="border-t">
                                <td className="px-4 py-3 font-mono text-xs">
                                  {prop.name}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="secondary" className="text-xs">
                                    {prop.type}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  {prop.description || "-"}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {prop.events.map((evt) => (
                                      <Badge
                                        key={evt}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {evt}
                                      </Badge>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">选择或创建埋点事件</h3>
              <p className="text-sm text-muted-foreground mt-1">
                设计事件和属性，自动生成埋点文档
              </p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                新建事件
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
