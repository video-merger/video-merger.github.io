import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Scissors, Play, Pause } from 'lucide-react';
import { type ClipItem, formatTime } from '../../utils/mediaUtils';
import { getTranslations, type LanguageCode } from '../../i18n/translations';

interface TrimModalProps {
  clip: ClipItem;
  currentLang: LanguageCode;
  onSave: (trimStart: number, trimEnd: number) => void;
  onClose: () => void;
}

export const TrimModal: React.FC<TrimModalProps> = ({
  clip,
  currentLang,
  onSave,
  onClose,
}) => {
  const [start, setStart] = useState(clip.trimStart);
  const [end, setEnd] = useState(clip.trimEnd);
  const [previewTime, setPreviewTime] = useState(clip.trimStart);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const t = getTranslations(currentLang);

  const duration = clip.originalDuration;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = previewTime;
    }
  }, [previewTime]);

  const handleStartChange = (val: number) => {
    const newStart = Math.min(val, end - 0.5);
    setStart(newStart);
    setPreviewTime(newStart);
  };

  const handleEndChange = (val: number) => {
    const newEnd = Math.max(val, start + 0.5);
    setEnd(newEnd);
    setPreviewTime(newEnd);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime >= end) {
        videoRef.current.currentTime = start;
      }
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setPreviewTime(videoRef.current.currentTime);
      if (videoRef.current.currentTime >= end) {
        videoRef.current.pause();
        setIsPlaying(false);
        videoRef.current.currentTime = start;
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-studio-surface border border-sand-200 dark:border-studio-border shadow-luxury-light dark:shadow-luxury-dark overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand-100 dark:border-studio-border">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-moss-600 dark:text-sand-300" />
            <h3 className="font-bold text-sm text-moss-800 dark:text-sand-100">
              {t.studio.trim} &quot;{clip.name}&quot;
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-sand-100 dark:hover:bg-studio-card text-olive-500 hover:text-moss-700 dark:hover:text-sand-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video / Image Preview */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {clip.type === 'video' ? (
            <video
              ref={videoRef}
              src={clip.url}
              onTimeUpdate={handleTimeUpdate}
              className="w-full h-full object-contain"
              playsInline
            />
          ) : (
            <img
              src={clip.url}
              alt={clip.name}
              className="w-full h-full object-contain"
            />
          )}

          {clip.type === 'video' && (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-sand-300 text-studio-DEFAULT flex items-center justify-center shadow-lg">
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </div>
            </button>
          )}
        </div>

        {/* Sliders Body */}
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs font-mono font-medium text-moss-700 dark:text-sand-300">
            <div>
              <span className="text-olive-500 dark:text-sage-400">Start: </span>
              <span>{formatTime(start)}</span>
            </div>
            <div>
              <span className="text-olive-500 dark:text-sage-400">Effective: </span>
              <span className="font-bold text-moss-800 dark:text-sand-200">
                {formatTime(end - start)}
              </span>
            </div>
            <div>
              <span className="text-olive-500 dark:text-sage-400">End: </span>
              <span>{formatTime(end)}</span>
            </div>
          </div>

          {/* Start Slider */}
          <div>
            <label className="text-[11px] font-semibold text-olive-600 dark:text-sage-400 block mb-1">
              Trim Start
            </label>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.05"
              value={start}
              onChange={(e) => handleStartChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg bg-sand-200 dark:bg-studio-card appearance-none cursor-pointer accent-moss-600 dark:accent-sand-300"
            />
          </div>

          {/* End Slider */}
          <div>
            <label className="text-[11px] font-semibold text-olive-600 dark:text-sage-400 block mb-1">
              Trim End
            </label>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.05"
              value={end}
              onChange={(e) => handleEndChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg bg-sand-200 dark:bg-studio-card appearance-none cursor-pointer accent-moss-600 dark:accent-sand-300"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-sand-100 dark:border-studio-border bg-sand-50/50 dark:bg-studio-card/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-moss-700 dark:text-sand-200 hover:bg-sand-100 dark:hover:bg-studio-card transition-colors"
          >
            {t.export.cancel}
          </button>
          <button
            type="button"
            onClick={() => onSave(start, end)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-moss-600 hover:bg-moss-700 text-white dark:bg-sand-300 dark:text-studio-surface flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Trim</span>
          </button>
        </div>
      </div>
    </div>
  );
};
