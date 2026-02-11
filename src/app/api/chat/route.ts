import { google } from "@ai-sdk/google";
import { generateText } from "ai";

// Function to generate system prompt with current time (called per request)
const getSystemPrompt = (currentTime: string) => {
    return `あなたはスケジュール管理AIです。ユーザーの状況に応じてスケジュールをJSON形式で更新します。

現在時刻: ${currentTime}

応答は必ず以下のJSON形式で返してください:
{"tasks":[{"id":"task-[timestamp]-[random]","time":"HH:mm","title":"タスク名","description":"説明","duration":30,"priority":"high|medium|low","status":"pending","category":"work|family|personal|health|errand"}],"message":"説明メッセージ","reasoning":"理由"}

ルール:
- 時刻は必ず${currentTime}以降の未来のみ。過去の時刻は禁止
- 深夜0:00-5:00は当日残り or 翌朝のタスクを提案
- 完了済みタスクは再スケジュールしない
- 24時間形式（09:00, 15:30）
- 日本語で応答
- スケジュール変更なしの場合もJSON形式（tasksは空配列）で応答`;
};

// Allow responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages, currentSchedule, completedTasks, customInstructions, conversationSummary, currentTime } = await req.json();

        // Use client time or generate server-side
        const now = new Date();
        const timeStr = currentTime || `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        // Build optimized prompt
        let prompt = getSystemPrompt(timeStr);

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
            model: google("gemini-2.5-flash-lite-preview-09-2025"),
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
