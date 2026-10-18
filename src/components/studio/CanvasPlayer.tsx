import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import {
  type ClipItem,
  type AudioItem,
  type AspectRatioType,
  type CropModeType,
  ASPECT_RATIOS,
  formatTime,
} from '../../utils/mediaUtils';
import { getTranslations, type LanguageCode } from '../../i18n/translations';

interface CanvasPlayerProps {
  clips: ClipItem[];
  audioTrack: AudioItem | null;
  aspectRatio: AspectRatioType;
  cropMode: CropModeType;
  crossfade: boolean;
  crossfadeDuration: number;
  currentLang: LanguageCode;
  onSelectClipIndex?: (index: number) => void;
}

export const CanvasPlayer: React.FC<CanvasPlayerProps> = ({
  clips,
  audioTrack,
  aspectRatio,
  cropMode,
  crossfade,
  crossfadeDuration,
  currentLang,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const imageElementsRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeClipIndex, setActiveClipIndex] = useState(0);

  const t = getTranslations(currentLang);
  const targetSpec = ASPECT_RATIOS[aspectRatio];

  // Calculate transition overlap
  const effectiveTransition = crossfade ? Math.min(crossfadeDuration, 1.5) : 0;

  // Calculate total duration taking crossfade overlaps into account
  const totalDuration = React.useMemo(() => {
    if (clips.length === 0) return 0;
    const rawSum = clips.reduce((acc, c) => acc + c.duration, 0);
    const overlapReduction = (clips.length - 1) * effectiveTransition;
    return Math.max(0.1, rawSum - overlapReduction);
  }, [clips, effectiveTransition]);

  // Compute clip timeline boundaries: [startTime, endTime] for each clip
  const clipRanges = React.useMemo(() => {
    const ranges: { start: number; end: number; clip: ClipItem }[] = [];
    let accumulatedTime = 0;

    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      const start = accumulatedTime;
      const end = start + c.duration;
      ranges.push({ start, end, clip: c });
      accumulatedTime = end - (i < clips.length - 1 ? effectiveTransition : 0);
    }
    return ranges;
  }, [clips, effectiveTransition]);

  // Preload video and image DOM elements
  useEffect(() => {
    const vMap = videoElementsRef.current;
    const iMap = imageElementsRef.current;

    clips.forEach((clip) => {
      if (clip.type === 'video' && !vMap.has(clip.id)) {
        const v = document.createElement('video');
        v.src = clip.url;
        v.preload = 'auto';
        v.playsInline = true;
        v.muted = isMuted;
        vMap.set(clip.id, v);
      } else if (clip.type === 'image' && !iMap.has(clip.id)) {
        const img = new Image();
        img.src = clip.url;
        iMap.set(clip.id, img);
      }
    });

    if (audioTrack && !audioElementRef.current) {
      const a = document.createElement('audio');
      a.src = audioTrack.url;
      a.preload = 'auto';
      audioElementRef.current = a;
    } else if (!audioTrack && audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
  }, [clips, audioTrack, isMuted]);

  // Draw frame on canvas with selected crop mode and crossfade
  const drawFrame = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas || clips.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cw = targetSpec.width;
      const ch = targetSpec.height;

      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }

      // Clear with dark studio background
      ctx.fillStyle = '#121412';
      ctx.fillRect(0, 0, cw, ch);

      // Helper to draw a single element (video or image) with cropMode
      const renderElement = (
        element: HTMLVideoElement | HTMLImageElement,
        alpha = 1.0
      ) => {
        ctx.save();
        ctx.globalAlpha = alpha;

        const sw =
          element instanceof HTMLVideoElement
            ? element.videoWidth || 1920
            : element.naturalWidth || 1920;
        const sh =
          element instanceof HTMLVideoElement
            ? element.videoHeight || 1080
            : element.naturalHeight || 1080;

        if (cropMode === 'blur') {
          // Pass 1: Blurred background
          ctx.save();
          ctx.filter = 'blur(30px) brightness(0.55)';
          // Scale to fill
          const scaleBg = Math.max(cw / sw, ch / sh);
          const bgW = sw * scaleBg;
          const bgH = sh * scaleBg;
          const bgX = (cw - bgW) / 2;
          const bgY = (ch - bgH) / 2;
          ctx.drawImage(element, bgX, bgY, bgW, bgH);
          ctx.restore();

          // Pass 2: Clean aspect-fit foreground
          const scaleFg = Math.min(cw / sw, ch / sh);
          const fgW = sw * scaleFg;
          const fgH = sh * scaleFg;
          const fgX = (cw - fgW) / 2;
          const fgY = (ch - fgH) / 2;
          ctx.drawImage(element, fgX, fgY, fgW, fgH);
        } else if (cropMode === 'fill') {
          // Scale & Crop to Fill
          const scale = Math.max(cw / sw, ch / sh);
          const dw = sw * scale;
          const dh = sh * scale;
          const dx = (cw - dw) / 2;
          const dy = (ch - dh) / 2;
          ctx.drawImage(element, dx, dy, dw, dh);
        } else {
          // Fit with border
          const scale = Math.min(cw / sw, ch / sh);
          const dw = sw * scale;
          const dh = sh * scale;
          const dx = (cw - dw) / 2;
          const dy = (ch - dh) / 2;
          ctx.drawImage(element, dx, dy, dw, dh);
        }

        ctx.restore();
      };

      // Find active clip(s) at current time
      let primaryIndex = 0;
      for (let i = 0; i < clipRanges.length; i++) {
        if (time >= clipRanges[i].start && time <= clipRanges[i].end) {
          primaryIndex = i;
          break;
        }
        if (time > clipRanges[i].end && i === clipRanges.length - 1) {
          primaryIndex = i;
        }
      }
      setActiveClipIndex(primaryIndex);

      const primaryRange = clipRanges[primaryIndex];
      const primaryClip = primaryRange.clip;
      const primaryTimeInClip = Math.max(
        0,
        Math.min(
          primaryClip.duration,
          time - primaryRange.start + primaryClip.trimStart
        )
      );

      // Check if we are inside a crossfade transition with next clip
      const nextRange = clipRanges[primaryIndex + 1];
      const isInTransition =
        crossfade &&
        nextRange &&
        time >= primaryRange.end - effectiveTransition &&
        time <= primaryRange.end;

      if (isInTransition) {
        const transitionProgress =
          (time - (primaryRange.end - effectiveTransition)) / effectiveTransition;

        // Render primary with fading alpha
        const primaryEl =
          primaryClip.type === 'video'
            ? videoElementsRef.current.get(primaryClip.id)
            : imageElementsRef.current.get(primaryClip.id);

        if (primaryEl) {
          if (primaryEl instanceof HTMLVideoElement) {
            primaryEl.currentTime = primaryTimeInClip;
          }
          renderElement(primaryEl, 1.0 - transitionProgress);
        }

        // Render incoming next clip
        const nextClip = nextRange.clip;
        const nextTimeInClip = Math.max(
          0,
          Math.min(
            nextClip.duration,
            time - nextRange.start + nextClip.trimStart
          )
        );
        const nextEl =
          nextClip.type === 'video'
            ? videoElementsRef.current.get(nextClip.id)
            : imageElementsRef.current.get(nextClip.id);

        if (nextEl) {
          if (nextEl instanceof HTMLVideoElement) {
            nextEl.currentTime = nextTimeInClip;
          }
          renderElement(nextEl, transitionProgress);
        }
      } else {
        // Normal rendering of primary clip
        const el =
          primaryClip.type === 'video'
            ? videoElementsRef.current.get(primaryClip.id)
            : imageElementsRef.current.get(primaryClip.id);

        if (el) {
          if (el instanceof HTMLVideoElement) {
            // Keep video synchronized if within tolerable delta
            if (Math.abs(el.currentTime - primaryTimeInClip) > 0.15) {
              el.currentTime = primaryTimeInClip;
            }
          }
          renderElement(el, 1.0);
        }
      }
    },
    [clips, clipRanges, targetSpec, cropMode, crossfade, effectiveTransition]
  );

  // Playback loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, totalDuration]);

  // Sync audio/video playback state
  useEffect(() => {
    const primaryRange = clipRanges[activeClipIndex];
    if (!primaryRange) return;

    const clip = primaryRange.clip;
    const vEl = videoElementsRef.current.get(clip.id);

    if (vEl) {
      vEl.muted = isMuted || clip.volume === 0;
      vEl.volume = Math.max(0, Math.min(1, clip.volume));
      if (isPlaying && vEl.paused) {
        vEl.play().catch(() => {});
      } else if (!isPlaying && !vEl.paused) {
        vEl.pause();
      }
    }

    if (audioElementRef.current && audioTrack) {
      audioElementRef.current.muted = isMuted;
      audioElementRef.current.volume = Math.max(0, Math.min(1, audioTrack.volume));
      if (isPlaying && audioElementRef.current.paused) {
        audioElementRef.current.currentTime = currentTime % audioTrack.duration;
        audioElementRef.current.play().catch(() => {});
      } else if (!isPlaying && !audioElementRef.current.paused) {
        audioElementRef.current.pause();
      }
    }
  }, [isPlaying, activeClipIndex, isMuted, clipRanges, audioTrack, currentTime]);

  // Re-draw when time, crop, or aspect ratio changes
  useEffect(() => {
    drawFrame(currentTime);
  }, [currentTime, drawFrame]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    drawFrame(newTime);
  };

  const togglePlay = () => {
    if (currentTime >= totalDuration - 0.1) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const jumpToPreviousClip = () => {
    if (activeClipIndex > 0) {
      const prevRange = clipRanges[activeClipIndex - 1];
      setCurrentTime(prevRange.start);
    } else {
      setCurrentTime(0);
    }
  };

  const jumpToNextClip = () => {
    if (activeClipIndex < clipRanges.length - 1) {
      const nextRange = clipRanges[activeClipIndex + 1];
      setCurrentTime(nextRange.start);
    }
  };

  // Determine aspect ratio class for the preview container
  const getAspectClass = () => {
    switch (aspectRatio) {
      case '16:9':
        return 'aspect-video';
      case '9:16':
        return 'aspect-[9/16] max-h-[520px]';
      case '1:1':
        return 'aspect-square max-h-[520px]';
      case '5:4':
        return 'aspect-[5/4] max-h-[520px]';
      default:
        return 'aspect-video';
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Player Canvas Wrapper */}
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl mx-auto flex items-center justify-center p-2 sm:p-4 bg-black/40 dark:bg-black/60 rounded-2xl border border-sand-200/50 dark:border-studio-border overflow-hidden shadow-luxury-light dark:shadow-luxury-dark backdrop-blur-md"
      >
        <div
          className={`relative w-full ${getAspectClass()} max-w-full rounded-xl overflow-hidden shadow-2xl flex items-center justify-center bg-studio-DEFAULT`}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* Quick Play/Pause Center Overlay on Hover */}
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity focus:outline-none"
            aria-label={isPlaying ? t.studio.pause : t.studio.play}
          >
            <div className="w-16 h-16 rounded-full bg-sand-300/90 dark:bg-sand-300 text-studio-DEFAULT flex items-center justify-center shadow-lg transform active:scale-90 transition-transform">
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </div>
          </button>

          {/* Aspect Ratio Badge Display */}
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-mono tracking-wider">
            {aspectRatio} • {targetSpec.width}×{targetSpec.height}
          </div>

          {/* Active Clip Indicator */}
          {clips[activeClipIndex] && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-sand-300 text-[11px] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sand-300 animate-pulse-subtle" />
              <span>
                Clip {activeClipIndex + 1}/{clips.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Transport Controls Bar */}
      <div className="w-full max-w-4xl mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-studio-surface/90 border border-sand-200 dark:border-studio-border backdrop-blur-md shadow-sm">
        {/* Scrubber Range Bar */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold text-moss-700 dark:text-sand-300 w-12 text-left">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min="0"
              max={totalDuration || 1}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 rounded-lg bg-sand-200 dark:bg-studio-card appearance-none cursor-pointer accent-moss-600 dark:accent-sand-300 focus:outline-none"
            />
          </div>

          <span className="font-mono text-xs font-semibold text-olive-500 dark:text-sage-400 w-12 text-right">
            {formatTime(totalDuration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Prev Clip */}
            <button
              type="button"
              onClick={jumpToPreviousClip}
              className="p-2 rounded-lg hover:bg-sand-100 dark:hover:bg-studio-card text-moss-700 dark:text-sand-200 transition-colors"
              title={t.studio.prevClip}
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play/Pause Main */}
            <button
              type="button"
              onClick={togglePlay}
              className="px-4 py-2 rounded-xl bg-moss-600 hover:bg-moss-700 text-white dark:bg-sand-300 dark:text-studio-surface dark:hover:bg-sand-400 font-semibold text-sm flex items-center gap-2 shadow-sm transition-transform active:scale-95"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>{t.studio.pause}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{t.studio.play}</span>
                </>
              )}
            </button>

            {/* Next Clip */}
            <button
              type="button"
              onClick={jumpToNextClip}
              className="p-2 rounded-lg hover:bg-sand-100 dark:hover:bg-studio-card text-moss-700 dark:text-sand-200 transition-colors"
              title={t.studio.nextClip}
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Right Transport Controls: Mute Toggle & Active Details */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-lg hover:bg-sand-100 dark:hover:bg-studio-card text-moss-700 dark:text-sand-200 transition-colors"
              title={isMuted ? t.studio.unmute : t.studio.mute}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-olive-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-moss-700 dark:text-sand-300" />
              )}
            </button>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sand-100 dark:bg-studio-card text-[11px] font-mono text-moss-700 dark:text-sand-300">
              <span>{cropMode.toUpperCase()}</span>
              <span>•</span>
              <span>{crossfade ? 'CROSSFADE ON' : 'CUT'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
