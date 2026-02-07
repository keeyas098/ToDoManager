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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineProps {
    tasks: Task[];
    onTaskClick?: (task: Task) => void;
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

export function Timeline({ tasks, onTaskClick }: TimelineProps) {
    // Filter out past and completed tasks, then sort by time
    const activeTasks = tasks
        .filter(task => {
            // Hide completed or cancelled tasks
            if (task.status === "completed" || task.status === "cancelled") {
                return false;
            }
            // Hide tasks whose time has passed
            if (isTaskPast(task.time)) {
                return false;
            }
            return true;
        })
        .sort((a, b) => a.time.localeCompare(b.time));

    if (activeTasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 md:p-8">
                <AlertCircle className="w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-4 opacity-50" />
                <p className="text-sm md:text-lg font-medium">残りのスケジュールはありません</p>
                <p className="text-xs md:text-sm opacity-70">AIにチャットして追加しましょう</p>
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

                                {/* Status indicator - smaller */}
                                <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-muted flex-shrink-0">
                                    <StatusIcon
                                        className={cn(
                                            "w-3 h-3 md:w-3.5 md:h-3.5",
                                            task.status === "in-progress" && "text-yellow-500",
                                            task.status === "pending" && "text-muted-foreground"
                                        )}
                                    />
                                </div>

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
                                        <p className="text-xs text-muted-foreground break-words">
                                            {task.description}
                                        </p>
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
