import { google } from "@ai-sdk/google";
import { generateText } from "ai";

// Day of week names in Japanese
const DAY_NAMES = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];

// Generate accurate time context for system prompt
const getTimeContext = () => {
    const now = new Date();
    // Force Asia/Tokyo timezone for consistent Japan time
    const jpOptions: Intl.DateTimeFormatOptions = { timeZone: "Asia/Tokyo" };
    const year = now.toLocaleString("ja-JP", { ...jpOptions, year: "numeric" });
    const month = now.toLocaleString("ja-JP", { ...jpOptions, month: "2-digit" });
    const day = now.toLocaleString("ja-JP", { ...jpOptions, day: "2-digit" });
    const hour = now.toLocaleString("ja-JP", { ...jpOptions, hour: "2-digit", hour12: false });
    const minute = now.toLocaleString("ja-JP", { ...jpOptions, minute: "2-digit" });
    const weekday = now.toLocaleString("ja-JP", { ...jpOptions, weekday: "long" });

    const dateStr = `${year}${month}${day}`;
    const timeStr = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

    return { dateStr, timeStr, weekday };
};

// Function to generate system prompt with current time (called per request)
const getSystemPrompt = () => {
    const { dateStr, timeStr, weekday } = getTimeContext();

    return `あなたはスケジュール管理AIです。ユーザーの状況に応じてスケジュールをJSON形式で更新します。

⏰ 現在: ${dateStr}（${weekday}）${timeStr}

応答は必ず以下のJSON形式で返してください:
{"tasks":[{"id":"task-[timestamp]-[random]","time":"HH:mm","title":"タスク名","description":"説明","duration":30,"priority":"high|medium|low","status":"pending","category":"work|family|personal|health|errand"}],"message":"説明メッセージ","reasoning":"理由"}

【厳格ルール - 時刻】
- 全タスクの時刻は必ず ${timeStr} 以降（未来）のみ。${timeStr}以前の時刻は絶対禁止
- 今日は${weekday}。曜日固有のタスク（例：月曜の会議、水曜のゴミ出し）は正しい曜日に設定
- 「明日」と言われたら翌日のタスクとして扱い、時刻制限は00:00以降でOK
- 深夜0:00-5:00の場合：ユーザーに「今日中か翌朝か」を確認するメッセージを含める
- 24時間形式（09:00, 15:30）。12時間形式は使用禁止
- 完了済みタスクは再スケジュール禁止
- 日本語で応答
- スケジュール変更なしでもJSON形式（tasksは空配列）で応答`;
};

// Allow responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages, currentSchedule, completedTasks, customInstructions, conversationSummary } = await req.json();

        // Build optimized prompt with server-generated time (always accurate)
        let prompt = getSystemPrompt();

        // Custom instructions (highest priority - user's personal context)
        if (customInstructions && customInstructions.trim()) {
            prompt += `\n\n【ユーザー情報 - 必ずスケジュールに反映】\n${customInstructions}`;
        }

        // Completed tasks (don't reschedule these)
        if (completedTasks && completedTasks.length > 0) {
            prompt += `\n\n【完了済み - 再スケジュール禁止】\n${completedTasks.map((t: { title: string, time: string }) => `✓ ${t.time} ${t.title}`).join('\n')}`;
        }

        // Current pending schedule
        if (currentSchedule && currentSchedule.length > 0) {
            prompt += `\n\n【現在の未完了スケジュール】\n${JSON.stringify(currentSchedule)}`;
        }

        // Brief conversation context
        if (conversationSummary && conversationSummary.trim()) {
            prompt += `\n\n【最近の会話】${conversationSummary}`;
        }

        // Limit messages to last 5 for cost reduction
        const recentMessages = Array.isArray(messages) ? messages.slice(-5) : messages;

        // Use generateText for non-streaming reliable response
        const result = await generateText({
            model: google("gemini-3-flash-preview"),
            system: prompt,
            messages: recentMessages,
        });

        // Return text response
        return new Response(result.text, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    } catch (error) {
        console.error("Chat API error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new Response(
            JSON.stringify({
                tasks: [],
                message: `エラーが発生しました: ${errorMessage}。API設定を確認してください。`,
                reasoning: "API呼び出しに失敗しました"
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    }
}
