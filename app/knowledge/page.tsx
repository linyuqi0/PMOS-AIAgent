"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Upload,
  FileText,
  FileSpreadsheet,
  File,
  FileCode,
  Tag,
  X,
  Eye,
  Download,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { db } from "@/lib/db";
import { formatDate, formatFileSize } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { KnowledgeDoc } from "@/types";

const fileTypeConfig: Record<KnowledgeDoc["fileType"], { label: string; icon: any; color: string }> = {
  pdf: { label: "PDF", icon: FileText, color: "text-red-500" },
  docx: { label: "DOCX", icon: FileText, color: "text-blue-500" },
  xlsx: { label: "XLSX", icon: FileSpreadsheet, color: "text-green-500" },
  txt: { label: "TXT", icon: File, color: "text-gray-500" },
  md: { label: "Markdown", icon: FileCode, color: "text-purple-500" },
};

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedDoc, setSelectedDoc] = React.useState<KnowledgeDoc | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [filterType, setFilterType] = React.useState<string>("all");
  const [tagInput, setTagInput] = React.useState("");
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const docs = useLiveQuery(
    () => db.knowledgeDocs.orderBy("updatedAt").reverse().toArray(),
    [],
    []
  );

  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    docs.forEach((d) => d.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [docs]);

  const filteredDocs = React.useMemo(() => {
    return docs.filter((d) => {
      const matchType = filterType === "all" || d.fileType === filterType;
      const matchSearch =
        !searchQuery ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [docs, searchQuery, filterType]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() || "txt";
        let fileType: KnowledgeDoc["fileType"] = "txt";

        if (ext === "pdf") fileType = "pdf";
        else if (ext === "docx") fileType = "docx";
        else if (ext === "xlsx") fileType = "xlsx";
        else if (ext === "md") fileType = "md";
        else fileType = "txt";

        let content = "";

        if (fileType === "txt" || fileType === "md") {
          content = await readTextFile(file);
        } else {
          content = `[${fileType.toUpperCase()} 文件] ${file.name}\n\n文件大小: ${formatFileSize(file.size)}\n\n(提示：完整解析需要相应的解析库，此为基础版本)`;
        }

        const now = new Date();
        await db.knowledgeDocs.add({
          title: file.name.replace(/\.[^/.]+$/, ""),
          content,
          fileType,
          fileName: file.name,
          fileSize: file.size,
          tags: [],
          createdAt: now,
          updatedAt: now,
        });
      } catch (err) {
        console.error("Upload error:", err);
        toast({ message: `上传失败: ${file.name}`, type: "error" });
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast({ message: "文件上传成功", type: "success" });
  };

  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || "");
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个文档吗？")) return;
    await db.knowledgeDocs.delete(id);
    if (selectedDoc?.id === id) setSelectedDoc(null);
    toast({ message: "文档已删除", type: "success" });
  };

  const handleAddTag = async () => {
    if (!selectedDoc?.id || !tagInput.trim()) return;
    if (selectedDoc.tags.includes(tagInput.trim())) {
      setTagInput("");
      return;
    }
    const newTags = [...selectedDoc.tags, tagInput.trim()];
    await db.knowledgeDocs.update(selectedDoc.id, {
      tags: newTags,
      updatedAt: new Date(),
    });
    setSelectedDoc({ ...selectedDoc, tags: newTags });
    await db.addRecentEdit("knowledge", selectedDoc.id, selectedDoc.title);
    setTagInput("");
    toast({ message: "标签已添加", type: "success" });
  };

  const handleRemoveTag = async (tag: string) => {
    if (!selectedDoc?.id) return;
    const newTags = selectedDoc.tags.filter((t) => t !== tag);
    await db.knowledgeDocs.update(selectedDoc.id, {
      tags: newTags,
      updatedAt: new Date(),
    });
    setSelectedDoc({ ...selectedDoc, tags: newTags });
  };

  const handleUpdateTitle = async (title: string) => {
    if (!selectedDoc?.id) return;
    await db.knowledgeDocs.update(selectedDoc.id, {
      title,
      updatedAt: new Date(),
    });
    setSelectedDoc({ ...selectedDoc, title });
  };

  return (
    <AppLayout title="知识库" description="§ 08 — The Archive of Knowledge">
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        <div className="w-72 shrink-0 flex flex-col gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索文档..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,.pdf,.docx,.xlsx"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <Upload className="mr-2 h-4 w-4" />
                上传
              </Button>
            </div>

            <div className="flex flex-wrap gap-1">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
                className="h-7 text-xs"
              >
                全部 {docs.length}
              </Button>
              {(Object.keys(fileTypeConfig) as KnowledgeDoc["fileType"][]).map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                  className="h-7 text-xs"
                >
                  {fileTypeConfig[type].label}
                </Button>
              ))}
            </div>
          </div>

          {allTags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                标签
              </p>
              <div className="flex flex-wrap gap-1">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={searchQuery.toLowerCase() === tag.toLowerCase() ? "default" : "secondary"}
                    className="cursor-pointer text-xs"
                    onClick={() => setSearchQuery(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-2">
              {filteredDocs.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  暂无文档
                </div>
              ) : (
                filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/50 ${
                      selectedDoc?.id === doc.id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      {React.createElement(fileTypeConfig[doc.fileType].icon, {
                        className: `h-5 w-5 mt-0.5 shrink-0 ${fileTypeConfig[doc.fileType].color}`,
                      })}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(doc.updatedAt)} · {formatFileSize(doc.fileSize)}
                        </p>
                        {doc.tags.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {doc.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {selectedDoc ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {React.createElement(fileTypeConfig[selectedDoc.fileType].icon, {
                    className: `h-6 w-6 ${fileTypeConfig[selectedDoc.fileType].color}`,
                  })}
                  <div>
                    <input
                      value={selectedDoc.title}
                      onChange={(e) => handleUpdateTitle(e.target.value)}
                      onBlur={(e) => handleUpdateTitle(e.target.value)}
                      className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                    />
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedDoc.fileName} · {formatFileSize(selectedDoc.fileSize)} · {formatDate(selectedDoc.updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsViewDialogOpen(true)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    查看
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedDoc.id && handleDelete(selectedDoc.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Label>标签</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    placeholder="添加标签..."
                    className="w-48"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {selectedDoc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {selectedDoc.tags.map((tag) => (
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

              <div className="flex-1 overflow-hidden">
                <div className="h-full rounded-lg border bg-card p-6 overflow-auto">
                  {selectedDoc.fileType === "md" ? (
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{
                        __html: selectedDoc.content.replace(/\n/g, "<br/>"),
                      }}
                    />
                  ) : (
                    <pre className="text-sm whitespace-pre-wrap font-mono text-foreground/80">
                      {selectedDoc.content}
                    </pre>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">上传或选择文档</h3>
              <p className="text-sm text-muted-foreground mt-1">
                支持 TXT、Markdown、PDF、DOCX、XLSX 格式
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,.pdf,.docx,.xlsx"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button onClick={() => fileInputRef.current?.click()} className="mt-4">
                <Upload className="mr-2 h-4 w-4" />
                上传文件
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="prose prose-sm max-w-none dark:prose-invert p-2">
              {selectedDoc?.fileType === "md" ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: (selectedDoc?.content || "").replace(/\n/g, "<br/>"),
                  }}
                />
              ) : (
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {selectedDoc?.content}
                </pre>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
