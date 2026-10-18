import React from 'react';
import { Download, Sparkles, RefreshCw } from 'lucide-react';
import {
  type AspectRatioType,
  ASPECT_RATIOS,
  formatTime,
} from '../../utils/mediaUtils';
import { getTranslations, type LanguageCode } from '../../i18n/translations';

interface ExportBarProps {
  currentLang: LanguageCode;
  totalDuration: number;
  aspectRatio: AspectRatioType;
  exportFormat: 'mp4' | 'webm';
  onChangeExportFormat: (format: 'mp4' | 'webm') => void;
  exportQuality: 'ultra' | 'high' | 'standard';
  onChangeExportQuality: (quality: 'ultra' | 'high' | 'standard') => void;
  onExportClick: () => void;
  onNewProject: () => void;
  isExporting?: boolean;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  currentLang,
  totalDuration,
  aspectRatio,
  exportFormat,
  onChangeExportFormat,
  exportQuality,
  onChangeExportQuality,
  onExportClick,
  onNewProject,
  isExporting = false,
}) => {
  const t = getTranslations(currentLang);
  const spec = ASPECT_RATIOS[aspectRatio];

  return (
    <div className="sticky bottom-0 z-40 w-full border-t border-sand-200/80 dark:border-studio-border bg-white/95 dark:bg-studio-surface/95 backdrop-blur-md px-3 sm:px-6 py-3 shadow-luxury-light dark:shadow-luxury-dark transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: New Project & Duration/Resolution Stats */}
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          <button
            type="button"
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sand-200 dark:border-studio-border hover:bg-sand-100 dark:hover:bg-studio-card text-xs font-semibold text-olive-600 dark:text-sand-200 transition-colors"
            title={t.studio.newProject}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.studio.newProject}</span>
          </button>

          {/* Final output time */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-olive-500 dark:text-sage-400">
              {t.export.finalOutput}:
            </span>
            <span className="font-mono font-bold text-moss-800 dark:text-sand-200 text-sm">
              {formatTime(totalDuration)}
            </span>
          </div>

          {/* Video size */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-olive-500 dark:text-sage-400">
              {t.export.videoSize}:
            </span>
            <span className="font-mono font-bold text-moss-800 dark:text-sand-200">
              {spec.width}×{spec.height}
            </span>
          </div>
        </div>

        {/* Right: Format Selector & Export CTA Button */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Format Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="hidden sm:inline text-olive-500 dark:text-sage-400">
              {t.export.format}:
            </span>
            <select
              value={exportFormat}
              onChange={(e) =>
                onChangeExportFormat(e.target.value as 'mp4' | 'webm')
              }
              className="px-2.5 py-1.5 rounded-lg border border-sand-200 dark:border-studio-border bg-sand-50 dark:bg-studio-card text-moss-800 dark:text-sand-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sage-400"
            >
              <option value="mp4">MP4 (H.264)</option>
              <option value="webm">WebM (VP9)</option>
            </select>
          </div>

          {/* Quality Preset Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="hidden md:inline text-olive-500 dark:text-sage-400">
              Quality:
            </span>
            <select
              value={exportQuality}
              onChange={(e) =>
                onChangeExportQuality(e.target.value as 'ultra' | 'high' | 'standard')
              }
              className="px-2.5 py-1.5 rounded-lg border border-sand-200 dark:border-studio-border bg-sand-50 dark:bg-studio-card text-moss-800 dark:text-sand-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sage-400"
              title="Export Bitrate & Fidelity"
            >
              <option value="ultra">Ultra (Original / 22 Mbps)</option>
              <option value="high">High (14 Mbps)</option>
              <option value="standard">Standard (8 Mbps)</option>
            </select>
          </div>

          {/* Prominent Export CTA Button */}
          <button
            type="button"
            onClick={onExportClick}
            disabled={isExporting}
            className="px-5 sm:px-7 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-moss-600 hover:bg-moss-700 text-white dark:bg-sand-300 dark:text-studio-surface dark:hover:bg-sand-400 shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? t.export.exporting : t.export.exportBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
