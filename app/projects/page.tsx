"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  FolderKanban,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Archive,
  RefreshCw,
  Tag,
  Calendar,
  X,
  FileText,
  Users,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { formatDate, truncateText } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { Project } from "@/types";

const colorOptions = [
  { name: "blue", gradient: "from-blue-500 to-blue-600", bg: "bg-blue-50", text: "text-blue-600" },
  { name: "violet", gradient: "from-violet-500 to-violet-600", bg: "bg-violet-50", text: "text-violet-600" },
  { name: "emerald", gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50", text: "text-emerald-600" },
  { name: "orange", gradient: "from-orange-500 to-orange-600", bg: "bg-orange-50", text: "text-orange-600" },
  { name: "rose", gradient: "from-rose-500 to-rose-600", bg: "bg-rose-50", text: "text-rose-600" },
  { name: "cyan", gradient: "from-cyan-500 to-cyan-600", bg: "bg-cyan-50", text: "text-cyan-600" },
];

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    tags: "",
    color: "blue",
  });
  const { toast } = useToast();

  const allProjects = useLiveQuery(
    () => db.projects.orderBy("updatedAt").reverse().toArray(),
    [],
    []
  );

  const activeProjects = React.useMemo(
    () =>
      allProjects.filter(
        (p) =>
          p.status === "active" &&
          (searchQuery
            ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (p.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
              (p.tags || []).some((t) =>
                t.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : true)
      ),
    [allProjects, searchQuery]
  );

  const archivedProjects = React.useMemo(
    () =>
      allProjects.filter(
        (p) =>
          p.status === "archived" &&
          (searchQuery
            ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (p.description || "").toLowerCase().includes(searchQuery.toLowerCase())
            : true)
      ),
    [allProjects, searchQuery]
  );

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description || "",
        tags: (project.tags || []).join(", "),
        color: (project as any).color || "blue",
      });
    } else {
      setEditingProject(null);
      setFormData({ name: "", description: "", tags: "", color: "blue" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ message: "请输入项目名称", type: "error" });
      return;
    }

    const tags = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const now = new Date();

    if (editingProject && editingProject.id) {
      await db.projects.update(editingProject.id, {
        name: formData.name,
        description: formData.description,
        tags,
        color: formData.color,
        updatedAt: now,
      });
      await db.addRecentEdit("project", editingProject.id, formData.name);
      toast({ message: "项目已更新", type: "success" });
    } else {
      const id = await db.projects.add({
        name: formData.name,
        description: formData.description,
        tags,
        status: "active",
        color: formData.color,
        createdAt: now,
        updatedAt: now,
      });
      await db.addRecentEdit("project", id, formData.name);
      toast({ message: "项目已创建", type: "success" });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个项目吗？")) return;
    await db.projects.delete(id);
    toast({ message: "项目已删除", type: "success" });
  };

  const handleArchive = async (project: Project) => {
    if (!project.id) return;
    const newStatus = project.status === "active" ? "archived" : "active";
    await db.projects.update(project.id, {
      status: newStatus,
      updatedAt: new Date(),
    });
    toast({
      message: newStatus === "archived" ? "项目已归档" : "项目已恢复",
      type: "success",
    });
  };

  const getColor = (colorName?: string) => {
    return colorOptions.find((c) => c.name === colorName) || colorOptions[0];
  };

  return (
    <AppLayout
      title="项目中心"
      description="统筹管理你的所有产品项目"
      actions={
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          新建项目
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索项目名称、描述或标签…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FolderKanban className="h-4 w-4" />
            共 {allProjects.length} 个项目
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="active">进行中 ({activeProjects.length})</TabsTrigger>
            <TabsTrigger value="archived">已归档 ({archivedProjects.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-0">
            {activeProjects.length === 0 ? (
              <EmptyState onCreate={() => handleOpenDialog()} />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    color={getColor((project as any).color)}
                    onEdit={() => handleOpenDialog(project)}
                    onDelete={() => project.id && handleDelete(project.id)}
                    onArchive={() => handleArchive(project)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived" className="mt-0">
            {archivedProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Archive className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">暂无归档项目</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  归档的项目将显示在这里
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {archivedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    color={getColor((project as any).color)}
                    onEdit={() => handleOpenDialog(project)}
                    onDelete={() => project.id && handleDelete(project.id)}
                    onArchive={() => handleArchive(project)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingProject ? "编辑项目" : "新建项目"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">项目名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：电商 App V2.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">项目描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="简要描述项目目标和范围"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">标签</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="用逗号分隔，如：移动端, 电商, V2.0"
              />
            </div>
            <div className="space-y-2">
              <Label>主题颜色</Label>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.name })}
                    className={`relative h-9 w-9 rounded-lg bg-gradient-to-br ${color.gradient} transition-all ${
                      formData.color === color.name
                        ? "ring-2 ring-offset-2 ring-foreground"
                        : "hover:scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingProject ? "保存" : "创建项目"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function ProjectCard({
  project,
  color,
  onEdit,
  onDelete,
  onArchive,
}: {
  project: Project;
  color: { gradient: string; bg: string; text: string };
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5">
      <div className={`h-1.5 w-full bg-gradient-to-r ${color.gradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color.bg} ${color.text}`}>
              <FolderKanban className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {project.name}
              </h3>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                更新于 {formatDate(project.updatedAt)}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-1 -mt-1">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive}>
                {project.status === "active" ? (
                  <>
                    <Archive className="mr-2 h-4 w-4" />
                    归档
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    恢复
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
          {truncateText(project.description || "暂无描述", 80)}
        </p>

        {project.tags && project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
            {project.tags.length > 4 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{project.tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <div className="flex -space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-card">
              PM
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              0
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              1
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <FolderKanban className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground">还没有项目</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        创建你的第一个项目，开始规划产品、撰写 PRD、管理需求，让一切井井有条。
      </p>
      <Button onClick={onCreate} className="mt-6">
        <Plus className="mr-2 h-4 w-4" />
        新建项目
      </Button>
    </div>
  );
}
