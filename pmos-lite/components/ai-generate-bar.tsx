"use client";

import * as React from "react";
import { Sparkles, Loader2, Wand2, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { isAIEnabled } from "@/lib/ai-service";
import { useToast } from "@/components/ui/toast";

export interface AIGenerateBarProps {
  /** 输入框占位符 */
  placeholder?: string;
  /** 主按钮文案 */
  buttonLabel?: string;
  /** 生成函数，接收输入文本，返回任意结构化数据 */
  onGenerate: (input: string) => Promise<any>;
  /** 生成完成回调 */
  onGenerated: (data: any, input: string) => void;
  /** 输入框默认值 */
  defaultValue?: string;
  /** 是否默认展开（默认 true） */
  defaultExpanded?: boolean;
  /** 是否使用多行输入（默认 true） */
  multiline?: boolean;
  /** 提示文案示例 */
  examples?: string[];
  /** 容器 className */
  className?: string;
  /** 输入框 rows 行数（multiline 时生效） */
  rows?: number;
}

/**
 * 通用 AI 生成栏：输入 → 一键生成 → 应用
 * 缩短"输入 → 生成 → 保存"的操作链路，所有工具页面统一接入。
 */
export function AIGenerateBar({
  placeholder = "输入描述，AI 自动生成内容...",
  buttonLabel = "AI 生成",
  onGenerate,
  onGenerated,
  defaultValue = "",
  defaultExpanded = true,
  multiline = true,
  examples = [],
  className,
  rows = 3,
}: AIGenerateBarProps) {
  const [input, setInput] = React.useState(defaultValue);
  const [loading, setLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const [enabled, setEnabled] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setEnabled(isAIEnabled());
  }, []);

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast({ message: "请先输入描述", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const data = await onGenerate(input.trim());
      onGenerated(data, input.trim());
      toast({
        message: enabled ? "AI 生成完成" : "已使用模板生成（未配置 AI）",
        type: "success",
      });
    } catch (e: any) {
      toast({ message: e?.message || "生成失败，请重试", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-gradient-to-br from-primary/5 via-primary/5 to-transparent p-3",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>AI 智能生成</span>
          {enabled ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
              已启用
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              模板模式
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!enabled && (
            <Link href="/settings" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
              <Settings2 className="h-3 w-3" />
              配置
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? "收起" : "展开"}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <>
          {multiline ? (
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              rows={rows}
              onKeyDown={handleKeyDown}
              className="resize-none bg-background text-sm"
            />
          ) : (
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              onKeyDown={handleKeyDown}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          )}

          {examples.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInput(ex)}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted/70 hover:bg-muted text-muted-foreground transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-muted-foreground">
              ⌘/Ctrl + Enter 快速生成
            </span>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={loading || !input.trim()}
              className="ml-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                  {buttonLabel}
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 一键 AI 生成按钮（紧凑型，用于列表/工具栏）
 */
export function AIGenerateButton({
  onClick,
  loading,
  label = "AI 生成",
  className,
  disabled,
}: {
  onClick: () => void;
  loading?: boolean;
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onClick}
      disabled={loading || disabled}
      className={cn("gap-1.5", className)}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5 text-primary" />
      )}
      {label}
    </Button>
  );
}
