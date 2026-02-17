"use client";

import { useState, useEffect, useRef } from "react";
import { Timeline } from "./timeline";
import { ChatInterface } from "./chat-interface";
import { Task, ScheduleUpdate } from "@/lib/types";
import { Calendar, MessageSquare, Zap, Settings } from "lucide-react";
import { SettingsDialog } from "./settings-dialog";
import { Button } from "@/components/ui/button";

// No default tasks - user creates their own schedule via AI chat
const defaultTasks: Task[] = [];

export function Dashboard() {
    const [tasks, setTasks] = useState<Task[]>(defaultTasks);
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"schedule" | "chat">("schedule");
    const [isHydrated, setIsHydrated] = useState(false);

    // Swipe handling for tab switching (horizontal swipes only)
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.targetTouches && e.targetTouches[0]) {
            setTouchStart({
                x: e.targetTouches[0].clientX,
                y: e.targetTouches[0].clientY
            });
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart) return;
        if (!e.changedTouches || !e.changedTouches[0]) {
            setTouchStart(null);
            return;
        }

        const touchEnd = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY
        };
        const diffX = touchStart.x - touchEnd.x;
        const diffY = touchStart.y - touchEnd.y;

        // Only activate on horizontal swipes (horizontal > vertical movement)
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0 && activeTab === "schedule") {
                setActiveTab("chat");
            } else if (diffX < 0 && activeTab === "chat") {
                setActiveTab("schedule");
            }
        }
        setTouchStart(null);
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

    // Handle task completion toggle
    const handleTaskToggle = (taskId: string, completed: boolean) => {
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === taskId
                    ? { ...task, status: completed ? "completed" : "pending" }
                    : task
            )
        );
        setLastUpdate(new Date().toLocaleTimeString("ja-JP"));
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

            {/* Mobile Tab Navigation - only visible on small screens, supports swipe */}
            <div
                className="flex lg:hidden border-b bg-background/80"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
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

            {/* Main content - Split view on desktop, tabs on mobile with swipe */}
            <div
                className="flex-1 flex flex-col lg:flex-row min-h-0"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Timeline section - hidden on mobile when chat tab is active */}
                <div className={`flex-1 lg:w-1/2 lg:border-r min-h-0 ${activeTab === "chat" ? "hidden lg:flex lg:flex-col" : "flex flex-col"}`}>
                    <div className="hidden lg:flex items-center gap-2 px-4 py-3 border-b bg-background/50">
                        <Calendar className="w-4 h-4 text-primary" />
                        <h2 className="font-semibold text-foreground">📅 {new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}のスケジュール</h2>
                    </div>
                    <div className="flex-1 min-h-0 overflow-auto">
                        <Timeline tasks={tasks} onTaskToggle={handleTaskToggle} />
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
