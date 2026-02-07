"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, RotateCcw, X, User, Clock, Car, Sparkles, Trash2 } from "lucide-react";
import { useCustomInstructions, useChatHistory } from "@/hooks/use-local-storage";

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

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

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
    const { value: savedInstructions, setValue: saveInstructions, isLoading } = useCustomInstructions();
    const { clearHistory: clearChatHistory } = useChatHistory();
    const [instructions, setInstructions] = useState(savedInstructions);
    const [isSaved, setIsSaved] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState<"chat" | "schedule" | null>(null);

    // savedInstructionsが読み込まれたら更新
    useState(() => {
        if (!isLoading && savedInstructions) {
            setInstructions(savedInstructions);
        }
    });

    const handleSave = () => {
        saveInstructions(instructions);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleReset = () => {
        setInstructions(DEFAULT_INSTRUCTIONS);
    };

    const handleClearChatHistory = () => {
        clearChatHistory();
        setShowResetConfirm(null);
    };

    const handleClearSchedule = () => {
        localStorage.removeItem("todomanager-schedule");
        setShowResetConfirm(null);
        // Reload to reset schedule
        window.location.reload();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 md:p-4">
            <Card className="w-full max-w-2xl max-h-[85vh] md:max-h-[90vh] flex flex-col bg-background border-border overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-3 md:p-4 border-b flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary" />
                        <h2 className="text-base md:text-lg font-semibold">設定</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Scrollable content area for mobile */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {/* Help badges */}
                    <div className="flex flex-wrap gap-2 px-3 md:px-4 pt-3 md:pt-4">
                        <Badge variant="outline" className="gap-1 text-xs">
                            <User className="w-3 h-3" />
                            家族構成
                        </Badge>
                        <Badge variant="outline" className="gap-1 text-xs">
                            <Clock className="w-3 h-3" />
                            ルーティン
                        </Badge>
                        <Badge variant="outline" className="gap-1 text-xs">
                            <Car className="w-3 h-3" />
                            リソース
                        </Badge>
                        <Badge variant="outline" className="gap-1 text-xs">
                            <Sparkles className="w-3 h-3" />
                            習慣
                        </Badge>
                    </div>

                    {/* Description */}
                    <p className="px-3 md:px-4 pt-2 text-xs md:text-sm text-muted-foreground">
                        AIがスケジュール調整時に参照する情報を記入してください。
                    </p>

                    {/* Textarea - scrollable on mobile */}
                    <div className="p-3 md:p-4">
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="家族構成、ルーティン、リソースなどを入力..."
                            className="w-full min-h-[200px] md:min-h-[300px] p-3 md:p-4 text-xs md:text-sm bg-muted rounded-lg border-0 resize-y focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                        />
                    </div>

                    {/* Data Reset Section */}
                    <div className="px-3 md:px-4 pb-3 md:pb-4 border-t pt-3 md:pt-4 mt-2">
                        <h3 className="text-sm font-semibold mb-3 text-foreground">データリセット</h3>
                        <div className="flex flex-col sm:flex-row gap-2">
                            {showResetConfirm === "chat" ? (
                                <div className="flex gap-2 items-center">
                                    <span className="text-xs text-destructive">本当に削除しますか？</span>
                                    <Button size="sm" variant="destructive" onClick={handleClearChatHistory}>
                                        削除
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setShowResetConfirm(null)}>
                                        キャンセル
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowResetConfirm("chat")}
                                    className="gap-2 text-destructive border-destructive/50 hover:bg-destructive/10"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    チャット履歴を削除
                                </Button>
                            )}

                            {showResetConfirm === "schedule" ? (
                                <div className="flex gap-2 items-center">
                                    <span className="text-xs text-destructive">本当に削除しますか？</span>
                                    <Button size="sm" variant="destructive" onClick={handleClearSchedule}>
                                        削除
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setShowResetConfirm(null)}>
                                        キャンセル
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowResetConfirm("schedule")}
                                    className="gap-2 text-destructive border-destructive/50 hover:bg-destructive/10"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    スケジュールをリセット
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer - fixed at bottom */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 md:p-4 border-t flex-shrink-0 bg-background">
                    <Button variant="outline" onClick={handleReset} className="gap-2 text-xs md:text-sm" size="sm">
                        <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
                        デフォルトに戻す
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} size="sm" className="text-xs md:text-sm flex-1 sm:flex-none">
                            キャンセル
                        </Button>
                        <Button onClick={handleSave} className="gap-2 bg-primary text-xs md:text-sm flex-1 sm:flex-none" size="sm">
                            <Save className="w-3 h-3 md:w-4 md:h-4" />
                            {isSaved ? "保存しました！" : "保存"}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
