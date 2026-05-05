import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle, CheckCircle2, HardDrive, Undo2, Redo2 } from 'lucide-react';
import { formatRelativeTime, getStorageUsage, formatBytes, checkStorageQuota } from '../utils/storageUtils';

interface SaveIndicatorProps {
    lastSavedTime: Date | null;
    isSaving?: boolean;
    canUndo?: boolean;
    canRedo?: boolean;
    onUndo?: () => void;
    onRedo?: () => void;
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
    lastSavedTime,
    isSaving = false,
    canUndo = false,
    canRedo = false,
    onUndo,
    onRedo,
}) => {
    const [relativeTime, setRelativeTime] = useState<string>('');
    const [storageInfo, setStorageInfo] = useState<{ used: string; isNearFull: boolean }>({
        used: '0 B',
        isNearFull: false,
    });
    const [showDetails, setShowDetails] = useState(false);

    // Update relative time every 10 seconds
    useEffect(() => {
        const updateTime = () => {
            if (lastSavedTime) {
                setRelativeTime(formatRelativeTime(lastSavedTime));
            }
        };

        updateTime();
        const interval = setInterval(updateTime, 10000);
        return () => clearInterval(interval);
    }, [lastSavedTime]);

    // Check storage usage on mount and periodically
    useEffect(() => {
        const checkStorage = async () => {
            const { totalBytes } = getStorageUsage();
            const quotaInfo = await checkStorageQuota();
            setStorageInfo({
                used: formatBytes(totalBytes),
                isNearFull: quotaInfo.isNearFull,
            });
        };

        checkStorage();
        const interval = setInterval(checkStorage, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [lastSavedTime]);

    return (
        <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2">
            {/* Undo/Redo buttons */}
            {(onUndo || onRedo) && (
                <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700/50 p-1">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className={`p-2 rounded transition-all ${canUndo
                                ? 'text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300'
                                : 'text-slate-600 cursor-not-allowed'
                            }`}
                        title="เลิกทำ (Undo)"
                    >
                        <Undo2 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className={`p-2 rounded transition-all ${canRedo
                                ? 'text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300'
                                : 'text-slate-600 cursor-not-allowed'
                            }`}
                        title="ทำซ้ำ (Redo)"
                    >
                        <Redo2 className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Save status */}
            <div
                className={`flex items-center gap-3 px-4 py-2 rounded-lg border backdrop-blur-sm transition-all cursor-pointer ${isSaving
                        ? 'bg-cyan-950/90 border-cyan-500/50 text-cyan-300'
                        : storageInfo.isNearFull
                            ? 'bg-amber-950/90 border-amber-500/50 text-amber-300'
                            : 'bg-slate-900/90 border-slate-700/50 text-slate-400'
                    }`}
                onClick={() => setShowDetails(!showDetails)}
            >
                {isSaving ? (
                    <>
                        <Save className="h-4 w-4 animate-pulse" />
                        <span className="text-xs font-medium">กำลังบันทึก...</span>
                    </>
                ) : storageInfo.isNearFull ? (
                    <>
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-medium">พื้นที่ใกล้เต็ม ({storageInfo.used})</span>
                    </>
                ) : lastSavedTime ? (
                    <>
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <span className="text-xs font-medium">บันทึกล่าสุด: {relativeTime}</span>
                    </>
                ) : (
                    <>
                        <HardDrive className="h-4 w-4" />
                        <span className="text-xs font-medium">ยังไม่มีการบันทึก</span>
                    </>
                )}
            </div>

            {/* Details popup */}
            {showDetails && (
                <div className="absolute bottom-full left-0 mb-2 p-4 bg-slate-900/95 backdrop-blur-sm rounded-lg border border-slate-700/50 shadow-xl min-w-[250px]">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-cyan-400" />
                        ข้อมูลการจัดเก็บ
                    </h4>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-slate-400">
                            <span>ขนาดข้อมูลที่ใช้:</span>
                            <span className="text-cyan-400 font-mono">{storageInfo.used}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                            <span>บันทึกล่าสุด:</span>
                            <span className="text-green-400">{relativeTime || '-'}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                            <span>สถานะ:</span>
                            <span className={storageInfo.isNearFull ? 'text-amber-400' : 'text-green-400'}>
                                {storageInfo.isNearFull ? 'พื้นที่ใกล้เต็ม' : 'ปกติ'}
                            </span>
                        </div>
                    </div>
                    {storageInfo.isNearFull && (
                        <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-[10px] text-amber-400">
                            ⚠️ แนะนำให้สำรองข้อมูลและลบข้อมูลเก่า
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
