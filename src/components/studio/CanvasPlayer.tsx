import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  type ClipItem,
  type AudioItem,
  type AspectRatioType,
  type CropModeType,
  ASPECT_RATIOS,
  formatTime,
  drawElementWithCropMode,
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
  onSelectClipIndex,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const imageElementsRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const currentTimeRef = useRef(0);
  const [displayTime, setDisplayTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeClipIndex, setActiveClipIndex] = useState(0);

  const t = getTranslations(currentLang);
  const targetSpec = ASPECT_RATIOS[aspectRatio];

  // Use a smaller preview resolution to avoid performance issues
  const previewScale = 0.5;
  const previewW = Math.round(targetSpec.width * previewScale);
  const previewH = Math.round(targetSpec.height * previewScale);

  const effectiveTransition = crossfade ? Math.min(crossfadeDuration, 1.5) : 0;

  const totalDuration = React.useMemo(() => {
    if (clips.length === 0) return 0;
    const rawSum = clips.reduce((acc, c) => acc + c.duration, 0);
    const overlapReduction = Math.max(0, clips.length - 1) * effectiveTransition;
    return Math.max(0.1, rawSum - overlapReduction);
  }, [clips, effectiveTransition]);

  // Compute clip timeline boundaries
  const clipRanges = React.useMemo(() => {
    const ranges: { start: number; end: number; clip: ClipItem }[] = [];
    let acc = 0;
    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      ranges.push({ start: acc, end: acc + c.duration, clip: c });
      acc += c.duration - (i < clips.length - 1 ? effectiveTransition : 0);
    }
    return ranges;
  }, [clips, effectiveTransition]);

  // Preload video / image DOM elements. Clean up stale entries.
  useEffect(() => {
    const vMap = videoElementsRef.current;
    const iMap = imageElementsRef.current;
    const currentClipIds = new Set(clips.map((c) => c.id));

    // Remove stale elements
    for (const id of vMap.keys()) {
      if (!currentClipIds.has(id)) {
        const v = vMap.get(id)!;
        v.pause();
        v.removeAttribute('src');
        v.load();
        vMap.delete(id);
      }
    }
    for (const id of iMap.keys()) {
      if (!currentClipIds.has(id)) iMap.delete(id);
    }

    // Add new elements
    clips.forEach((clip) => {
      if (clip.type === 'video' && !vMap.has(clip.id)) {
        const v = document.createElement('video');
        v.src = clip.url;
        v.preload = 'auto';
        v.playsInline = true;
        v.muted = true; // always muted — we control audio separately
        vMap.set(clip.id, v);
      } else if (clip.type === 'image' && !iMap.has(clip.id)) {
        const img = new Image();
        img.src = clip.url;
        iMap.set(clip.id, img);
      }
    });

    // Background audio element
    if (audioTrack) {
      if (!audioElementRef.current || audioElementRef.current.src !== audioTrack.url) {
        if (audioElementRef.current) audioElementRef.current.pause();
        const a = document.createElement('audio');
        a.src = audioTrack.url;
        a.preload = 'auto';
        a.loop = true;
        audioElementRef.current = a;
      }
    } else {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    }
  }, [clips, audioTrack]);

  // Draw a single frame on the canvas at the given timeline time
  const drawFrame = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas || clips.length === 0 || clipRanges.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (canvas.width !== previewW || canvas.height !== previewH) {
        canvas.width = previewW;
        canvas.height = previewH;
      }

      ctx.fillStyle = '#121412';
      ctx.fillRect(0, 0, previewW, previewH);

      // Find the primary clip at this time
      let primaryIndex = 0;
      for (let i = 0; i < clipRanges.length; i++) {
        if (time >= clipRanges[i].start && time < clipRanges[i].end) {
          primaryIndex = i;
          break;
        }
        if (i === clipRanges.length - 1) primaryIndex = i;
      }

      if (primaryIndex !== activeClipIndex) {
        setActiveClipIndex(primaryIndex);
        onSelectClipIndex?.(primaryIndex);
      }

      const primaryRange = clipRanges[primaryIndex];
      const primaryClip = primaryRange.clip;
      const primaryLocalTime = Math.max(
        0,
        Math.min(primaryClip.duration, time - primaryRange.start + primaryClip.trimStart)
      );

      // Check crossfade with next clip
      const nextRange = clipRanges[primaryIndex + 1];
      const isInTransition =
        crossfade &&
        nextRange &&
        time >= primaryRange.end - effectiveTransition &&
        time < primaryRange.end;

      if (isInTransition && nextRange) {
        const progress =
          (time - (primaryRange.end - effectiveTransition)) / effectiveTransition;

        // Draw outgoing clip
        const primaryEl =
          primaryClip.type === 'video'
            ? videoElementsRef.current.get(primaryClip.id)
            : imageElementsRef.current.get(primaryClip.id);

        if (primaryEl) {
          if (primaryEl instanceof HTMLVideoElement) {
            primaryEl.currentTime = primaryLocalTime;
          }
          drawElementWithCropMode(ctx, primaryEl, previewW, previewH, cropMode, 1.0 - progress);
        }

        // Draw incoming clip
        const nextClip = nextRange.clip;
        const nextLocalTime = Math.max(
          0,
          Math.min(nextClip.duration, time - nextRange.start + nextClip.trimStart)
        );
        const nextEl =
          nextClip.type === 'video'
            ? videoElementsRef.current.get(nextClip.id)
            : imageElementsRef.current.get(nextClip.id);

        if (nextEl) {
          if (nextEl instanceof HTMLVideoElement) {
            nextEl.currentTime = nextLocalTime;
          }
          drawElementWithCropMode(ctx, nextEl, previewW, previewH, cropMode, progress);
        }
      } else {
        // Normal single-clip rendering
        const el =
          primaryClip.type === 'video'
            ? videoElementsRef.current.get(primaryClip.id)
            : imageElementsRef.current.get(primaryClip.id);

        if (el) {
          if (el instanceof HTMLVideoElement) {
            // Only seek if significantly out of sync
            if (Math.abs(el.currentTime - primaryLocalTime) > 0.2) {
              el.currentTime = primaryLocalTime;
            }
          }
          drawElementWithCropMode(ctx, el, previewW, previewH, cropMode, 1.0);
        }
      }
    },
    [clips, clipRanges, previewW, previewH, cropMode, crossfade, effectiveTransition, activeClipIndex, onSelectClipIndex]
  );

  // Animation playback loop — uses refs to avoid stale closures
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const totalDurationRef = useRef(totalDuration);
  totalDurationRef.current = totalDuration;
  const drawFrameRef = useRef(drawFrame);
  drawFrameRef.current = drawFrame;

  useEffect(() => {
    let rafId: number;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastTs) / 1000;
      lastTs = now;

      if (isPlayingRef.current) {
        let next = currentTimeRef.current + dt;
        if (next >= totalDurationRef.current) {
          next = 0;
          setIsPlaying(false);
        }
        currentTimeRef.current = next;
        setDisplayTime(next);
        drawFrameRef.current(next);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []); // stable — uses refs

  // When paused but settings change, redraw the current frame
  useEffect(() => {
    if (!isPlaying) {
      drawFrame(currentTimeRef.current);
    }
  }, [drawFrame, isPlaying, aspectRatio, cropMode, crossfade]);

  // Sync video element playback and background audio
  useEffect(() => {
    const primaryRange = clipRanges[activeClipIndex];
    if (!primaryRange) return;

    const clip = primaryRange.clip;

    // Drive the active video element's native playback
    if (clip.type === 'video') {
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
    }

    // Pause all OTHER video elements to avoid confusion
    for (const [id, v] of videoElementsRef.current.entries()) {
      if (id !== clip.id) {
        if (!v.paused) v.pause();
      }
    }

    // Background audio
    if (audioElementRef.current && audioTrack) {
      audioElementRef.current.muted = isMuted;
      audioElementRef.current.volume = Math.max(0, Math.min(1, audioTrack.volume));
      if (isPlaying && audioElementRef.current.paused) {
        audioElementRef.current.play().catch(() => {});
      } else if (!isPlaying && !audioElementRef.current.paused) {
        audioElementRef.current.pause();
      }
    }
  }, [isPlaying, activeClipIndex, isMuted, clipRanges, audioTrack]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    currentTimeRef.current = newTime;
    setDisplayTime(newTime);
    drawFrame(newTime);

    // Sync video to new seek position
    const primaryRange = clipRanges.find(
      (r) => newTime >= r.start && newTime < r.end
    ) || clipRanges[clipRanges.length - 1];
    if (primaryRange && primaryRange.clip.type === 'video') {
      const vEl = videoElementsRef.current.get(primaryRange.clip.id);
      if (vEl) {
        vEl.currentTime = newTime - primaryRange.start + primaryRange.clip.trimStart;
      }
    }
  };

  const togglePlay = () => {
    if (currentTimeRef.current >= totalDuration - 0.1) {
      currentTimeRef.current = 0;
      setDisplayTime(0);
    }
    setIsPlaying((p) => !p);
  };

  const jumpToPreviousClip = () => {
    const idx = Math.max(0, activeClipIndex - 1);
    const t = clipRanges[idx]?.start ?? 0;
    currentTimeRef.current = t;
    setDisplayTime(t);
    drawFrame(t);
  };

  const jumpToNextClip = () => {
    if (activeClipIndex < clipRanges.length - 1) {
      const t = clipRanges[activeClipIndex + 1].start;
      currentTimeRef.current = t;
      setDisplayTime(t);
      drawFrame(t);
    }
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '16:9': return 'aspect-video';
      case '9:16': return 'aspect-[9/16] max-h-[520px]';
      case '1:1': return 'aspect-square max-h-[520px]';
      case '5:4': return 'aspect-[5/4] max-h-[520px]';
      default: return 'aspect-video';
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

          {/* Aspect Ratio Badge */}
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
        {/* Scrubber */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold text-moss-700 dark:text-sand-300 w-12 text-left">
            {formatTime(displayTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min="0"
              max={totalDuration || 1}
              step="0.05"
              value={displayTime}
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
            <button
              type="button"
              onClick={jumpToPreviousClip}
              className="p-2 rounded-lg hover:bg-sand-100 dark:hover:bg-studio-card text-moss-700 dark:text-sand-200 transition-colors"
              title={t.studio.prevClip}
            >
              <SkipBack className="w-4 h-4" />
            </button>

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

            <button
              type="button"
              onClick={jumpToNextClip}
              className="p-2 rounded-lg hover:bg-sand-100 dark:hover:bg-studio-card text-moss-700 dark:text-sand-200 transition-colors"
              title={t.studio.nextClip}
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

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
