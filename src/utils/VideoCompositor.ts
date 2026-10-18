import {
  type ClipItem,
  type AudioItem,
  type AspectRatioType,
  type CropModeType,
  ASPECT_RATIOS,
} from './mediaUtils';

export interface CompositorProgress {
  percent: number;
  currentTime: number;
  totalTime: number;
  stage: 'preparing' | 'rendering' | 'encoding' | 'complete' | 'error';
  message: string;
}

export interface CompositorConfig {
  clips: ClipItem[];
  audioTrack: AudioItem | null;
  aspectRatio: AspectRatioType;
  cropMode: CropModeType;
  crossfade: boolean;
  crossfadeDuration: number;
  format: 'mp4' | 'webm';
  videoVolume: number;
  soundtrackVolume: number;
  onProgress?: (progress: CompositorProgress) => void;
}

export interface CompositorResult {
  blob: Blob;
  url: string;
  filename: string;
  format: 'mp4' | 'webm';
  sizeBytes: number;
}

export class VideoCompositor {
  private config: CompositorConfig;
  private isCancelled = false;

  constructor(config: CompositorConfig) {
    this.config = config;
  }

  public cancel() {
    this.isCancelled = true;
  }

  /**
   * Main rendering method executing 100% locally in browser memory
   */
  public async render(): Promise<CompositorResult> {
    const {
      clips,
      audioTrack,
      aspectRatio,
      cropMode,
      crossfade,
      crossfadeDuration,
      format,
      videoVolume,
      soundtrackVolume,
      onProgress,
    } = this.config;

    if (clips.length === 0) {
      throw new Error('No clips to merge');
    }

    onProgress?.({
      percent: 2,
      currentTime: 0,
      totalTime: 0,
      stage: 'preparing',
      message: 'Preparing local canvas and audio pipeline...',
    });

    const targetSpec = ASPECT_RATIOS[aspectRatio];
    const width = targetSpec.width;
    const height = targetSpec.height;
    const effectiveTransition = crossfade ? Math.min(crossfadeDuration, 1.5) : 0;

    // Calculate total duration taking crossfades into account
    const rawSum = clips.reduce((acc, c) => acc + c.duration, 0);
    const overlapReduction = (clips.length - 1) * effectiveTransition;
    const totalDuration = Math.max(0.1, rawSum - overlapReduction);

    // Compute clip timeline ranges: [start, end]
    const clipRanges: { start: number; end: number; clip: ClipItem }[] = [];
    let accumulatedTime = 0;
    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      const start = accumulatedTime;
      const end = start + c.duration;
      clipRanges.push({ start, end, clip: c });
      accumulatedTime = end - (i < clips.length - 1 ? effectiveTransition : 0);
    }

