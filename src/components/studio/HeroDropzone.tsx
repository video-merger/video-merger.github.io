import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Film,
  Image as ImageIcon,
  Music,
  Split,
  Sliders,
  Shield,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { getTranslations, type LanguageCode } from '../../i18n/translations';

interface HeroDropzoneProps {
  currentLang: LanguageCode;
  onFilesSelected: (files: FileList | File[]) => Promise<void>;
  isLoading: boolean;
}

export const HeroDropzone: React.FC<HeroDropzoneProps> = ({
  currentLang,
  onFilesSelected,
  isLoading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = getTranslations(currentLang);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await onFilesSelected(e.target.files);
    }
  };

  return (
    <div className="relative overflow-hidden pt-6 pb-16 sm:pt-10 sm:pb-24">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-sand-200/30 via-sage-400/10 to-transparent dark:from-sand-300/5 dark:via-sage-400/5 pointer-events-none blur-3xl -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Zero-Server Security Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sand-200/70 dark:bg-studio-surface border border-sand-300/60 dark:border-studio-border text-moss-700 dark:text-sand-300 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-moss-600 dark:text-sand-300" />
          <span>{t.nav.privacyBadge}</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-moss-800 dark:text-sand-100 leading-[1.12]">
          {t.hero.title}
        </h1>
        <p className="mt-4 sm:mt-5 text-base sm:text-xl text-olive-600 dark:text-sage-300 max-w-2xl mx-auto font-normal leading-relaxed">
          {t.hero.subtitle}
        </p>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,image/*,audio/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Interactive Dropzone Card */}
        <div className="mt-8 sm:mt-10 max-w-2xl mx-auto">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative rounded-3xl border-2 border-dashed cursor-pointer p-8 sm:p-12 transition-all duration-300 backdrop-blur-sm ${
              isDragOver
                ? 'border-moss-600 dark:border-sand-300 bg-sand-200/40 dark:bg-studio-surface scale-[1.01] shadow-glow-sand'
                : 'border-sand-300 dark:border-studio-border bg-white/70 dark:bg-studio-surface/80 hover:border-moss-500 dark:hover:border-sand-300/80 shadow-luxury-light dark:shadow-luxury-dark'
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              {isLoading ? (
                <div className="flex flex-col items-center py-6">
                  <Loader2 className="w-12 h-12 text-moss-600 dark:text-sand-300 animate-spin mb-4" />
                  <p className="text-base font-semibold text-moss-700 dark:text-sand-200">
                    Importing & extracting frames...
                  </p>
                  <p className="text-xs text-olive-500 dark:text-sage-400 mt-1">
                    Processed 100% locally in your browser memory
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-sand-300 to-sage-400 dark:from-sand-300/20 dark:to-sage-400/20 flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 group-hover:rotate-1 transition-all duration-200">
                    <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-moss-700 dark:text-sand-300" />
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-8 py-3.5 rounded-xl font-bold text-base sm:text-lg bg-moss-600 hover:bg-moss-700 text-white dark:bg-sand-300 dark:text-studio-surface dark:hover:bg-sand-400 shadow-md hover:shadow-lg active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-sage-400/30"
                  >
                    {t.hero.chooseFiles}
                  </button>

                  <p className="mt-4 text-sm font-medium text-olive-600 dark:text-sage-300">
                    {t.hero.dropHint}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-olive-500 dark:text-sage-400">
                    <span className="px-2 py-0.5 rounded bg-sand-200/50 dark:bg-studio-card font-mono text-[11px]">MP4</span>
                    <span className="px-2 py-0.5 rounded bg-sand-200/50 dark:bg-studio-card font-mono text-[11px]">WebM</span>
                    <span className="px-2 py-0.5 rounded bg-sand-200/50 dark:bg-studio-card font-mono text-[11px]">MOV</span>
                    <span className="px-2 py-0.5 rounded bg-sand-200/50 dark:bg-studio-card font-mono text-[11px]">JPG</span>
                    <span className="px-2 py-0.5 rounded bg-sand-200/50 dark:bg-studio-card font-mono text-[11px]">PNG</span>
                    <span className="px-2 py-0.5 rounded bg-sand-200/50 dark:bg-studio-card font-mono text-[11px]">MP3</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Feature Cards */}
        <div className="mt-14 sm:mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {t.hero.features.map((feature, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white/70 dark:bg-studio-surface/70 border border-sand-200/60 dark:border-studio-border text-left shadow-sm hover:border-sage-400 dark:hover:border-sand-300/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-sand-200/70 dark:bg-studio-card flex items-center justify-center text-moss-700 dark:text-sand-300 mb-2.5">
                {idx === 0 && <Film className="w-4 h-4" />}
                {idx === 1 && <ImageIcon className="w-4 h-4" />}
                {idx === 2 && <Music className="w-4 h-4" />}
                {idx === 3 && <Split className="w-4 h-4" />}
                {idx === 4 && <Sliders className="w-4 h-4" />}
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-moss-800 dark:text-sand-200">{feature.title}</h3>
              <p className="mt-1 text-[11px] text-olive-500 dark:text-sage-400 leading-snug">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Security & Privacy Callout */}
        <div className="mt-10 sm:mt-12 p-4 rounded-2xl bg-sage-400/10 dark:bg-studio-card/70 border border-sage-400/25 max-w-xl mx-auto flex items-center gap-3 text-left">
          <Shield className="w-5 h-5 text-moss-600 dark:text-sand-300 shrink-0" />
          <p className="text-xs text-moss-700 dark:text-sage-300 font-medium">
            {t.hero.securityGuarantee}
          </p>
        </div>
      </div>
    </div>
  );
};
