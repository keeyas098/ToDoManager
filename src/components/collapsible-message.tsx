"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

    // Count lines and determine if collapsible
    const lines = content.split("\n");
    const isLong = lines.length > 3 || content.length > 200;

    // Get preview (first 3 lines or 200 chars)
    const getPreview = () => {
        if (lines.length > 3) {
            return lines.slice(0, 3).join("\n") + "...";
        }
        if (content.length > 200) {
            return content.substring(0, 200) + "...";
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
            <Card className={cn("p-3", className)}>
                <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[80px] p-2 text-sm bg-muted rounded border-0 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                        <X className="w-3 h-3 mr-1" />
                        キャンセル
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit}>
                        <Check className="w-3 h-3 mr-1" />
                        保存
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className={cn("p-3 relative group", className)}>
            {/* Edit button for user messages */}
            {isUser && onEdit && (
                <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsEditing(true)}
                >
                    <Edit2 className="w-3 h-3" />
                </Button>
            )}

            <div className="text-sm whitespace-pre-wrap">
                {isLong && !isExpanded ? getPreview() : content}
            </div>

            {/* Expand/Collapse button */}
            {isLong && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="w-3 h-3 mr-1" />
                            折りたたむ
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-3 h-3 mr-1" />
                            続きを表示 ({lines.length}行)
                        </>
                    )}
                </Button>
            )}
        </Card>
    );
}
