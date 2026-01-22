import OpenAI from "openai";
import { NextRequest } from "next/server";

// Allow responses up to 60 seconds for audio processing
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    // Check API key first
    if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY is not set");
        return new Response(
            JSON.stringify({ error: "OpenAI APIキーが設定されていません。.env.localを確認してください。" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File;

        if (!audioFile) {
            return new Response(
                JSON.stringify({ error: "音声ファイルが見つかりません" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log("Audio file received:", audioFile.name, "size:", audioFile.size, "type:", audioFile.type);

        // Convert File to the format OpenAI expects
        const buffer = Buffer.from(await audioFile.arrayBuffer());
        const file = new File([buffer], "audio.webm", { type: audioFile.type });

        // Transcribe with Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: "whisper-1",
            language: "ja", // Japanese
        });

        console.log("Transcription result:", transcription.text);

        return new Response(
            JSON.stringify({ text: transcription.text }),
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Transcription error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new Response(
            JSON.stringify({ error: `音声認識に失敗しました: ${errorMessage}` }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
