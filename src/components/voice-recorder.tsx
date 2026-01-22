"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
    onTranscription: (text: string) => void;
    disabled?: boolean;
}

export function VoiceRecorder({ onTranscription, disabled }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Use webm format for better browser compatibility
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: "audio/webm;codecs=opus"
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                // Create blob from chunks
                const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

                // Send to Whisper API
                setIsProcessing(true);
                try {
                    const formData = new FormData();
                    formData.append("audio", audioBlob, "recording.webm");

                    const response = await fetch("/api/transcribe", {
                        method: "POST",
                        body: formData,
                    });

                    if (!response.ok) {
                        throw new Error("Transcription failed");
                    }

                    const data = await response.json();
                    if (data.text) {
                        onTranscription(data.text);
                    } else if (data.error) {
                        console.error("Transcription error:", data.error);
                    }
                } catch (error) {
                    console.error("Error sending audio:", error);
                } finally {
                    setIsProcessing(false);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error starting recording:", error);
            alert("マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。");
        }
    }, [onTranscription]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    const handleClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <Button
            type="button"
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={handleClick}
            disabled={disabled || isProcessing}
            className={cn(
                "relative transition-all",
                isRecording && "animate-pulse ring-2 ring-red-500 ring-offset-2"
            )}
            title={isRecording ? "録音停止" : "音声入力"}
        >
            {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRecording ? (
                <Square className="w-4 h-4" />
            ) : (
                <Mic className="w-4 h-4" />
            )}
        </Button>
    );
}
