"use client";

import { Task } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Clock,
    CheckCircle2,
    Circle,
    AlertCircle,
    XCircle,
    Briefcase,
    Users,
    User,
    Heart,
    ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineProps {
    tasks: Task[];
    onTaskClick?: (task: Task) => void;
}

const categoryIcons = {
    work: Briefcase,
    family: Users,
    personal: User,
    health: Heart,
    errand: ShoppingBag,
};

const categoryLabels = {
    work: "仕事",
    family: "家族",
    personal: "個人",
    health: "健康",
    errand: "用事",
};

const categoryColors = {
    work: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    family: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    personal: "bg-green-500/20 text-green-400 border-green-500/30",
    health: "bg-red-500/20 text-red-400 border-red-500/30",
    errand: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

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

export function Timeline({ tasks, onTaskClick }: TimelineProps) {
    const sortedTasks = [...tasks].sort((a, b) => a.time.localeCompare(b.time));

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">スケジュールがありません</p>
                <p className="text-sm opacity-70">AIコマンダーにチャットしてスケジュールを生成しましょう</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
                {sortedTasks.map((task, index) => {
                    const StatusIcon = statusIcons[task.status || "pending"];
                    const CategoryIcon = categoryIcons[task.category || "personal"];
                    const isCompleted = task.status === "completed";
                    const isCancelled = task.status === "cancelled";

                    return (
                        <Card
                            key={task.id}
                            onClick={() => onTaskClick?.(task)}
                            className={cn(
                                "relative p-4 cursor-pointer transition-all duration-300",
                                "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10",
                                "border-l-4",
                                isCompleted && "opacity-60",
                                isCancelled && "opacity-40 line-through",
                                task.priority === "high" && "border-l-red-500",
                                task.priority === "medium" && "border-l-yellow-500",
                                task.priority === "low" && "border-l-green-500",
                                !task.priority && "border-l-primary/50"
                            )}
                        >
                            {/* Time indicator line */}
                            {index < sortedTasks.length - 1 && (
                                <div className="absolute left-[2.1rem] top-full w-0.5 h-3 bg-gradient-to-b from-muted-foreground/30 to-transparent" />
                            )}

                            <div className="flex items-start gap-4">
                                {/* Time column */}
                                <div className="flex flex-col items-center min-w-[50px]">
                                    <span className="text-lg font-bold text-primary">{task.time}</span>
                                    {task.duration && (
                                        <span className="text-xs text-muted-foreground">{task.duration}分</span>
                                    )}
                                </div>

                                {/* Status indicator */}
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                                    <StatusIcon
                                        className={cn(
                                            "w-4 h-4",
                                            task.status === "completed" && "text-green-500",
                                            task.status === "in-progress" && "text-yellow-500",
                                            task.status === "cancelled" && "text-red-500",
                                            task.status === "pending" && "text-muted-foreground"
                                        )}
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className={cn(
                                            "font-semibold text-foreground truncate",
                                            isCancelled && "line-through"
                                        )}>
                                            {task.title}
                                        </h3>
                                        {task.priority && (
                                            <div
                                                className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    priorityColors[task.priority]
                                                )}
                                                title={`${task.priority === "high" ? "高" : task.priority === "medium" ? "中" : "低"}優先度`}
                                            />
                                        )}
                                    </div>

                                    {task.description && (
                                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                            {task.description}
                                        </p>
                                    )}

                                    {task.category && (
                                        <Badge
                                            variant="outline"
                                            className={cn("text-xs", categoryColors[task.category])}
                                        >
                                            <CategoryIcon className="w-3 h-3 mr-1" />
                                            {categoryLabels[task.category]}
                                        </Badge>
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
