import React, { useRef } from 'react';
import {
  Plus,
  Crop,
  Layers,
  Sparkles,
  Music,
  Trash2,
  Volume2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  type AspectRatioType,
  type CropModeType,
  type AudioItem,
  ASPECT_RATIOS,
  formatTime,
} from '../../utils/mediaUtils';
import { getTranslations, type LanguageCode } from '../../i18n/translations';

interface InspectorSidebarProps {
  currentLang: LanguageCode;
  aspectRatio: AspectRatioType;
  onSelectAspectRatio: (ratio: AspectRatioType) => void;
  cropMode: CropModeType;
  onSelectCropMode: (mode: CropModeType) => void;
  crossfade: boolean;
  onToggleCrossfade: (enabled: boolean) => void;
  crossfadeDuration: number;
  onChangeCrossfadeDuration: (duration: number) => void;
  audioTrack: AudioItem | null;
  onAddAudioFile: (file: File) => Promise<void>;
  onRemoveAudio: () => void;
  masterVideoVolume: number;
  onChangeVideoVolume: (vol: number) => void;
  soundtrackVolume: number;
  onChangeSoundtrackVolume: (vol: number) => void;
  onAddMoreFilesClick: () => void;
}

export const InspectorSidebar: React.FC<InspectorSidebarProps> = ({
  currentLang,
  aspectRatio,
  onSelectAspectRatio,
  cropMode,
  onSelectCropMode,
  crossfade,
  onToggleCrossfade,
  crossfadeDuration,
  onChangeCrossfadeDuration,
  audioTrack,
  onAddAudioFile,
  onRemoveAudio,
  masterVideoVolume,
  onChangeVideoVolume,
  soundtrackVolume,
  onChangeSoundtrackVolume,
  onAddMoreFilesClick,
}) => {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const t = getTranslations(currentLang);

  const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await onAddAudioFile(e.target.files[0]);
    }
  };

  return (
    <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
      {/* Quick Add More Files Button */}
      <button
        type="button"
        onClick={onAddMoreFilesClick}
        className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-sand-300 via-sage-400 to-sand-300 dark:from-sand-300 dark:to-sage-400 text-moss-900 dark:text-studio-surface shadow-md hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span>{t.studio.addMoreFiles}</span>
      </button>

      {/* Main Inspector Card */}
      <div className="rounded-2xl border border-sand-200/80 dark:border-studio-border bg-white/80 dark:bg-studio-surface/90 p-4 sm:p-5 shadow-sm backdrop-blur-md flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-2 pb-3 border-b border-sand-100 dark:border-studio-border">
          <SlidersHorizontal className="w-4 h-4 text-moss-600 dark:text-sand-300" />
          <h2 className="text-sm font-bold text-moss-800 dark:text-sand-100">
            {t.studio.inspectorTitle}
          </h2>
        </div>

        {/* 1. Aspect Ratio Selector Pills */}
        <div>
          <label className="block text-xs font-semibold text-moss-700 dark:text-sand-300 mb-2.5">
            {t.studio.aspectRatio}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ASPECT_RATIOS) as AspectRatioType[]).map((ratioKey) => {
              const spec = ASPECT_RATIOS[ratioKey];
              const isSelected = aspectRatio === ratioKey;

              return (
                <button
                  key={ratioKey}
                  type="button"
                  onClick={() => onSelectAspectRatio(ratioKey)}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-moss-600 dark:border-sand-300 bg-sand-200/50 dark:bg-sand-300/15 shadow-sm ring-1 ring-moss-600/20 dark:ring-sand-300/30'
                      : 'border-sand-200 dark:border-studio-border bg-white/50 dark:bg-studio-card/60 hover:bg-sand-50 dark:hover:bg-studio-card text-moss-700 dark:text-sand-200'
                  }`}
                >
                  <span
                    className={`font-mono font-bold text-sm ${
                      isSelected
                        ? 'text-moss-800 dark:text-sand-300'
                        : 'text-moss-700 dark:text-sand-200'
                    }`}
                  >
                    {spec.label}
                  </span>
                  <span className="text-[10px] text-olive-500 dark:text-sage-400 truncate max-w-full">
                    {spec.width}×{spec.height}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Crop Options */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-semibold text-moss-700 dark:text-sand-300 flex items-center gap-1.5">
              <Crop className="w-3.5 h-3.5 text-moss-600 dark:text-sand-300" />
              <span>{t.studio.cropOptions}</span>
            </label>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => onSelectCropMode('fit')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                cropMode === 'fit'
                  ? 'border-moss-600 dark:border-sand-300 bg-sand-100 dark:bg-sand-300/10 text-moss-800 dark:text-sand-300'
                  : 'border-sand-200 dark:border-studio-border bg-white/40 dark:bg-studio-card/40 hover:bg-sand-50 dark:hover:bg-studio-card text-moss-700 dark:text-sand-200'
              }`}
            >
              <span>{t.studio.cropModes.fit}</span>
              {cropMode === 'fit' && (
                <span className="w-2 h-2 rounded-full bg-moss-600 dark:bg-sand-300" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectCropMode('fill')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                cropMode === 'fill'
                  ? 'border-moss-600 dark:border-sand-300 bg-sand-100 dark:bg-sand-300/10 text-moss-800 dark:text-sand-300'
                  : 'border-sand-200 dark:border-studio-border bg-white/40 dark:bg-studio-card/40 hover:bg-sand-50 dark:hover:bg-studio-card text-moss-700 dark:text-sand-200'
              }`}
            >
              <span>{t.studio.cropModes.fill}</span>
              {cropMode === 'fill' && (
                <span className="w-2 h-2 rounded-full bg-moss-600 dark:bg-sand-300" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectCropMode('blur')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                cropMode === 'blur'
                  ? 'border-moss-600 dark:border-sand-300 bg-sand-100 dark:bg-sand-300/10 text-moss-800 dark:text-sand-300'
                  : 'border-sand-200 dark:border-studio-border bg-white/40 dark:bg-studio-card/40 hover:bg-sand-50 dark:hover:bg-studio-card text-moss-700 dark:text-sand-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>{t.studio.cropModes.blur}</span>
                <span className="text-[10px] px-1 rounded bg-sand-300/50 dark:bg-sand-300/20 text-moss-800 dark:text-sand-300">
                  Cinematic
                </span>
              </div>
              {cropMode === 'blur' && (
                <span className="w-2 h-2 rounded-full bg-moss-600 dark:bg-sand-300" />
              )}
            </button>
          </div>
        </div>

        {/* 3. Crossfade Smooth Transition */}
        <div className="pt-2 border-t border-sand-100 dark:border-studio-border">
          <div className="flex items-center justify-between">
            <label
              htmlFor="crossfade-toggle"
              className="text-xs font-semibold text-moss-700 dark:text-sand-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-moss-600 dark:text-sand-300" />
              <span>{t.studio.crossfade}</span>
            </label>
            <input
              id="crossfade-toggle"
              type="checkbox"
              checked={crossfade}
              onChange={(e) => onToggleCrossfade(e.target.checked)}
              className="w-4 h-4 rounded text-moss-600 accent-moss-600 dark:accent-sand-300 cursor-pointer"
            />
          </div>
          <p className="mt-1 text-[11px] text-olive-500 dark:text-sage-400">
            {t.studio.crossfadeHint}
          </p>

          {crossfade && (
            <div className="mt-3 p-2.5 rounded-lg bg-sand-100/60 dark:bg-studio-card/60 border border-sand-200/50 dark:border-studio-border animate-fade-in">
              <div className="flex items-center justify-between text-[11px] font-medium text-moss-700 dark:text-sand-300 mb-1">
                <span>Duration</span>
                <span className="font-mono">{crossfadeDuration.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={crossfadeDuration}
                onChange={(e) =>
                  onChangeCrossfadeDuration(parseFloat(e.target.value))
                }
                className="w-full h-1.5 rounded-lg bg-sand-200 dark:bg-studio-surface appearance-none cursor-pointer accent-moss-600 dark:accent-sand-300"
              />
            </div>
          )}
        </div>

        {/* 4. Soundtrack & Audio Mixer */}
        <div className="pt-2 border-t border-sand-100 dark:border-studio-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-moss-700 dark:text-sand-300 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-moss-600 dark:text-sand-300" />
              <span>{t.studio.audioSection}</span>
            </span>
          </div>

          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleAudioChange}
          />

          {audioTrack ? (
            <div className="p-3 rounded-xl bg-sand-100/80 dark:bg-studio-card border border-sand-200 dark:border-studio-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <Music className="w-4 h-4 text-moss-600 dark:text-sand-300 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-medium text-moss-800 dark:text-sand-200 truncate">
                    {audioTrack.name}
                  </p>
                  <p className="text-[10px] text-olive-500 dark:text-sage-400 font-mono">
                    {formatTime(audioTrack.duration)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onRemoveAudio}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-olive-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title={t.studio.removeAudio}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl border border-dashed border-sand-300 dark:border-studio-border hover:border-moss-600 dark:hover:border-sand-300 text-xs font-medium text-moss-700 dark:text-sand-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.studio.addAudio}</span>
            </button>
          )}

          {/* Volume Balances */}
          <div className="flex flex-col gap-2 mt-1">
            {/* Original Clips Audio */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-medium text-olive-600 dark:text-sage-400 mb-1">
                <span>{t.studio.originalVolume}</span>
                <span className="font-mono">
                  {Math.round(masterVideoVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={masterVideoVolume}
                onChange={(e) => onChangeVideoVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg bg-sand-200 dark:bg-studio-card appearance-none cursor-pointer accent-moss-600 dark:accent-sand-300"
              />
            </div>

            {/* Soundtrack Audio (if added) */}
            {audioTrack && (
              <div>
                <div className="flex items-center justify-between text-[11px] font-medium text-olive-600 dark:text-sage-400 mb-1">
                  <span>{t.studio.soundtrackVolume}</span>
                  <span className="font-mono">
                    {Math.round(soundtrackVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundtrackVolume}
                  onChange={(e) =>
                    onChangeSoundtrackVolume(parseFloat(e.target.value))
                  }
                  className="w-full h-1.5 rounded-lg bg-sand-200 dark:bg-studio-card appearance-none cursor-pointer accent-moss-600 dark:accent-sand-300"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
