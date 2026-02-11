"use client";

import { useState, useEffect, useCallback } from "react";

// カスタム指示のデフォルト値（空欄：ユーザーが自分で入力する）
const DEFAULT_INSTRUCTIONS = "";

interface UseLocalStorageReturn<T> {
    value: T;
    setValue: (value: T | ((prev: T) => T)) => void;
    isLoading: boolean;
}

// 汎用のlocalStorageフック
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): UseLocalStorageReturn<T> {
    const [value, setValueState] = useState<T>(initialValue);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(key);
            if (stored !== null) {
                setValueState(JSON.parse(stored));
            }
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
        } finally {
            setIsLoading(false);
        }
    }, [key]);

    // Use functional update to avoid stale closure issues
    const setValue = useCallback(
        (newValue: T | ((prev: T) => T)) => {
            try {
                if (typeof newValue === 'function') {
                    setValueState(prev => {
                        const updated = (newValue as (prev: T) => T)(prev);
                        localStorage.setItem(key, JSON.stringify(updated));
                        return updated;
                    });
                } else {
                    setValueState(newValue);
                    localStorage.setItem(key, JSON.stringify(newValue));
                }
            } catch (error) {
                console.error(`Error setting localStorage key "${key}":`, error);
            }
        },
        [key]
    );

    return { value, setValue, isLoading };
}

// カスタム指示用のフック
export function useCustomInstructions() {
    return useLocalStorage<string>("customInstructions", DEFAULT_INSTRUCTIONS);
}

// チャット履歴用の型
export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}

// チャット履歴用のフック
export function useChatHistory() {
    const { value, setValue, isLoading } = useLocalStorage<ChatMessage[]>(
        "chatHistory",
        []
    );

    const addMessage = useCallback(
        (message: Omit<ChatMessage, "id" | "timestamp">) => {
            const newMessage: ChatMessage = {
                ...message,
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
            };
            // Use functional update to avoid stale closure
            setValue((prev: ChatMessage[]) => [...prev, newMessage]);
            return newMessage;
        },
        [setValue]
    );

    const clearHistory = useCallback(() => {
        setValue([]);
    }, [setValue]);

    // 直近N件を取得
    const getRecentMessages = useCallback(
        (count: number = 20) => {
            return value.slice(-count);
        },
        [value]
    );

    // 会話サマリーを生成（コスト削減：簡潔に）
    const getConversationSummary = useCallback(() => {
        if (value.length === 0) return "";

        // 直近5件のユーザーメッセージだけ簡潔にまとめる
        const recentUserMsgs = value.filter(m => m.role === "user").slice(-5);
        if (recentUserMsgs.length === 0) return "";

        return recentUserMsgs.map(m =>
            m.content.length > 60 ? m.content.substring(0, 60) + "..." : m.content
        ).join(" / ");
    }, [value]);

    // 習慣パターンを抽出
    const extractHabits = (messages: ChatMessage[]): string[] => {
        const habits: string[] = [];
        const habitKeywords = [
            /毎朝|毎晩|毎日|いつも|習慣|ルーティン/,
            /月曜|火曜|水曜|木曜|金曜|土曜|日曜/,
            /[0-9]{1,2}時|[0-9]{1,2}:[0-9]{2}/,
        ];

        messages.forEach(msg => {
            if (msg.role === "user") {
                habitKeywords.forEach(regex => {
                    if (regex.test(msg.content) && msg.content.length < 100) {
                        // 短いメッセージで習慣に関する言及があれば記録
                        if (!habits.includes(msg.content)) {
                            habits.push(msg.content);
                        }
                    }
                });
            }
        });

        // 最大5件まで
        return habits.slice(-5);
    };

    // メッセージを更新（編集用）
    const updateMessage = useCallback(
        (id: string, newContent: string) => {
            // Use functional update to avoid stale closure
            setValue((prev: ChatMessage[]) =>
                prev.map(msg =>
                    msg.id === id ? { ...msg, content: newContent } : msg
                )
            );
        },
        [setValue]
    );

    // メッセージを編集し、それ以降のメッセージを削除（AI再生成用）
    const editAndRegenerateMessage = useCallback(
        (id: string, newContent: string): ChatMessage | null => {
            let editedMessage: ChatMessage | null = null;

            // Use functional update to avoid stale closure
            setValue((prev: ChatMessage[]) => {
                const messageIndex = prev.findIndex(msg => msg.id === id);
                if (messageIndex === -1) return prev;

                // Update the message and remove all messages after it
                const updatedMessages = prev.slice(0, messageIndex + 1);
                updatedMessages[messageIndex] = {
                    ...updatedMessages[messageIndex],
                    content: newContent
                };

                editedMessage = updatedMessages[messageIndex];
                return updatedMessages;
            });

            return editedMessage;
        },
        [setValue]
    );

    return {
        messages: value,
        addMessage,
        updateMessage,
        editAndRegenerateMessage,
        clearHistory,
        getRecentMessages,
        getConversationSummary,
        isLoading,
    };
}
