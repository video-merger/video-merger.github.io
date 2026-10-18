export interface ClipItem {
  id: string;
  file: File;
  type: 'video' | 'image';
  name: string;
  url: string;
  originalDuration: number;
  duration: number; // effective duration = trimEnd - trimStart
  trimStart: number;
  trimEnd: number;
  thumbnailUrl: string;
  width: number;
  height: number;
  volume: number; // 0 to 1
}

export interface AudioItem {
  id: string;
  file: File;
  name: string;
  url: string;
  duration: number;
  volume: number; // 0 to 1
}

export type AspectRatioType = '16:9' | '9:16' | '1:1' | '5:4';
export type CropModeType = 'fit' | 'fill' | 'blur';

export interface AspectRatioDetails {
  ratio: AspectRatioType;
  label: string;
  sublabel: string;
  width: number;
  height: number;
}

export const ASPECT_RATIOS: Record<AspectRatioType, AspectRatioDetails> = {
  '16:9': {
    ratio: '16:9',
    label: '16:9',
    sublabel: 'Landscape / YouTube',
    width: 1920,
    height: 1080,
  },
  '9:16': {
    ratio: '9:16',
    label: '9:16',
    sublabel: 'Vertical / TikTok & Reels',
    width: 1080,
    height: 1920,
  },
  '1:1': {
    ratio: '1:1',
    label: '1:1',
    sublabel: 'Square / Instagram',
    width: 1080,
    height: 1080,
  },
  '5:4': {
    ratio: '5:4',
    label: '5:4',
    sublabel: 'Portrait / Classic',
    width: 1350,
    height: 1080,
  },
};

/**
 * Generates thumbnail and metadata from a video file
 */
export async function processVideoFile(file: File): Promise<ClipItem> {
  const url = URL.createObjectURL(file);
  const id = `clip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      // Seek slightly into the video to capture an active thumbnail
      const seekTime = Math.min(1.0, video.duration / 2);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        const targetWidth = 320;
        const scale = targetWidth / (video.videoWidth || 640);
        const targetHeight = Math.round((video.videoHeight || 360) * scale);

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          const rawDuration = Math.max(0.1, video.duration || 1);

          resolve({
            id,
            file,
            type: 'video',
            name: file.name,
            url,
            originalDuration: rawDuration,
            duration: rawDuration,
            trimStart: 0,
            trimEnd: rawDuration,
            thumbnailUrl,
            width: video.videoWidth || 1920,
            height: video.videoHeight || 1080,
            volume: 1,
          });
        } else {
          fallbackResolve();
        }
      } catch (err) {
        fallbackResolve();
      }
    };

    video.onerror = () => {
      fallbackResolve();
    };

    function fallbackResolve() {
      const rawDuration = Math.max(0.1, video.duration || 5);
      resolve({
        id,
        file,
        type: 'video',
        name: file.name,
        url,
        originalDuration: rawDuration,
        duration: rawDuration,
        trimStart: 0,
        trimEnd: rawDuration,
        thumbnailUrl: url,
        width: 1920,
        height: 1080,
        volume: 1,
      });
    }
  });
}

/**
 * Generates thumbnail and metadata from an image file
 */
export async function processImageFile(file: File, defaultDuration = 4.0): Promise<ClipItem> {
  const url = URL.createObjectURL(file);
  const id = `clip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        id,
        file,
        type: 'image',
        name: file.name,
        url,
        originalDuration: defaultDuration,
        duration: defaultDuration,
        trimStart: 0,
        trimEnd: defaultDuration,
        thumbnailUrl: url,
        width: img.naturalWidth || 1920,
        height: img.naturalHeight || 1080,
        volume: 0,
      });
    };
    img.onerror = () => {
      resolve({
        id,
        file,
        type: 'image',
        name: file.name,
        url,
        originalDuration: defaultDuration,
        duration: defaultDuration,
        trimStart: 0,
        trimEnd: defaultDuration,
        thumbnailUrl: url,
        width: 1920,
        height: 1080,
        volume: 0,
      });
    };
    img.src = url;
  });
}

/**
 * Extracts metadata for an audio file
 */
export async function processAudioFile(file: File): Promise<AudioItem> {
  const url = URL.createObjectURL(file);
  const id = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.src = url;

    audio.onloadedmetadata = () => {
      resolve({
        id,
        file,
        name: file.name,
        url,
        duration: audio.duration || 30,
        volume: 0.8,
      });
    };

    audio.onerror = () => {
      resolve({
        id,
        file,
        name: file.name,
        url,
        duration: 30,
        volume: 0.8,
      });
    };
  });
}

/**
 * Formats seconds into MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const s = Math.floor(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
