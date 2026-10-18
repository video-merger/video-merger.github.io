import React, { useState, useRef } from 'react';
import {
  GripVertical,
  Scissors,
  Copy,
  Trash2,
  Plus,
  Film,
  Image as ImageIcon,
} from 'lucide-react';
import { type ClipItem, formatTime } from '../../utils/mediaUtils';
import { getTranslations, type LanguageCode } from '../../i18n/translations';

interface FilmstripTimelineProps {
  clips: ClipItem[];
  currentLang: LanguageCode;
  onReorderClips: (startIndex: number, endIndex: number) => void;
  onOpenTrim: (clip: ClipItem) => void;
  onDuplicateClip: (clip: ClipItem) => void;
  onDeleteClip: (id: string) => void;
  onAddMoreClipsClick: () => void;
  activeClipIndex?: number;
}

export const FilmstripTimeline: React.FC<FilmstripTimelineProps> = ({
  clips,
  currentLang,
  onReorderClips,
  onOpenTrim,
  onDuplicateClip,
  onDeleteClip,
  onAddMoreClipsClick,
  activeClipIndex = 0,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const t = getTranslations(currentLang);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent or ghost image
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorderClips(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Timeline Header Info */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-moss-600 dark:text-sand-300" />
          <h3 className="text-xs sm:text-sm font-bold text-moss-800 dark:text-sand-200">
            {t.studio.timelineTitle}
          </h3>
          <span className="text-xs text-olive-500 dark:text-sage-400">
            ({clips.length} {clips.length === 1 ? 'clip' : 'clips'})
          </span>
        </div>
        <span className="text-[11px] text-olive-500 dark:text-sage-400 hidden sm:inline">
          {t.studio.reorderHint}
        </span>
      </div>

      {/* Horizontal Scrollable Track */}
      <div
        ref={trackRef}
        className="w-full overflow-x-auto pb-3 pt-1 flex items-center gap-3 select-none scrollbar-thin"
      >
        {clips.map((clip, index) => {
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;
          const isActive = activeClipIndex === index;

          return (
            <div
              key={clip.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative shrink-0 w-44 sm:w-52 rounded-xl border overflow-hidden bg-white dark:bg-studio-surface transition-all duration-200 cursor-grab active:cursor-grabbing shadow-sm ${
                isDragging ? 'opacity-40 scale-95' : 'opacity-100'
              } ${
                isDragOver
                  ? 'border-sand-300 dark:border-sand-300 ring-2 ring-sand-300 scale-[1.02]'
                  : isActive
                  ? 'border-moss-600 dark:border-sand-300 ring-1 ring-moss-600/30 dark:ring-sand-300/40'
                  : 'border-sand-200 dark:border-studio-border hover:border-moss-500/50 dark:hover:border-sand-300/50'
              }`}
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full bg-studio overflow-hidden">
                <img
                  src={clip.thumbnailUrl}
                  alt={clip.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                />

                {/* Index & Type Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-mono">
                  <span>#{index + 1}</span>
                  {clip.type === 'video' ? (
                    <Film className="w-3 h-3 text-sand-300" />
                  ) : (
                    <ImageIcon className="w-3 h-3 text-sage-400" />
                  )}
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-sand-300 text-[10px] font-mono">
                  {formatTime(clip.duration)}
                </div>

                {/* Drag Grip Handle */}
                <div className="absolute top-2 right-2 p-1 rounded-md bg-black/40 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Title & Action Toolbar */}
              <div className="p-2 sm:p-2.5 flex flex-col gap-1.5">
                <p className="text-[11px] font-medium text-moss-800 dark:text-sand-100 truncate">
                  {clip.name}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-sand-100 dark:border-studio-border text-olive-600 dark:text-sage-400">
                  {/* Trim Button */}
                  <button
                    type="button"
                    onClick={() => onOpenTrim(clip)}
                    className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-sand-100 dark:hover:bg-studio-card text-[11px] font-medium text-moss-700 dark:text-sand-200 transition-colors"
                    title={t.studio.trim}
                  >
                    <Scissors className="w-3 h-3 text-moss-600 dark:text-sand-300" />
                    <span>{t.studio.trim}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Duplicate Button */}
                    <button
                      type="button"
                      onClick={() => onDuplicateClip(clip)}
                      className="p-1 rounded hover:bg-sand-100 dark:hover:bg-studio-card text-olive-500 hover:text-moss-700 dark:hover:text-sand-200 transition-colors"
                      title={t.studio.duplicate}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => onDeleteClip(clip.id)}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-olive-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title={t.studio.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Dashed "+ Add more videos" drop slot */}
        <button
          type="button"
          onClick={onAddMoreClipsClick}
          className="shrink-0 w-36 sm:w-44 aspect-video rounded-xl border-2 border-dashed border-sand-300 dark:border-studio-border hover:border-moss-600 dark:hover:border-sand-300 bg-sand-100/30 dark:bg-studio-surface/40 hover:bg-sand-100/60 dark:hover:bg-studio-card text-moss-700 dark:text-sand-300 flex flex-col items-center justify-center gap-1.5 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-sand-200/70 dark:bg-studio-card flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4 text-moss-700 dark:text-sand-300" />
          </div>
          <span className="text-xs font-semibold">
            {t.studio.addMoreVideosSlot}
          </span>
        </button>
      </div>
    </div>
  );
};
