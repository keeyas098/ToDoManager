"use client";

import { useState, useEffect, useCallback } from "react";

// カスタム指示のデフォルト値
const DEFAULT_INSTRUCTIONS = `# 家族構成
- 私（パパ）: IT企業勤務
- 妻: 病院勤務
- 長女（ひなの）: 小学校3年生
- 次女（ゆみの）: 小学校2年生
- 長男（きよみつ）: 保育園・6歳
- 三女（ちさの）: 保育園・3歳

# 日常ルーティン
- 06:00 起床
- 07:20 保育園組が妻と出発
- 07:30 長女・次女が学校へ
- 16:30 長女帰宅
- 18:00 入浴開始
- 19:30 夕食
- 21:00 就寝

# リソース
- ファミリーカー1台
- 衣類乾燥機（乾太くん）
- おじいちゃん（妻の実家）がサポート可能

# 習慣・その他
- 毎朝7:00〜7:25にトイレタイム
- 木曜日は長女のピアノ教室
- 水曜・土曜は燃えるゴミの日
`;

interface UseLocalStorageReturn<T> {
    value: T;
    setValue: (value: T) => void;
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

    const setValue = useCallback(
        (newValue: T) => {
            try {
                setValueState(newValue);
                localStorage.setItem(key, JSON.stringify(newValue));
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
            setValue([...value, newMessage]);
            return newMessage;
        },
        [value, setValue]
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

    // 会話サマリーを生成（最新10件 + 重要なポイント）
    const getConversationSummary = useCallback(() => {
        if (value.length === 0) return "";

        const recent = value.slice(-10);
        const summaryLines: string[] = [];

        // 最近の会話をまとめる
        summaryLines.push("# 最近の会話履歴");
        recent.forEach((msg, i) => {
            const role = msg.role === "user" ? "ユーザー" : "AI";
            const content = msg.content.length > 100
                ? msg.content.substring(0, 100) + "..."
                : msg.content;
            summaryLines.push(`${i + 1}. ${role}: ${content}`);
        });

        // 学習した習慣パターンを抽出
        const habits = extractHabits(value);
        if (habits.length > 0) {
            summaryLines.push("\n# 学習した習慣パターン");
            habits.forEach(habit => summaryLines.push(`- ${habit}`));
        }

        return summaryLines.join("\n");
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
            const updatedMessages = value.map(msg =>
                msg.id === id ? { ...msg, content: newContent } : msg
            );
            setValue(updatedMessages);
        },
        [value, setValue]
    );

    return {
        messages: value,
        addMessage,
        updateMessage,
        clearHistory,
        getRecentMessages,
        getConversationSummary,
        isLoading,
    };
}
