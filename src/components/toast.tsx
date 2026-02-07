"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
    message: string;
    type?: "error" | "success" | "info";
    duration?: number;
    onClose: () => void;
}

export function Toast({ message, type = "error", duration = 5000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    return (
        <div
            className={cn(
                "fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] md:max-w-md",
                "transition-all duration-300 ease-out",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
            )}
        >
            <div
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm",
                    type === "error" && "bg-red-500/90 text-white",
                    type === "success" && "bg-green-500/90 text-white",
                    type === "info" && "bg-blue-500/90 text-white"
                )}
            >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-xs md:text-sm font-medium flex-1">{message}</p>
                <button
                    onClick={handleClose}
                    className="p-0.5 hover:bg-white/20 rounded transition-colors"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
