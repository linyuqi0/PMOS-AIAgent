"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
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
  Check,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    tags: "",
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
              p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
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
              p.description.toLowerCase().includes(searchQuery.toLowerCase())
            : true)
      ),
    [allProjects, searchQuery]
  );

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description,
        tags: project.tags.join(", "),
      });
    } else {
      setEditingProject(null);
      setFormData({ name: "", description: "", tags: "" });
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

    if (editingProject && editingProject.id) {
      await db.projects.update(editingProject.id, {
        name: formData.name,
        description: formData.description,
        tags,
        updatedAt: new Date(),
      });
      await db.addRecentEdit("project", editingProject.id, formData.name);
      toast({ message: "项目已更新", type: "success" });
    } else {
      const id = await db.projects.add({
        name: formData.name,
        description: formData.description,
        tags,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
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

  return (
    <AppLayout title="项目中心" subtitle="§ 02 — The Registry of Products">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索项目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            新建项目
          </Button>
        </div>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">进行中 ({activeProjects.length})</TabsTrigger>
            <TabsTrigger value="archived">已归档 ({archivedProjects.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {activeProjects.length === 0 ? (
              <EmptyState onCreate={() => handleOpenDialog()} />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {activeProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ProjectCard
                        project={project}
                        onEdit={() => handleOpenDialog(project)}
                        onDelete={() => project.id && handleDelete(project.id)}
                        onArchive={() => handleArchive(project)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived" className="mt-6">
            {archivedProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Archive className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-semibold">暂无归档项目</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  归档的项目将显示在这里
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {archivedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? "编辑项目" : "新建项目"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">项目名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="输入项目名称"
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingProject ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function ProjectCard({
  project,
  onEdit,
  onDelete,
  onArchive,
}: {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
}) {
  return (
    <Card className="card-hover h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-morandi-sage/20 text-morandi-moss">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{project.name}</CardTitle>
              <CardDescription className="mt-1 text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(project.updatedAt)}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {truncateText(project.description || "暂无描述", 80)}
        </p>
        {project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </Badge>
            ))}
            {project.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{project.tags.length - 4}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FolderKanban className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-semibold">还没有项目</h3>
      <p className="text-sm text-muted-foreground mt-1">
        创建你的第一个项目，开始产品之旅
      </p>
      <Button onClick={onCreate} className="mt-4">
        <Plus className="mr-2 h-4 w-4" />
        新建项目
      </Button>
    </div>
  );
}
