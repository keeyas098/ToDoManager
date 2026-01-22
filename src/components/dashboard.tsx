"use client";

import { useState } from "react";
import { Timeline } from "./timeline";
import { ChatInterface } from "./chat-interface";
import { Task, ScheduleUpdate } from "@/lib/types";
import { Calendar, MessageSquare, Zap, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Default demo schedule - Japanese
const defaultTasks: Task[] = [
    {
        id: "task-1",
        time: "06:30",
        title: "起床・朝の準備",
        description: "身支度、朝食の準備",
        duration: 60,
        priority: "medium",
        status: "completed",
        category: "personal",
    },
    {
        id: "task-2",
        time: "08:00",
        title: "子供を学校へ送る",
        description: "はなをさくら小学校へ、ゆうきをひまわり幼稚園へ",
        duration: 45,
        priority: "high",
        status: "completed",
        category: "family",
    },
    {
        id: "task-3",
        time: "09:00",
        title: "仕事開始",
        description: "朝のスタンドアップミーティング",
        duration: 30,
        priority: "high",
        status: "in-progress",
        category: "work",
    },
    {
        id: "task-4",
        time: "12:00",
        title: "昼食",
        duration: 60,
        priority: "low",
        status: "pending",
        category: "personal",
    },
    {
        id: "task-5",
        time: "15:30",
        title: "子供のお迎え",
        description: "学校と幼稚園からお迎え",
        duration: 45,
        priority: "high",
        status: "pending",
        category: "family",
    },
    {
        id: "task-6",
        time: "17:00",
        title: "子供の宿題",
        description: "はなの算数の宿題を手伝う",
        duration: 60,
        priority: "medium",
        status: "pending",
        category: "family",
    },
    {
        id: "task-7",
        time: "18:30",
        title: "夕食の準備",
        description: "家族の夕食を作る",
        duration: 60,
        priority: "medium",
        status: "pending",
        category: "family",
    },
    {
        id: "task-8",
        time: "20:30",
        title: "子供の就寝準備",
        description: "お風呂、読み聞かせ、就寝",
        duration: 45,
        priority: "high",
        status: "pending",
        category: "family",
    },
];

export function Dashboard() {
    const [tasks, setTasks] = useState<Task[]>(defaultTasks);
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);

    const handleScheduleUpdate = (update: ScheduleUpdate) => {
        if (update.tasks && update.tasks.length > 0) {
            setTasks(update.tasks);
            setLastUpdate(new Date().toLocaleTimeString("ja-JP"));
        }
    };

    const currentTime = new Date().toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    const currentDate = new Date().toLocaleDateString("ja-JP", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    const pendingTasks = tasks.filter((t) => t.status === "pending").length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-primary/5">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/25">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                                ToDoManager
                            </h1>
                            <p className="text-xs text-muted-foreground">あなたの第二の脳</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">{currentTime}</p>
                        <p className="text-xs text-muted-foreground">{currentDate}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Settings className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            {/* Stats bar */}
            <div className="flex items-center gap-4 px-6 py-3 border-b bg-muted/30">
                <Badge variant="secondary" className="gap-1">
                    <Calendar className="w-3 h-3" />
                    {tasks.length} タスク
                </Badge>
                <Badge variant="outline" className="gap-1 border-yellow-500/30 text-yellow-600">
                    {pendingTasks} 未完了
                </Badge>
                <Badge variant="outline" className="gap-1 border-green-500/30 text-green-600">
                    {completedTasks} 完了
                </Badge>
                {lastUpdate && (
                    <Badge variant="outline" className="gap-1 border-primary/30 text-primary ml-auto">
                        <Zap className="w-3 h-3" />
                        更新: {lastUpdate}
                    </Badge>
                )}
            </div>

            {/* Main content - Split view */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Timeline section */}
                <div className="flex-1 lg:w-1/2 border-b lg:border-b-0 lg:border-r overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b bg-background/50">
                        <Calendar className="w-4 h-4 text-primary" />
                        <h2 className="font-semibold text-foreground">今日のスケジュール</h2>
                    </div>
                    <div className="h-[calc(100%-49px)]">
                        <Timeline tasks={tasks} />
                    </div>
                </div>

                {/* Chat section */}
                <div className="flex-1 lg:w-1/2 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b bg-background/50">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <h2 className="font-semibold text-foreground">AIアシスタント</h2>
                    </div>
                    <div className="h-[calc(100%-49px)]">
                        <ChatInterface
                            currentSchedule={tasks}
                            onScheduleUpdate={handleScheduleUpdate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
