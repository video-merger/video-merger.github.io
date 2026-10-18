import React from 'react';
import {
  Download,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Film,
  HardDrive,
} from 'lucide-react';
import {
  type CompositorProgress,
  type CompositorResult,
} from '../../utils/VideoCompositor';
import { formatTime } from '../../utils/mediaUtils';
import { getTranslations, type LanguageCode } from '../../i18n/translations';

interface ExportModalProps {
  currentLang: LanguageCode;
  progress: CompositorProgress | null;
  result: CompositorResult | null;
  error: string | null;
  onCancel: () => void;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  currentLang,
  progress,
  result,
  error,
  onCancel,
  onClose,
}) => {
  const t = getTranslations(currentLang);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const percent = progress?.percent || 0;
  const isComplete = result !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-studio-surface border border-sand-200 dark:border-studio-border shadow-luxury-light dark:shadow-luxury-dark overflow-hidden flex flex-col p-6 sm:p-8 relative">
        {/* Top Close / Cancel */}
        <div className="flex items-center justify-between pb-4 border-b border-sand-100 dark:border-studio-border mb-6">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-moss-600 dark:text-sand-300" />
            <h3 className="font-bold text-sm text-moss-800 dark:text-sand-100">
              {isComplete ? t.export.downloadReady : t.export.modalTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={isComplete ? onClose : onCancel}
            className="p-1.5 rounded-lg hover:bg-sand-100 dark:hover:bg-studio-card text-olive-500 hover:text-moss-700 dark:hover:text-sand-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* State 1: Error */}
        {error && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-base text-moss-800 dark:text-sand-100 mb-1">
              Rendering Interrupted
            </h4>
            <p className="text-xs text-olive-600 dark:text-sage-400 max-w-xs mb-6">
              {error}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-sand-200 dark:bg-studio-card text-moss-800 dark:text-sand-200 hover:bg-sand-300"
            >
              {t.export.close}
            </button>
          </div>
        )}

        {/* State 2: In Progress */}
        {!error && !isComplete && (
          <div className="flex flex-col items-center text-center">
            {/* Circular Progress & Percentage */}
            <div className="relative w-28 h-28 flex items-center justify-center mb-5">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-sand-200 dark:stroke-studio-card fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-moss-600 dark:stroke-sand-300 fill-none transition-all duration-300 ease-out"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * percent) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-2xl font-extrabold text-moss-800 dark:text-sand-100">
                  {percent}%
                </span>
                <span className="text-[10px] font-medium text-olive-500 dark:text-sage-400">
                  {progress ? formatTime(progress.currentTime) : '00:00'}
                </span>
              </div>
            </div>

            {/* Stage Description */}
            <h4 className="font-bold text-base text-moss-800 dark:text-sand-100 mb-1">
              {progress?.message || t.export.modalSubtitle}
            </h4>

            <p className="text-xs text-olive-500 dark:text-sage-400 max-w-xs mt-1 mb-6">
              {t.export.doNotClose}
            </p>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-olive-600 dark:text-sage-400 hover:bg-sand-100 dark:hover:bg-studio-card transition-colors"
            >
              {t.export.cancel}
            </button>
          </div>
        )}

        {/* State 3: Completed Ready for Download */}
        {isComplete && (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sand-300 to-sage-400 text-moss-900 flex items-center justify-center mb-4 shadow-glow-sand animate-pulse-subtle">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h4 className="font-extrabold text-xl text-moss-800 dark:text-sand-100 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-moss-600 dark:text-sand-300" />
              <span>{t.export.downloadReady}</span>
            </h4>

            {/* File Info Pill */}
            <div className="my-4 px-4 py-2.5 rounded-xl bg-sand-100 dark:bg-studio-card border border-sand-200 dark:border-studio-border flex items-center gap-3 text-xs font-mono text-moss-700 dark:text-sand-200">
              <HardDrive className="w-4 h-4 text-olive-500" />
              <span>{result.filename}</span>
              <span>•</span>
              <span className="font-bold text-moss-800 dark:text-sand-300">
                {formatFileSize(result.sizeBytes)}
              </span>
            </div>

            {/* Primary Download CTA Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-3.5 px-6 rounded-xl font-extrabold text-sm sm:text-base bg-moss-600 hover:bg-moss-700 text-white dark:bg-sand-300 dark:text-studio-surface dark:hover:bg-sand-400 shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mb-3"
            >
              <Download className="w-5 h-5" />
              <span>{t.export.downloadBtn}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-xs text-olive-500 dark:text-sage-400 hover:underline"
            >
              {t.export.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