    // Create offscreen rendering canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Could not initialize 2D canvas context');
    }

    // Preload all clip elements (video/image)
    const videoElements: Map<string, HTMLVideoElement> = new Map();
    const imageElements: Map<string, HTMLImageElement> = new Map();

    for (const clip of clips) {
      if (clip.type === 'video') {
        const v = document.createElement('video');
        v.src = clip.url;
        v.crossOrigin = 'anonymous';
        v.preload = 'auto';
        v.muted = true;
        v.playsInline = true;
        await new Promise<void>((resolve) => {
          v.onloadeddata = () => resolve();
          v.onerror = () => resolve();
          // Fallback timeout in case onloadeddata takes too long
          setTimeout(resolve, 3000);
        });
        videoElements.set(clip.id, v);
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = clip.url;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 2000);
        });
        imageElements.set(clip.id, img);
      }
    }

    // Set up Web Audio API multi-track mixer
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const dest = audioCtx.createMediaStreamDestination();

    // Background soundtrack if present
    let bgAudioEl: HTMLAudioElement | null = null;
    if (audioTrack) {
      bgAudioEl = document.createElement('audio');
      bgAudioEl.src = audioTrack.url;
      bgAudioEl.crossOrigin = 'anonymous';
      bgAudioEl.preload = 'auto';
      await new Promise<void>((resolve) => {
        bgAudioEl!.oncanplaythrough = () => resolve();
        bgAudioEl!.onerror = () => resolve();
        setTimeout(resolve, 2000);
      });

      try {
        const bgSource = audioCtx.createMediaElementSource(bgAudioEl);
        const bgGain = audioCtx.createGain();
        bgGain.gain.value = soundtrackVolume;
        bgSource.connect(bgGain);
        bgGain.connect(dest);
      } catch (err) {
        console.warn('Could not connect soundtrack audio stream:', err);
      }
    }

    // Video clips audio routing
    const videoGainNodes: Map<string, GainNode> = new Map();
    for (const [id, v] of videoElements.entries()) {
      try {
        const source = audioCtx.createMediaElementSource(v);
        const gain = audioCtx.createGain();
        gain.gain.value = videoVolume;
        source.connect(gain);
        gain.connect(dest);
        videoGainNodes.set(id, gain);
      } catch (err) {
        // Some browsers only allow mediaElementSource once; handled gracefully
      }
    }

    // Set up MediaStream from canvas and mixed audio
    const fps = 30;
    const canvasStream = canvas.captureStream(fps);
    const audioTracks = dest.stream.getAudioTracks();
    if (audioTracks.length > 0) {
      canvasStream.addTrack(audioTracks[0]);
    }

    // Select optimal MIME type
    let mimeType = 'video/webm; codecs=vp9';
    if (format === 'mp4') {
      if (MediaRecorder.isTypeSupported('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')) {
        mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9,opus')) {
        mimeType = 'video/webm; codecs=vp9,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      }
    } else {
      if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9,opus')) {
        mimeType = 'video/webm; codecs=vp9,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      }
    }

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(canvasStream, {
      mimeType,
      videoBitsPerSecond: 8000000, // 8 Mbps high quality
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.start(200); // chunk every 200ms

    // Helper: render frame onto offscreen canvas with selected crop mode
    const renderFrameAtTime = (time: number) => {
      ctx.fillStyle = '#121412';
      ctx.fillRect(0, 0, width, height);

      const renderEl = (
        element: HTMLVideoElement | HTMLImageElement,
        alpha = 1.0
      ) => {
        ctx.save();
        ctx.globalAlpha = alpha;

        const sw =
          element instanceof HTMLVideoElement
            ? element.videoWidth || width
            : element.naturalWidth || width;
        const sh =
          element instanceof HTMLVideoElement
            ? element.videoHeight || height
            : element.naturalHeight || height;

        if (cropMode === 'blur') {
          // Pass 1: Blurred Backdrop
          ctx.save();
          ctx.filter = 'blur(28px) brightness(0.55)';
          const scaleBg = Math.max(width / sw, height / sh);
          const bgW = sw * scaleBg;
          const bgH = sh * scaleBg;
          const bgX = (width - bgW) / 2;
          const bgY = (height - bgH) / 2;
          ctx.drawImage(element, bgX, bgY, bgW, bgH);
          ctx.restore();

          // Pass 2: Fitted Foreground
          const scaleFg = Math.min(width / sw, height / sh);
          const fgW = sw * scaleFg;
          const fgH = sh * scaleFg;
          const fgX = (width - fgW) / 2;
          const fgY = (height - fgH) / 2;
          ctx.drawImage(element, fgX, fgY, fgW, fgH);
        } else if (cropMode === 'fill') {
          // Fill & Crop
          const scale = Math.max(width / sw, height / sh);
          const dw = sw * scale;
          const dh = sh * scale;
          const dx = (width - dw) / 2;
          const dy = (height - dh) / 2;
          ctx.drawImage(element, dx, dy, dw, dh);
        } else {
          // Fit with Border
          const scale = Math.min(width / sw, height / sh);
          const dw = sw * scale;
          const dh = sh * scale;
          const dx = (width - dw) / 2;
          const dy = (height - dh) / 2;
          ctx.drawImage(element, dx, dy, dw, dh);
        }

        ctx.restore();
      };

      // Find primary clip
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

      const primaryRange = clipRanges[primaryIndex];
      const primaryClip = primaryRange.clip;
      const primaryTimeInClip = Math.max(
        0,
        Math.min(
          primaryClip.duration,
          time - primaryRange.start + primaryClip.trimStart
        )
      );

      // Check crossfade overlap
      const nextRange = clipRanges[primaryIndex + 1];
      const isInTransition =
        crossfade &&
        nextRange &&
        time >= primaryRange.end - effectiveTransition &&
        time <= primaryRange.end;

      if (isInTransition) {
        const progress =
          (time - (primaryRange.end - effectiveTransition)) / effectiveTransition;

        const primaryEl =
          primaryClip.type === 'video'
            ? videoElements.get(primaryClip.id)
            : imageElements.get(primaryClip.id);

        if (primaryEl) {
          if (primaryEl instanceof HTMLVideoElement) {
            primaryEl.currentTime = primaryTimeInClip;
          }
          renderEl(primaryEl, 1.0 - progress);
        }

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
            ? videoElements.get(nextClip.id)
            : imageElements.get(nextClip.id);

        if (nextEl) {
          if (nextEl instanceof HTMLVideoElement) {
            nextEl.currentTime = nextTimeInClip;
          }
          renderEl(nextEl, progress);
        }
      } else {
        const el =
          primaryClip.type === 'video'
            ? videoElements.get(primaryClip.id)
            : imageElements.get(primaryClip.id);

        if (el) {
          if (el instanceof HTMLVideoElement) {
            el.currentTime = primaryTimeInClip;
          }
          renderEl(el, 1.0);
        }
      }
    };

    // Play soundtrack alongside recording
    if (bgAudioEl) {
      bgAudioEl.currentTime = 0;
      bgAudioEl.play().catch(() => {});
    }

    // Step-by-step frame rendering loop
    const totalFrames = Math.ceil(totalDuration * fps);
    const frameIntervalMs = 1000 / fps;
    const startTime = performance.now();

    for (let frame = 0; frame < totalFrames; frame++) {
      if (this.isCancelled) {
        mediaRecorder.stop();
        audioCtx.close();
        throw new Error('Export cancelled by user');
      }

      const currentTime = frame / fps;
      renderFrameAtTime(currentTime);

      const percent = Math.min(96, Math.round((frame / totalFrames) * 94) + 2);
      onProgress?.({
        percent,
        currentTime,
        totalTime: totalDuration,
        stage: 'rendering',
        message: `Compositing frame ${frame + 1} of ${totalFrames} (${percent}%)...`,
      });

      // Synchronize time step to allow browser to encode and dispatch frames
      const expectedElapsed = (frame + 1) * frameIntervalMs;
      const actualElapsed = performance.now() - startTime;
      const delay = Math.max(4, expectedElapsed - actualElapsed);

      await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 25)));
    }

    onProgress?.({
      percent: 98,
      currentTime: totalDuration,
      totalTime: totalDuration,
      stage: 'encoding',
      message: 'Finalizing and packaging video file...',
    });

    if (bgAudioEl) {
      bgAudioEl.pause();
    }

    // Stop MediaRecorder and wait for finish
    const blobPromise = new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(recordedChunks, {
          type: mediaRecorder.mimeType || mimeType,
        });
        resolve(finalBlob);
      };
    });

    mediaRecorder.stop();
    await audioCtx.close();

    const outputBlob = await blobPromise;
    const finalUrl = URL.createObjectURL(outputBlob);
    const actualFormat =
      mediaRecorder.mimeType.includes('mp4') || format === 'mp4' ? 'mp4' : 'webm';
    const filename = `merged-video-${width}x${height}.${actualFormat}`;

    onProgress?.({
      percent: 100,
      currentTime: totalDuration,
      totalTime: totalDuration,
      stage: 'complete',
      message: 'Video rendering completed successfully!',
    });

    return {
      blob: outputBlob,
      url: finalUrl,
      filename,
      format: actualFormat,
      sizeBytes: outputBlob.size,
    };
  }
}
