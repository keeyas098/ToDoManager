"use client";

import { Task } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
    Clock,
    CheckCircle2,
    Circle,
    AlertCircle,
    XCircle,
    Square,
    CheckSquare,
    Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";

interface TimelineProps {
    tasks: Task[];
    onTaskClick?: (task: Task) => void;
    onTaskToggle?: (taskId: string, completed: boolean) => void;
}

const priorityColors = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
};

const statusIcons = {
    pending: Circle,
    "in-progress": Clock,
    completed: CheckCircle2,
    cancelled: XCircle,
};

// Category config with emoji and label
const categoryConfig: Record<string, { emoji: string; label: string }> = {
    work: { emoji: "💼", label: "仕事" },
    family: { emoji: "👨‍👩‍👧", label: "家族" },
    personal: { emoji: "🧘", label: "自分" },
    health: { emoji: "💪", label: "健康" },
    errand: { emoji: "🛒", label: "用事" },
};

// Get current time as HH:MM string
const getCurrentTimeString = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

// Check if a task is the "current" one (its time <= now < next task's time)
const findCurrentTaskIndex = (tasks: Task[]) => {
    const now = getCurrentTimeString();
    // Find the last task whose time is <= now
    let currentIdx = -1;
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].time <= now) {
            currentIdx = i;
        }
    }
    return currentIdx;
};

export function Timeline({ tasks, onTaskClick, onTaskToggle }: TimelineProps) {
    const [fadingOutIds, setFadingOutIds] = useState<Set<string>>(new Set());
    const [currentTime, setCurrentTime] = useState(getCurrentTimeString());

    // Update current time every minute for the highlight indicator
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(getCurrentTimeString());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Handle task completion with fade-out animation
    const handleComplete = useCallback((taskId: string) => {
        setFadingOutIds(prev => new Set(prev).add(taskId));
        // Delay actual completion to allow animation
        setTimeout(() => {
            if (onTaskToggle) {
                onTaskToggle(taskId, true);
            }
            setFadingOutIds(prev => {
                const next = new Set(prev);
                next.delete(taskId);
                return next;
            });
        }, 400);
    }, [onTaskToggle]);

    // Show all tasks (including past ones), only hide completed/cancelled
    // Sort by time
    const activeTasks = tasks
        .filter(task => {
            // Hide completed or cancelled tasks
            if (task.status === "completed" || task.status === "cancelled") {
                return false;
            }
            // Keep all tasks including past ones (user requested)
            return true;
        })
        .sort((a, b) => a.time.localeCompare(b.time));

    const currentTaskIndex = findCurrentTaskIndex(activeTasks);

    if (activeTasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 md:p-8 gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <AlertCircle className="w-7 h-7 md:w-8 md:h-8 text-primary opacity-80" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-sm md:text-lg font-semibold text-foreground">スケジュールがありません</p>
                    <p className="text-xs md:text-sm opacity-80 leading-relaxed max-w-xs">
                        💬 <span className="font-medium text-foreground/80">チャットタブ</span>からAIに話しかけて、
                        <br />今日のスケジュールを作成しましょう！
                    </p>
                </div>
                <div className="mt-2 p-3 rounded-lg bg-muted/50 max-w-xs">
                    <p className="text-xs opacity-70 leading-relaxed text-center">
                        💡 <span className="font-medium">ヒント：</span>
                        ⚙️ 設定画面の「カスタム指示」に家族構成やルーティンを入力すると、
                        あなたに合った詳細なスケジュールを組めます
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-2 md:p-4 space-y-1.5 md:space-y-2">
                {activeTasks.map((task, index) => {
                    const StatusIcon = statusIcons[task.status || "pending"];
                    const isCurrent = index === currentTaskIndex;
                    const isPast = currentTaskIndex > index;
                    const isFadingOut = fadingOutIds.has(task.id);
                    const category = task.category ? categoryConfig[task.category] : null;

                    return (
                        <Card
                            key={task.id}
                            onClick={() => onTaskClick?.(task)}
                            className={cn(
                                "relative p-2 md:p-3 cursor-pointer transition-all duration-300",
                                "hover:scale-[1.01] hover:shadow-md hover:shadow-primary/10",
                                "border-l-3 md:border-l-4",
                                task.priority === "high" && "border-l-red-500",
                                task.priority === "medium" && "border-l-yellow-500",
                                task.priority === "low" && "border-l-green-500",
                                !task.priority && "border-l-primary/50",
                                // Current task highlight
                                isCurrent && "bg-primary/5 ring-1 ring-primary/20 shadow-sm shadow-primary/10",
                                // Past tasks slightly faded
                                isPast && !isCurrent && "opacity-60",
                                // Fade-out animation on completion
                                isFadingOut && "opacity-0 scale-95 translate-x-4"
                            )}
                        >
                            <div className="flex items-center gap-2 md:gap-3">
                                {/* Current task indicator */}
                                {isCurrent && (
                                    <div className="absolute -left-0.5 top-1/2 -translate-y-1/2">
                                        <Play className="w-2.5 h-2.5 text-primary fill-primary" />
                                    </div>
                                )}

                                {/* Time column - compact */}
                                <div className="flex flex-col items-center min-w-[40px] md:min-w-[50px]">
                                    <span className={cn(
                                        "text-sm md:text-base font-bold",
                                        isCurrent ? "text-primary" : "text-primary/80"
                                    )}>{task.time}</span>
                                    {task.duration && (
                                        <span className="text-[10px] md:text-xs text-muted-foreground">{task.duration}分</span>
                                    )}
                                </div>

                                {/* Checkbox - tap to mark complete */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleComplete(task.id);
                                    }}
                                    className={cn(
                                        "flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-md transition-all flex-shrink-0",
                                        isFadingOut
                                            ? "text-green-500 scale-110"
                                            : "hover:bg-muted/80 text-muted-foreground hover:text-primary"
                                    )}
                                    aria-label="タスク完了"
                                    disabled={isFadingOut}
                                >
                                    {isFadingOut ? (
                                        <CheckSquare className="w-4 h-4 md:w-5 md:h-5 animate-in zoom-in-50" />
                                    ) : (
                                        <Square className="w-4 h-4 md:w-5 md:h-5" />
                                    )}
                                </button>

                                {/* Content - with word wrap for mobile */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-1.5">
                                        <h3 className="font-medium text-foreground text-sm md:text-base break-words">
                                            {task.title}
                                        </h3>
                                        {/* Category badge */}
                                        {category && (
                                            <span
                                                className="flex-shrink-0 text-[10px] md:text-xs px-1 py-0.5 rounded-full bg-muted/80 mt-0.5"
                                                title={category.label}
                                            >
                                                {category.emoji}
                                            </span>
                                        )}
                                        {task.priority && (
                                            <div
                                                className={cn(
                                                    "w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0 mt-1.5",
                                                    priorityColors[task.priority]
                                                )}
                                            />
                                        )}
                                    </div>
                                    {/* Description with emoji bullets */}
                                    {task.description && (
                                        <div className="text-xs text-muted-foreground break-words space-y-0.5 mt-1">
                                            {task.description.split('\n').filter(line => line.trim()).map((line, i) => (
                                                <p key={i} className="flex items-start gap-1">
                                                    <span className="flex-shrink-0 leading-relaxed">✔️</span>
                                                    <span className="leading-relaxed">{line}</span>
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </ScrollArea>
    );
}
