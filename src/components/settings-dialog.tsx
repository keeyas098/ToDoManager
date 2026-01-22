"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, RotateCcw, X, User, Clock, Car, Sparkles } from "lucide-react";
import { useCustomInstructions } from "@/hooks/use-local-storage";

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
    const [instructions, setInstructions] = useState(savedInstructions);
    const [isSaved, setIsSaved] = useState(false);

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-2xl max-h-[90vh] m-4 flex flex-col bg-background border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">カスタム指示</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Help badges */}
                <div className="flex flex-wrap gap-2 px-4 pt-4">
                    <Badge variant="outline" className="gap-1">
                        <User className="w-3 h-3" />
                        家族構成
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                        <Clock className="w-3 h-3" />
                        ルーティン
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                        <Car className="w-3 h-3" />
                        リソース
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                        <Sparkles className="w-3 h-3" />
                        習慣
                    </Badge>
                </div>

                {/* Description */}
                <p className="px-4 pt-2 text-sm text-muted-foreground">
                    AIがスケジュール調整時に参照する情報を記入してください。
                    マークダウン形式で記述できます。
                </p>

                {/* Textarea */}
                <ScrollArea className="flex-1 p-4">
                    <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="家族構成、ルーティン、リソースなどを入力..."
                        className="w-full h-[400px] p-4 text-sm bg-muted rounded-lg border-0 resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                </ScrollArea>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t">
                    <Button variant="outline" onClick={handleReset} className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        デフォルトに戻す
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>
                            キャンセル
                        </Button>
                        <Button onClick={handleSave} className="gap-2 bg-primary">
                            <Save className="w-4 h-4" />
                            {isSaved ? "保存しました！" : "保存"}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
