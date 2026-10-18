import React, { useState, useRef, useMemo } from 'react';
import { HeroDropzone } from './studio/HeroDropzone';
import { CanvasPlayer } from './studio/CanvasPlayer';
import { InspectorSidebar } from './studio/InspectorSidebar';
import { FilmstripTimeline } from './studio/FilmstripTimeline';
import { ExportBar } from './studio/ExportBar';
import { TrimModal } from './studio/TrimModal';
import {
  type ClipItem,
  type AudioItem,
  type AspectRatioType,
  type CropModeType,
  processVideoFile,
  processImageFile,
  processAudioFile,
} from '../utils/mediaUtils';
import { type LanguageCode } from '../i18n/translations';

interface VideoMergerStudioProps {
  currentLang: LanguageCode;
  onExportRequested?: (config: {
    clips: ClipItem[];
    audioTrack: AudioItem | null;
    aspectRatio: AspectRatioType;
    cropMode: CropModeType;
    crossfade: boolean;
    crossfadeDuration: number;
    format: 'mp4' | 'webm';
    videoVolume: number;
    soundtrackVolume: number;
  }) => void;
}

export const VideoMergerStudio: React.FC<VideoMergerStudioProps> = ({
  currentLang,
  onExportRequested,
}) => {
  // Stage management: 'landing' -> 'studio'
  const [stage, setStage] = useState<'landing' | 'studio'>('landing');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Studio project state
  const [clips, setClips] = useState<ClipItem[]>([]);
  const [audioTrack, setAudioTrack] = useState<AudioItem | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('16:9');
  const [cropMode, setCropMode] = useState<CropModeType>('fit');
  const [crossfade, setCrossfade] = useState<boolean>(true);
  const [crossfadeDuration, setCrossfadeDuration] = useState<number>(1.0);
  const [masterVideoVolume, setMasterVideoVolume] = useState<number>(1.0);
  const [soundtrackVolume, setSoundtrackVolume] = useState<number>(0.8);
  const [exportFormat, setExportFormat] = useState<'mp4' | 'webm'>('mp4');

  // Active clip and modals
  const [activeClipIndex, setActiveClipIndex] = useState<number>(0);
  const [editingClip, setEditingClip] = useState<ClipItem | null>(null);

  // Hidden file input for adding more files in Studio mode
  const addFilesInputRef = useRef<HTMLInputElement>(null);

  // Calculate total duration taking crossfade overlaps into account
  const effectiveTransition = crossfade ? Math.min(crossfadeDuration, 1.5) : 0;
  const totalDuration = useMemo(() => {
    if (clips.length === 0) return 0;
    const rawSum = clips.reduce((acc, c) => acc + c.duration, 0);
    const overlapReduction = (clips.length - 1) * effectiveTransition;
    return Math.max(0.1, rawSum - overlapReduction);
  }, [clips, effectiveTransition]);

  // Handle incoming files from Hero Dropzone or "+ Add more files"
  const handleProcessIncomingFiles = async (
    fileList: FileList | File[]
  ): Promise<void> => {
    setIsLoading(true);
    const newClips: ClipItem[] = [];
    let newAudio: AudioItem | null = null;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const type = file.type;

      if (type.startsWith('video/')) {
        try {
          const item = await processVideoFile(file);
          newClips.push(item);
        } catch (err) {
          console.error('Failed to parse video:', file.name, err);
        }
      } else if (type.startsWith('image/')) {
        try {
          const item = await processImageFile(file, 4.0);
          newClips.push(item);
        } catch (err) {
          console.error('Failed to parse image:', file.name, err);
        }
      } else if (type.startsWith('audio/')) {
        try {
          newAudio = await processAudioFile(file);
        } catch (err) {
          console.error('Failed to parse audio:', file.name, err);
        }
      }
    }

    if (newClips.length > 0) {
      setClips((prev) => [...prev, ...newClips]);
      setStage('studio');
    }

    if (newAudio) {
      setAudioTrack(newAudio);
    }

    setIsLoading(false);
  };

  // Reorder clips in timeline
  const handleReorderClips = (startIndex: number, endIndex: number) => {
    setClips((prev) => {
      const next = [...prev];
      const [removed] = next.splice(startIndex, 1);
      next.splice(endIndex, 0, removed);
      return next;
    });
  };

  // Duplicate a clip
  const handleDuplicateClip = (clip: ClipItem) => {
    const duplicated: ClipItem = {
      ...clip,
      id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${clip.name} (Copy)`,
    };
    setClips((prev) => {
      const idx = prev.findIndex((c) => c.id === clip.id);
      if (idx !== -1) {
        const next = [...prev];
        next.splice(idx + 1, 0, duplicated);
        return next;
      }
      return [...prev, duplicated];
    });
  };

  // Delete a clip
  const handleDeleteClip = (id: string) => {
    setClips((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) {
        setStage('landing');
      }
      return next;
    });
  };

  // Save trim adjustment
  const handleSaveTrim = (trimStart: number, trimEnd: number) => {
    if (!editingClip) return;
    setClips((prev) =>
      prev.map((c) => {
        if (c.id === editingClip.id) {
          return {
            ...c,
            trimStart,
            trimEnd,
            duration: Math.max(0.1, trimEnd - trimStart),
          };
        }
        return c;
      })
    );
    setEditingClip(null);
  };

  // Add audio file
  const handleAddAudio = async (file: File) => {
    try {
      const track = await processAudioFile(file);
      setAudioTrack(track);
    } catch (err) {
      console.error('Error adding audio:', err);
    }
  };

  // Trigger export
  const handleExport = () => {
    if (onExportRequested) {
      onExportRequested({
        clips,
        audioTrack,
        aspectRatio,
        cropMode,
        crossfade,
        crossfadeDuration,
        format: exportFormat,
        videoVolume: masterVideoVolume,
        soundtrackVolume,
      });
    } else {
      // Phase 3 will plug in the video compositor engine here
      window.dispatchEvent(
        new CustomEvent('video-merger:start-export', {
          detail: {
            clips,
            audioTrack,
            aspectRatio,
            cropMode,
            crossfade,
            crossfadeDuration,
            format: exportFormat,
            videoVolume: masterVideoVolume,
            soundtrackVolume,
          },
        })
      );
    }
  };

  // Reset project
  const handleNewProject = () => {
    if (window.confirm('Start a new project? Your current edits will be cleared.')) {
      setClips([]);
      setAudioTrack(null);
      setStage('landing');
      setActiveClipIndex(0);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between">
      {/* Hidden file input for "+ Add more files" inside Studio */}
      <input
        ref={addFilesInputRef}
        type="file"
        multiple
        accept="video/*,image/*,audio/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleProcessIncomingFiles(e.target.files);
        }}
      />

      {/* STAGE 1: Hero Dropzone Landing View */}
      {stage === 'landing' ? (
        <HeroDropzone
          currentLang={currentLang}
          onFilesSelected={handleProcessIncomingFiles}
          isLoading={isLoading}
        />
      ) : (
        /* STAGE 2: Studio Workspace */
        <div className="flex-1 flex flex-col justify-between w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 gap-6 animate-fade-in">
          {/* Main Studio Center & Inspector Layout */}
          <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
            {/* Center: Canvas Video Preview Player */}
            <div className="flex-1 w-full flex flex-col items-center">
              <CanvasPlayer
                clips={clips}
                audioTrack={audioTrack}
                aspectRatio={aspectRatio}
                cropMode={cropMode}
                crossfade={crossfade}
                crossfadeDuration={crossfadeDuration}
                currentLang={currentLang}
                onSelectClipIndex={(idx) => setActiveClipIndex(idx)}
              />
            </div>

            {/* Right: Inspector Sidebar */}
            <InspectorSidebar
              currentLang={currentLang}
              aspectRatio={aspectRatio}
              onSelectAspectRatio={setAspectRatio}
              cropMode={cropMode}
              onSelectCropMode={setCropMode}
              crossfade={crossfade}
              onToggleCrossfade={setCrossfade}
              crossfadeDuration={crossfadeDuration}
              onChangeCrossfadeDuration={setCrossfadeDuration}
              audioTrack={audioTrack}
              onAddAudioFile={handleAddAudio}
              onRemoveAudio={() => setAudioTrack(null)}
              masterVideoVolume={masterVideoVolume}
              onChangeVideoVolume={setMasterVideoVolume}
              soundtrackVolume={soundtrackVolume}
              onChangeSoundtrackVolume={setSoundtrackVolume}
              onAddMoreFilesClick={() => addFilesInputRef.current?.click()}
            />
          </div>

          {/* Bottom Interactive Filmstrip Timeline */}
          <div className="w-full mt-2 pt-4 border-t border-sand-200/60 dark:border-studio-border">
            <FilmstripTimeline
              clips={clips}
              currentLang={currentLang}
              onReorderClips={handleReorderClips}
              onOpenTrim={(clip) => setEditingClip(clip)}
              onDuplicateClip={handleDuplicateClip}
              onDeleteClip={handleDeleteClip}
              onAddMoreClipsClick={() => addFilesInputRef.current?.click()}
              activeClipIndex={activeClipIndex}
            />
          </div>
        </div>
      )}

      {/* Pinned Bottom Export Status Bar (Shown in Studio mode) */}
      {stage === 'studio' && (
        <ExportBar
          currentLang={currentLang}
          totalDuration={totalDuration}
          aspectRatio={aspectRatio}
          exportFormat={exportFormat}
          onChangeExportFormat={setExportFormat}
          onExportClick={handleExport}
          onNewProject={handleNewProject}
        />
      )}

      {/* Interactive Trim Modal */}
      {editingClip && (
        <TrimModal
          clip={editingClip}
          currentLang={currentLang}
          onSave={handleSaveTrim}
          onClose={() => setEditingClip(null)}
        />
      )}
    </div>
  );
};
