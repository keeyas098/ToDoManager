import { google } from "@ai-sdk/google";
import { generateText } from "ai";

// Default user context for demo - Japanese family
const defaultUserContext = {
    family_structure: {
        members: [
            { name: "あなた", relationship: "本人", workplace: "IT企業" },
            { name: "パートナー", relationship: "配偶者", workplace: "病院" },
            { name: "ゆうき", relationship: "息子", age: 5, school: "ひまわり幼稚園" },
            { name: "はな", relationship: "娘", age: 8, school: "さくら小学校" },
        ],
    },
    resources: {
        vehicles: ["ファミリーカー"],
        nearby_facilities: ["スーパー (5分)", "クリニック (10分)", "公園 (3分)"],
        support_network: ["おばあちゃん (週末に助けてくれる)"],
    },
    routines: [
        { name: "起床", time: "06:30", days: ["月", "火", "水", "木", "金"] },
        { name: "子供を学校へ", time: "08:00", days: ["月", "火", "水", "木", "金"] },
        { name: "仕事開始", time: "09:00", days: ["月", "火", "水", "木", "金"] },
        { name: "子供のお迎え", time: "15:30", days: ["月", "火", "水", "木", "金"] },
        { name: "夕食", time: "18:30", days: ["月", "火", "水", "木", "金", "土", "日"] },
        { name: "子供の就寝", time: "20:30", days: ["月", "火", "水", "木", "金", "土", "日"] },
    ],
};

const SYSTEM_PROMPT = `あなたは「ToDoManager AIアシスタント」、ユーザーの「第二の脳」として機能するスケジュール管理アシスタントです。

忙しい親が日々のスケジュールを動的に管理するのを助けます。状況や文脈の変化に応じてスケジュールをインテリジェントに更新します。

現在のユーザーコンテキスト（デフォルト値）:
${JSON.stringify(defaultUserContext, null, 2)}

※「ユーザー定義のコンテキスト」が提供された場合は、そちらを優先してください。

現在の日時: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}

あなたの責任:
1. ユーザーが状況を報告した場合（例：「息子が熱を出した」「雨が降っている」「今日は在宅勤務」）、スケジュールへの影響を分析する
2. 実用的な時間と説明を含むJSON形式の更新されたスケジュールを生成する
3. 推奨事項を説明するサポート的でアクション可能なメッセージを提供する
4. 代替案を提案する際は、家族のリソースとサポートネットワークを考慮する

応答フォーマット:
以下の正確なフォーマットで有効なJSONで応答してください:
{
  "tasks": [
    {
      "id": "一意のID",
      "time": "HH:mm",
      "title": "タスクのタイトル",
      "description": "簡単な説明（任意）",
      "duration": 30,
      "priority": "high" | "medium" | "low",
      "status": "pending",
      "category": "work" | "family" | "personal" | "health" | "errand"
    }
  ],
  "message": "スケジュールの変更を説明するサポートメッセージ",
  "affectedTasks": ["id1", "id2"],
  "reasoning": "これらの変更を行った理由の簡単な説明"
}

ガイドライン:
- メッセージは共感的でサポート的に
- 家族、特に子供の健康を最優先する
- 計画を変更する必要がある場合は実用的な代替案を提案する
- スケジュールは現実的で達成可能なものにする
- 24時間形式を使用する（例：「09:00」「15:30」）
- タスクIDは「task-{タイムスタンプ}-{ランダム}」の形式で生成する
- 日本語で応答してください

ユーザーが一般的な質問をしたり、スケジュールの変更なしにアドバイスが必要な場合でも、tasksを空の配列にしてメッセージをmessageフィールドに入れたJSON形式で応答してください。`;

// Allow responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages, currentSchedule, customInstructions, conversationSummary } = await req.json();

        // Enhance the system prompt with current schedule if available
        let enhancedPrompt = SYSTEM_PROMPT;

        if (customInstructions) {
            enhancedPrompt += `\n\n# ユーザー定義のコンテキスト\n以下の情報を優先して参照してください:\n${customInstructions}`;
        }

        if (conversationSummary) {
            enhancedPrompt += `\n\n# 会話履歴と学習した習慣\n${conversationSummary}`;
        }

        if (currentSchedule && currentSchedule.length > 0) {
            enhancedPrompt += `\n\n現在のスケジュール:\n${JSON.stringify(currentSchedule, null, 2)}`;
        }


        // Use generateText for non-streaming reliable response
        const result = await generateText({
            model: google("gemini-2.5-flash-lite-preview-09-2025"),
            system: enhancedPrompt,
            messages,
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
