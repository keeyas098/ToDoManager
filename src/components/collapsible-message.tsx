"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleMessageProps {
    content: string;
    isUser: boolean;
    onEdit?: (newContent: string) => void;
    className?: string;
}

export function CollapsibleMessage({ content, isUser, onEdit, className }: CollapsibleMessageProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(content);

    // Only collapse very long user messages (5+ lines or 300+ chars)
    const lines = content.split("\n");
    const isLong = isUser && (lines.length > 5 || content.length > 300);

    // Get preview (first 4 lines or 250 chars)
    const getPreview = () => {
        if (lines.length > 5) {
            return lines.slice(0, 4).join("\n") + "...";
        }
        if (content.length > 300) {
            return content.substring(0, 250) + "...";
        }
        return content;
    };

    const handleSaveEdit = () => {
        if (onEdit && editContent.trim()) {
            onEdit(editContent.trim());
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditContent(content);
        setIsEditing(false);
    };

    if (isEditing && isUser) {
        return (
            <div className={cn("rounded-lg p-2 md:p-3", className)}>
                <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[60px] p-2 text-xs md:text-sm bg-background/50 rounded border-0 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                />
                <div className="flex justify-end gap-1 mt-1">
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 px-2 text-xs">
                        <X className="w-3 h-3 mr-0.5" />
                        取消
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit} className="h-6 px-2 text-xs">
                        <Check className="w-3 h-3 mr-0.5" />
                        保存
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 relative group inline-block", className)}>
            {/* Edit button for user messages - always visible on mobile, hover on desktop */}
            {isUser && onEdit && (
                <Button
                    size="icon"
                    variant="ghost"
                    className="absolute -top-1 -right-1 w-5 h-5 opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-background/80 rounded-full"
                    onClick={() => setIsEditing(true)}
                >
                    <Edit2 className="w-2.5 h-2.5" />
                </Button>
            )}

            <div className="text-xs md:text-sm whitespace-pre-wrap break-words">
                {isLong && !isExpanded ? getPreview() : content}
            </div>

            {/* Expand/Collapse button */}
            {isLong && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-1 h-5 text-[10px] text-muted-foreground hover:text-foreground"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="w-3 h-3 mr-0.5" />
                            折りたたむ
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-3 h-3 mr-0.5" />
                            続き ({lines.length}行)
                        </>
                    )}
                </Button>
            )}
        </div>
    );
}

