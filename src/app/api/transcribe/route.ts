import OpenAI from "openai";
import { NextRequest } from "next/server";

// Allow responses up to 60 seconds for audio processing
export const maxDuration = 60;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File;

        if (!audioFile) {
            return new Response(
                JSON.stringify({ error: "音声ファイルが見つかりません" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Transcribe with Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            language: "ja", // Japanese
            response_format: "text",
        });

        return new Response(
            JSON.stringify({ text: transcription }),
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
