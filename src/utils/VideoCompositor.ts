import {
  type ClipItem,
  type AudioItem,
  type AspectRatioType,
  type CropModeType,
  ASPECT_RATIOS,
  drawElementWithCropMode,
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

/**
 * Seek a video element and wait for the seek to complete.
 */
function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.04) {
      resolve();
      return;
    }
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };
    video.addEventListener('seeked', onSeeked);
    video.currentTime = time;
    // Safety timeout
    setTimeout(resolve, 150);
  });
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
   * Main rendering method — 100% client-side, zero server uploads.
   */
  public async render(): Promise<CompositorResult> {
    const {
      clips,
      audioTrack,
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
      percent: 1,
      currentTime: 0,
      totalTime: 0,
      stage: 'preparing',
      message: 'Preparing local canvas and audio pipeline...',
    });

    const targetSpec = ASPECT_RATIOS[this.config.aspectRatio];
    const width = targetSpec.width;
    const height = targetSpec.height;
    const effectiveTransition = crossfade ? Math.min(crossfadeDuration, 1.5) : 0;

    // Total duration
    const rawSum = clips.reduce((acc, c) => acc + c.duration, 0);
    const overlapReduction = Math.max(0, clips.length - 1) * effectiveTransition;
    const totalDuration = Math.max(0.1, rawSum - overlapReduction);

    // Clip timeline ranges
    const clipRanges: { start: number; end: number; clip: ClipItem }[] = [];
    let acc = 0;
    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      clipRanges.push({ start: acc, end: acc + c.duration, clip: c });
      acc += c.duration - (i < clips.length - 1 ? effectiveTransition : 0);
    }

    // Offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not initialize 2D canvas context');

    // Preload all media elements
    const videoElements: Map<string, HTMLVideoElement> = new Map();
    const imageElements: Map<string, HTMLImageElement> = new Map();

    onProgress?.({
      percent: 3,
      currentTime: 0,
      totalTime: totalDuration,
      stage: 'preparing',
      message: 'Loading and decoding media files...',
    });

    for (const clip of clips) {
      if (this.isCancelled) throw new Error('Export cancelled by user');

      if (clip.type === 'video') {
        const v = document.createElement('video');
        v.src = clip.url;
        v.preload = 'auto';
        v.muted = true;
        v.playsInline = true;
        await new Promise<void>((resolve) => {
          const done = () => resolve();
          v.oncanplaythrough = done;
          v.onerror = done;
          setTimeout(done, 5000);
        });
        videoElements.set(clip.id, v);
      } else {
        const img = new Image();
        img.src = clip.url;
        await new Promise<void>((resolve) => {
          const done = () => resolve();
          img.onload = done;
          img.onerror = done;
          setTimeout(done, 3000);
        });
        imageElements.set(clip.id, img);
      }
    }

    // Set up Web Audio mixer
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const dest = audioCtx.createMediaStreamDestination();

    // Background soundtrack
    let bgAudioEl: HTMLAudioElement | null = null;
    if (audioTrack) {
      bgAudioEl = document.createElement('audio');
      bgAudioEl.src = audioTrack.url;
      bgAudioEl.preload = 'auto';
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        bgAudioEl!.oncanplaythrough = done;
        bgAudioEl!.onerror = done;
        setTimeout(done, 3000);
      });
      try {
        const bgSource = audioCtx.createMediaElementSource(bgAudioEl);
        const bgGain = audioCtx.createGain();
        bgGain.gain.value = soundtrackVolume;
        bgSource.connect(bgGain);
        bgGain.connect(dest);
      } catch (err) {
        console.warn('Could not connect soundtrack:', err);
      }
    }

    // Video audio routing
    for (const [id, v] of videoElements.entries()) {
      try {
        v.muted = false; // unmute for audio capture
        v.volume = videoVolume;
        const source = audioCtx.createMediaElementSource(v);
        const gain = audioCtx.createGain();
        gain.gain.value = videoVolume;
        source.connect(gain);
        gain.connect(dest);
      } catch {
        // graceful fallback
      }
    }

    // MediaStream from canvas + mixed audio
    const fps = 30;
    const canvasStream = canvas.captureStream(fps);
    const audioTracks = dest.stream.getAudioTracks();
    if (audioTracks.length > 0) {
      canvasStream.addTrack(audioTracks[0]);
    }

    // Select MIME type
    let mimeType = 'video/webm';
    if (format === 'mp4') {
      const mp4Codecs = [
        'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
        'video/mp4',
      ];
      for (const codec of mp4Codecs) {
        if (MediaRecorder.isTypeSupported(codec)) { mimeType = codec; break; }
      }
      // Fallback to webm if mp4 unsupported
      if (mimeType === 'video/webm') {
        if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9,opus')) {
          mimeType = 'video/webm; codecs=vp9,opus';
        }
      }
    } else {
      if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9,opus')) {
        mimeType = 'video/webm; codecs=vp9,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp8,opus')) {
        mimeType = 'video/webm; codecs=vp8,opus';
      }
    }

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(canvasStream, {
      mimeType,
      videoBitsPerSecond: 8_000_000,
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.start(200);

    // Start soundtrack playback
    if (bgAudioEl) {
      bgAudioEl.currentTime = 0;
      bgAudioEl.play().catch(() => {});
    }

    // Frame-by-frame rendering loop
    const totalFrames = Math.ceil(totalDuration * fps);

    for (let frame = 0; frame < totalFrames; frame++) {
      if (this.isCancelled) {
        mediaRecorder.stop();
        audioCtx.close();
        throw new Error('Export cancelled by user');
      }

      const time = frame / fps;

      // Clear canvas
      ctx.fillStyle = '#121412';
      ctx.fillRect(0, 0, width, height);

      // Find primary clip
      let primaryIndex = 0;
      for (let i = 0; i < clipRanges.length; i++) {
        if (time >= clipRanges[i].start && time < clipRanges[i].end) {
          primaryIndex = i;
          break;
        }
        if (i === clipRanges.length - 1) primaryIndex = i;
      }

      const primaryRange = clipRanges[primaryIndex];
      const primaryClip = primaryRange.clip;
      const primaryLocalTime = Math.max(
        0,
        Math.min(primaryClip.duration, time - primaryRange.start + primaryClip.trimStart)
      );

      // Check crossfade
      const nextRange = clipRanges[primaryIndex + 1];
      const isInTransition =
        crossfade &&
        nextRange &&
        time >= primaryRange.end - effectiveTransition &&
        time < primaryRange.end;

      if (isInTransition && nextRange) {
        const progress =
          (time - (primaryRange.end - effectiveTransition)) / effectiveTransition;

        // Outgoing clip
        const primaryEl =
          primaryClip.type === 'video'
            ? videoElements.get(primaryClip.id)
            : imageElements.get(primaryClip.id);
        if (primaryEl) {
          if (primaryEl instanceof HTMLVideoElement) {
            await seekVideo(primaryEl, primaryLocalTime);
          }
          drawElementWithCropMode(ctx, primaryEl, width, height, cropMode, 1.0 - progress);
        }

        // Incoming clip
        const nextClip = nextRange.clip;
        const nextLocalTime = Math.max(
          0,
          Math.min(nextClip.duration, time - nextRange.start + nextClip.trimStart)
        );
        const nextEl =
          nextClip.type === 'video'
            ? videoElements.get(nextClip.id)
            : imageElements.get(nextClip.id);
        if (nextEl) {
          if (nextEl instanceof HTMLVideoElement) {
            await seekVideo(nextEl, nextLocalTime);
          }
          drawElementWithCropMode(ctx, nextEl, width, height, cropMode, progress);
        }
      } else {
        // Single clip
        const el =
          primaryClip.type === 'video'
            ? videoElements.get(primaryClip.id)
            : imageElements.get(primaryClip.id);
        if (el) {
          if (el instanceof HTMLVideoElement) {
            await seekVideo(el, primaryLocalTime);
          }
          drawElementWithCropMode(ctx, el, width, height, cropMode, 1.0);
        }
      }

      const percent = Math.min(96, Math.round((frame / totalFrames) * 93) + 3);
      onProgress?.({
        percent,
        currentTime: time,
        totalTime: totalDuration,
        stage: 'rendering',
        message: `Compositing frame ${frame + 1} of ${totalFrames} (${percent}%)...`,
      });

      // Yield to browser for encoding — short delay per frame
      await new Promise((r) => setTimeout(r, 8));
    }

    onProgress?.({
      percent: 98,
      currentTime: totalDuration,
      totalTime: totalDuration,
      stage: 'encoding',
      message: 'Finalizing and packaging video file...',
    });

    if (bgAudioEl) bgAudioEl.pause();

    // Stop recorder and collect final blob
    const blobPromise = new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        resolve(new Blob(recordedChunks, { type: mediaRecorder.mimeType || mimeType }));
      };
    });

    mediaRecorder.stop();
    await audioCtx.close();

    const outputBlob = await blobPromise;
    const finalUrl = URL.createObjectURL(outputBlob);
    const actualFormat =
      mediaRecorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
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
