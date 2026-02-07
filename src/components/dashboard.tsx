"use client";

import { useState, useEffect } from "react";
import { Timeline } from "./timeline";
import { ChatInterface } from "./chat-interface";
import { Task, ScheduleUpdate } from "@/lib/types";
import { Calendar, MessageSquare, Zap, Settings } from "lucide-react";
import { SettingsDialog } from "./settings-dialog";
import { Button } from "@/components/ui/button";

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
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"schedule" | "chat">("schedule");
    const [isHydrated, setIsHydrated] = useState(false);

    // Touch handling for swipe gestures (horizontal only)
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
    const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

    // Minimum swipe distance for gesture
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY
        });
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY
        });
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distanceX = touchStart.x - touchEnd.x;
        const distanceY = touchStart.y - touchEnd.y;

        // Only trigger tab switch if horizontal movement is greater than vertical
        // This allows vertical scrolling to work normally
        if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > minSwipeDistance) {
            const isLeftSwipe = distanceX > 0;
            const isRightSwipe = distanceX < 0;

            if (isLeftSwipe && activeTab === "schedule") {
                setActiveTab("chat");
            } else if (isRightSwipe && activeTab === "chat") {
                setActiveTab("schedule");
            }
        }
    };

    // Time state - initialized empty to avoid Hydration mismatch
    const [currentTime, setCurrentTime] = useState<string>("");
    const [currentDate, setCurrentDate] = useState<string>("");

    // Load tasks from localStorage on mount
    useEffect(() => {
        const savedTasks = localStorage.getItem("todomanager-schedule");
        if (savedTasks) {
            try {
                const parsed = JSON.parse(savedTasks);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setTasks(parsed);
                }
            } catch (e) {
                console.error("Failed to parse saved schedule:", e);
            }
        }
        setIsHydrated(true);
    }, []);

    // Save tasks to localStorage whenever they change (after hydration)
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem("todomanager-schedule", JSON.stringify(tasks));
        }
    }, [tasks, isHydrated]);

    // Update time on client side only
    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }));
            setCurrentDate(new Date().toLocaleDateString("ja-JP", {
                weekday: "long",
                month: "long",
                day: "numeric",
            }));
        };

        updateTime(); // Initial update
        const interval = setInterval(updateTime, 1000); // Update every second

        return () => clearInterval(interval);
    }, []);

    const handleScheduleUpdate = (update: ScheduleUpdate) => {
        if (update.tasks && update.tasks.length > 0) {
            setTasks(update.tasks);
            setLastUpdate(new Date().toLocaleTimeString("ja-JP"));
        }
    };

    return (
        <div className="flex flex-col h-dvh bg-gradient-to-br from-background via-background to-primary/5">
            <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* Header - compact on mobile */}
            <header className="flex items-center justify-between px-3 py-2 md:px-6 md:py-4 border-b bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="w-6 h-6 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/25">
                            <Zap className="w-3 h-3 md:w-5 md:h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm md:text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                                ToDoManager
                            </h1>
                            <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">あなたの第二の脳</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="text-right">
                        <p className="text-base md:text-2xl font-bold text-foreground">{currentTime}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground">{currentDate}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full w-7 h-7 md:w-10 md:h-10"
                        onClick={() => setIsSettingsOpen(true)}
                    >
                        <Settings className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                </div>
            </header>

            {/* Mobile Tab Navigation - only visible on small screens */}
            <div className="flex lg:hidden border-b bg-background/80">
                <button
                    onClick={() => setActiveTab("schedule")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${activeTab === "schedule"
                        ? "text-primary border-b-2 border-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Calendar className="w-3 h-3" />
                    📅 {new Date().toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                </button>
                <button
                    onClick={() => setActiveTab("chat")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${activeTab === "chat"
                        ? "text-primary border-b-2 border-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <MessageSquare className="w-3 h-3" />
                    AIチャット
                </button>
            </div>

            {/* Main content - Split view on desktop, tabs on mobile with swipe support */}
            <div
                className="flex-1 flex flex-col lg:flex-row min-h-0"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Timeline section - hidden on mobile when chat tab is active */}
                <div className={`flex-1 lg:w-1/2 lg:border-r min-h-0 ${activeTab === "chat" ? "hidden lg:flex lg:flex-col" : "flex flex-col"}`}>
                    <div className="hidden lg:flex items-center gap-2 px-4 py-3 border-b bg-background/50">
                        <Calendar className="w-4 h-4 text-primary" />
                        <h2 className="font-semibold text-foreground">📅 {new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}のスケジュール</h2>
                    </div>
                    <div className="flex-1 min-h-0 overflow-auto">
                        <Timeline tasks={tasks} />
                    </div>
                </div>

                {/* Chat section - hidden on mobile when schedule tab is active */}
                <div className={`flex-1 lg:w-1/2 min-h-0 ${activeTab === "schedule" ? "hidden lg:flex lg:flex-col" : "flex flex-col"}`}>
                    <div className="hidden lg:flex items-center gap-2 px-4 py-3 border-b bg-background/50">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <h2 className="font-semibold text-foreground">AIアシスタント</h2>
                    </div>
                    <div className="flex-1 min-h-0 overflow-auto">
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
