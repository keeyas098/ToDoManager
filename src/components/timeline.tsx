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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

// Get current time as HH:MM string
const getCurrentTimeString = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

// Check if a task time has passed
const isTaskPast = (taskTime: string) => {
    const currentTime = getCurrentTimeString();
    return taskTime < currentTime;
};

export function Timeline({ tasks, onTaskClick, onTaskToggle }: TimelineProps) {
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

                    return (
                        <Card
                            key={task.id}
                            onClick={() => onTaskClick?.(task)}
                            className={cn(
                                "relative p-2 md:p-3 cursor-pointer transition-all duration-200",
                                "hover:scale-[1.01] hover:shadow-md hover:shadow-primary/10",
                                "border-l-3 md:border-l-4",
                                task.priority === "high" && "border-l-red-500",
                                task.priority === "medium" && "border-l-yellow-500",
                                task.priority === "low" && "border-l-green-500",
                                !task.priority && "border-l-primary/50"
                            )}
                        >
                            <div className="flex items-center gap-2 md:gap-3">
                                {/* Time column - compact */}
                                <div className="flex flex-col items-center min-w-[40px] md:min-w-[50px]">
                                    <span className="text-sm md:text-base font-bold text-primary">{task.time}</span>
                                    {task.duration && (
                                        <span className="text-[10px] md:text-xs text-muted-foreground">{task.duration}分</span>
                                    )}
                                </div>

                                {/* Checkbox - tap to mark complete */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onTaskToggle) {
                                            onTaskToggle(task.id, true);
                                        }
                                    }}
                                    className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-md hover:bg-muted/80 transition-colors flex-shrink-0"
                                    aria-label="タスク完了"
                                >
                                    <Square className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground hover:text-primary" />
                                </button>

                                {/* Content - with word wrap for mobile */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-1.5">
                                        <h3 className="font-medium text-foreground text-sm md:text-base break-words">
                                            {task.title}
                                        </h3>
                                        {task.priority && (
                                            <div
                                                className={cn(
                                                    "w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0 mt-1.5",
                                                    priorityColors[task.priority]
                                                )}
                                            />
                                        )}
                                    </div>
                                    {task.description && (
                                        <div className="text-xs text-muted-foreground break-words space-y-0.5 mt-0.5">
                                            {task.description.split('\n').map((line, i) => (
                                                <p key={i}>{line}</p>
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
