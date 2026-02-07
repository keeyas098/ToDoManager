"use client";

import { useRef, useEffect, useState, FormEvent, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Loader2, Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task, ScheduleUpdate } from "@/lib/types";
import { VoiceRecorder } from "./voice-recorder";
import { CollapsibleMessage } from "./collapsible-message";
import { Toast } from "./toast";

import { useChatHistory, useCustomInstructions } from "@/hooks/use-local-storage";

interface ChatInterfaceProps {
    currentSchedule: Task[];
    onScheduleUpdate: (update: ScheduleUpdate) => void;
}

export function ChatInterface({ currentSchedule, onScheduleUpdate }: ChatInterfaceProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { messages, addMessage, updateMessage, editAndRegenerateMessage, getConversationSummary, isLoading: isHistoryLoading } = useChatHistory();
    const { value: customInstructions } = useCustomInstructions();
    const [input, setInput] = useState("");
    const [isApiLoading, setIsApiLoading] = useState(false);
    const [toastError, setToastError] = useState<string | null>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Scroll to bottom helper
    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    // Track scroll position to show/hide scroll button
    const handleScroll = useCallback(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
        }
    }, []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Handle input focus - scroll to bottom for keyboard
    const handleInputFocus = useCallback(() => {
        // Small delay to wait for keyboard to appear
        setTimeout(() => {
            scrollToBottom();
            // Also scroll the window to ensure input is visible
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 300);
    }, [scrollToBottom]);

    // Format timestamp for display
    const formatTimestamp = useCallback((timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
        } else {
            return date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }) +
                " " + date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
        }
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isApiLoading) return;

        // Add user message to history
        const userMsg = addMessage({
            role: "user",
            content: input.trim()
        });

        setInput("");
        setIsApiLoading(true);
        setToastError(null);

        try {
            // Prepare messages context (last 10 messages + new one)
            const historyContext = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));

            historyContext.push({
                role: userMsg.role,
                content: userMsg.content
            });

            // Get conversation summary for context
            const conversationSummary = getConversationSummary();

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: historyContext,
                    currentSchedule,
                    customInstructions,
                    conversationSummary,
                }),
            });

            if (!response.ok) {
                throw new Error("AIからの応答取得に失敗しました");
            }

            const text = await response.text();

            // Add assistant message to history
            addMessage({
                role: "assistant",
                content: text
            });

            // Try to parse the response as JSON schedule update
            try {
                const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
                const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
                const scheduleUpdate = JSON.parse(jsonStr) as ScheduleUpdate;
                if (scheduleUpdate.tasks && Array.isArray(scheduleUpdate.tasks)) {
                    onScheduleUpdate(scheduleUpdate);
                }
            } catch {
                // Not a JSON response, that's okay
                console.log("スケジュール更新ではありません");
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "不明なエラー";
            setToastError(errorMsg);
        } finally {
            setIsApiLoading(false);
        }
    };

    // Format message content - extract text from JSON and format for display
    const formatMessageContent = (content: string): string => {
        try {
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
            const parsed = JSON.parse(jsonStr);
            if (parsed.message) {
                let result = parsed.message;
                if (parsed.reasoning) {
                    result += "\n\n💡 " + parsed.reasoning;
                }
                if (parsed.tasks && parsed.tasks.length > 0) {
                    result += "\n\n✨ " + parsed.tasks.length + "件のタスクを更新しました";
                }
                return result;
            }
        } catch {
            // Not JSON, return as-is
        }
        return content;
    };

    // Edit a message and regenerate AI response
    const handleEditAndRegenerate = async (messageId: string, newContent: string) => {
        if (isApiLoading) return;

        // Edit the message and remove all subsequent messages
        editAndRegenerateMessage(messageId, newContent);

        setIsApiLoading(true);
        setToastError(null);

        try {
            // Small delay to allow state to update
            await new Promise(resolve => setTimeout(resolve, 100));

            // Get updated messages (use current messages slice since we removed later ones)
            const currentMessages = messages.filter((_, index) => {
                const targetIndex = messages.findIndex(m => m.id === messageId);
                return index <= targetIndex;
            }).map(m => m.id === messageId ? { ...m, content: newContent } : m);

            // Prepare messages context
            const historyContext = currentMessages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));

            const conversationSummary = getConversationSummary();

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: historyContext,
                    currentSchedule,
                    customInstructions,
                    conversationSummary,
                }),
            });

            if (!response.ok) {
                throw new Error("AIからの応答取得に失敗しました");
            }

            const text = await response.text();

            // Add assistant message to history
            addMessage({
                role: "assistant",
                content: text
            });

            // Try to parse the response as JSON schedule update
            try {
                const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
                const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
                const scheduleUpdate = JSON.parse(jsonStr) as ScheduleUpdate;
                if (scheduleUpdate.tasks && Array.isArray(scheduleUpdate.tasks)) {
                    onScheduleUpdate(scheduleUpdate);
                }
            } catch {
                console.log("スケジュール更新ではありません");
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "不明なエラー";
            setToastError(errorMsg);
        } finally {
            setIsApiLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
            {/* Toast notification for errors */}
            {toastError && (
                <Toast
                    message={toastError}
                    type="error"
                    onClose={() => setToastError(null)}
                />
            )}

            {/* Chat header - compact on mobile */}
            <div className="flex items-center gap-2 md:gap-3 p-2 md:p-4 border-b bg-gradient-to-r from-primary/10 to-purple-500/10">
                <div className="relative">
                    <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-background" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground text-sm md:text-base">AIアシスタント</h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">あなたのスケジュール管理パートナー</p>
                </div>
            </div>

            {/* Messages area with scroll button */}
            <div className="relative flex-1 min-h-0">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="h-full overflow-y-auto p-2 md:p-4"
                >
                    <div className="space-y-3 md:space-y-4">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-4 md:py-8 text-center">
                                <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-3 md:mb-4">
                                    <Sparkles className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                                </div>
                                <h4 className="font-medium text-foreground mb-1 md:mb-2 text-sm md:text-base">準備完了！</h4>
                                <p className="text-xs md:text-sm text-muted-foreground max-w-[240px] md:max-w-[280px]">
                                    状況を教えてください。スケジュールを調整します。
                                    例：「息子が熱を出した」「今日は在宅勤務」
                                </p>
                            </div>
                        )}

                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex flex-col gap-0.5",
                                    message.role === "user" ? "items-end" : "items-start"
                                )}
                            >
                                <div className={cn(
                                    "flex gap-1.5 md:gap-3",
                                    message.role === "user" ? "justify-end" : "justify-start"
                                )}>
                                    {message.role === "assistant" && (
                                        <Avatar className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-primary to-green-600 flex items-center justify-center flex-shrink-0">
                                            <Bot className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                        </Avatar>
                                    )}

                                    {message.role === "user" ? (
                                        <CollapsibleMessage
                                            content={message.content}
                                            isUser={true}
                                            onEdit={(newContent) => handleEditAndRegenerate(message.id, newContent)}
                                            className="max-w-[80%] md:max-w-[85%] bg-primary text-primary-foreground"
                                        />
                                    ) : (
                                        <CollapsibleMessage
                                            content={formatMessageContent(message.content)}
                                            isUser={false}
                                            className="max-w-[80%] md:max-w-[85%] bg-muted"
                                        />
                                    )}

                                    {message.role === "user" && (
                                        <Avatar className="w-6 h-6 md:w-8 md:h-8 bg-muted flex items-center justify-center flex-shrink-0">
                                            <User className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                                        </Avatar>
                                    )}
                                </div>
                                {/* Timestamp */}
                                <span className={cn(
                                    "text-[10px] text-muted-foreground/70 px-1",
                                    message.role === "user" ? "mr-8 md:mr-10" : "ml-8 md:ml-10"
                                )}>
                                    {formatTimestamp(message.timestamp)}
                                </span>
                            </div>
                        ))}

                        {isApiLoading && (
                            <div className="flex gap-3 justify-start">
                                <Avatar className="w-8 h-8 bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-white" />
                                </Avatar>
                                <Card className="bg-muted p-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>分析中...</span>
                                    </div>
                                </Card>
                            </div>
                        )}

                    </div>
                </div>

                {/* Scroll to bottom button */}
                {showScrollButton && (
                    <button
                        onClick={scrollToBottom}
                        className="absolute bottom-4 right-4 w-10 h-10 bg-primary/90 hover:bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all"
                        aria-label="最新メッセージへ"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Input area - compact on mobile */}
            <form onSubmit={handleSubmit} className="p-2 md:p-4 border-t bg-background/80 backdrop-blur-sm">
                <div className="flex gap-1.5 md:gap-2 items-end">
                    <VoiceRecorder
                        onTranscription={(text) => setInput(prev => prev + text)}
                        disabled={isApiLoading}
                    />
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            // Auto-resize textarea
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                        }}
                        onFocus={handleInputFocus}
                        onKeyDown={(e) => {
                            // Desktop only: Submit on Enter without Shift
                            // Mobile: Enter adds newline, users tap send button
                            const isMobile = window.innerWidth < 768;
                            if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
                                e.preventDefault();
                                if (input.trim() && !isApiLoading) {
                                    handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
                                }
                            }
                        }}
                        placeholder="状況を入力..."
                        disabled={isApiLoading}
                        rows={1}
                        className="flex-1 bg-muted border-0 rounded-md px-3 py-2 resize-none overflow-hidden focus:outline-none focus:ring-1 focus:ring-primary text-xs md:text-base min-h-[32px] md:min-h-[40px] max-h-[100px]"
                    />
                    <Button
                        type="submit"
                        disabled={isApiLoading || !input.trim()}
                        className="bg-gradient-to-r from-primary to-purple-500 hover:opacity-90 h-8 w-8 md:h-10 md:w-10 p-0 flex-shrink-0"
                        size="icon"
                    >
                        {isApiLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
                {/* Safe area spacer for mobile browser navigation */}
                <div className="h-[env(safe-area-inset-bottom,0px)]" />
            </form>
        </div>
    );
}
