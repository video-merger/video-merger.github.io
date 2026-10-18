import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');

// 1. Create 1200x630 OG Image SVG
const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Radial Gradients -->
    <radialGradient id="bgGlow" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#212620" />
      <stop offset="60%" stop-color="#141714" />
      <stop offset="100%" stop-color="#0c0e0c" />
    </radialGradient>
    <radialGradient id="accentGlow" cx="20%" cy="20%" r="50%">
      <stop offset="0%" stop-color="#6A795D" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#6A795D" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a3028" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#1a1d19" stop-opacity="0.9" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#D4AF37" />
      <stop offset="50%" stop-color="#F3E5AB" />
      <stop offset="100%" stop-color="#8F9E7D" />
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#D6DDD0" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Deep Studio Base Background -->
  <rect width="1200" height="630" fill="url(#bgGlow)"/>
  <rect width="1200" height="630" fill="url(#accentGlow)"/>

  <!-- Border Frame -->
  <rect x="24" y="24" width="1152" height="582" rx="24" fill="none" stroke="#363e32" stroke-width="1.5" stroke-opacity="0.6"/>

  <!-- Top Badge -->
  <g transform="translate(100, 95)">
    <rect width="310" height="40" rx="20" fill="#232a21" stroke="#4a5542" stroke-width="1.2"/>
    <circle cx="22" cy="20" r="5" fill="#4ade80" />
    <text x="36" y="25" fill="#a4b39b" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" letter-spacing="1">100% PRIVATE • ZERO-SERVER</text>
  </g>

  <!-- Main Headline -->
  <g transform="translate(100, 195)">
    <text x="0" y="0" fill="url(#textGrad)" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="800" letter-spacing="-1.5">
      Merge Videos Online
    </text>
    <text x="0" y="52" fill="url(#goldGrad)" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="700">
      Fast, Private Browser Video Joiner &amp; Combiner
    </text>
  </g>

  <!-- Subtitle Paragraph -->
  <g transform="translate(100, 310)">
    <text x="0" y="0" fill="#9da896" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400">
      Combine multiple video clips, photos &amp; audio tracks with smooth crossfades.
    </text>
    <text x="0" y="32" fill="#9da896" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400">
      Zero uploads to any server. Hardware-accelerated WebCodecs export.
    </text>
  </g>

  <!-- Feature Pills -->
  <g transform="translate(100, 410)">
    <!-- Pill 1 -->
    <rect x="0" y="0" width="180" height="46" rx="12" fill="#1e231d" stroke="#374133" stroke-width="1"/>
    <text x="20" y="29" fill="#e2e8df" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600">✨ No Watermark</text>

    <!-- Pill 2 -->
    <rect x="200" y="0" width="220" height="46" rx="12" fill="#1e231d" stroke="#374133" stroke-width="1"/>
    <text x="220" y="29" fill="#e2e8df" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600">⚡ Hardware WebCodecs</text>

    <!-- Pill 3 -->
    <rect x="440" y="0" width="180" height="46" rx="12" fill="#1e231d" stroke="#374133" stroke-width="1"/>
    <text x="460" y="29" fill="#e2e8df" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600">♾️ Unlimited Size</text>

    <!-- Pill 4 -->
    <rect x="640" y="0" width="210" height="46" rx="12" fill="#1e231d" stroke="#374133" stroke-width="1"/>
    <text x="660" y="29" fill="#e2e8df" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600">📐 TikTok / 16:9 / 1:1</text>
  </g>

  <!-- Visual Filmstrip Illustration on Right Side -->
  <g transform="translate(900, 180)" filter="url(#shadow)">
    <!-- Filmstrip Outer -->
    <rect x="0" y="0" width="200" height="300" rx="18" fill="url(#cardGrad)" stroke="#4e5b47" stroke-width="1.8"/>
    <!-- Film Perforations Left -->
    <rect x="10" y="16" width="12" height="18" rx="3" fill="#121412"/>
    <rect x="10" y="50" width="12" height="18" rx="3" fill="#121412"/>
    <rect x="10" y="84" width="12" height="18" rx="3" fill="#121412"/>
    <rect x="10" y="118" width="12" height="18" rx="3" fill="#121412"/>
    <rect x="10" y="152" width="12" height="18" rx="3" fill="#121412"/>
    <rect x="10" y="186" width="12" height="18" rx="3" fill="#121412"/>
    <rect x="10" y="220" width="12" height="18" rx="3" fill="#121412"/>
    <rect x="10" y="254" width="12" height="18" rx="3" fill="#121412"/>
    
    <!-- Film Perforations Right -->
    <rect x="178" y="16" width="12" height="18" rx="3" fill="#121412"/>
    <rect x="178" y="50" width="12" height="18" rx="3" fill="#121412"/>
    <rect x="178" y="84" width="12" height="18" rx="3" fill="#121412"/>
    <rect x="178" y="118" width="12" height="18" rx="3" fill="#121412"/>
    <rect x="178" y="152" width="12" height="18" rx="3" fill="#121412"/>
    <rect x="178" y="186" width="12" height="18" rx="3" fill="#121412"/>
    <rect x="178" y="220" width="12" height="18" rx="3" fill="#121412"/>
    <rect x="178" y="254" width="12" height="18" rx="3" fill="#121412"/>

    <!-- Central Clip Screen 1 -->
    <rect x="34" y="24" width="132" height="74" rx="8" fill="#182017" stroke="#3b4834"/>
    <polygon points="94,54 94,68 108,61" fill="#6A795D"/>
    
    <!-- Central Clip Screen 2 -->
    <rect x="34" y="112" width="132" height="74" rx="8" fill="#252b22" stroke="#526349"/>
    <polygon points="94,142 94,156 108,149" fill="#8F9E7D"/>

    <!-- Central Clip Screen 3 -->
    <rect x="34" y="200" width="132" height="74" rx="8" fill="#182017" stroke="#3b4834"/>
    <polygon points="94,230 94,244 108,237" fill="#6A795D"/>
  </g>

  <!-- Bottom URL / Brand line -->
  <g transform="translate(100, 528)">
    <text x="0" y="0" fill="#717e6a" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600">
      video-merger.github.io
    </text>
    <text x="210" y="0" fill="#4d5747" font-family="system-ui, -apple-system, sans-serif" font-size="16">
      • Free, Open Source &amp; Client-Side
    </text>
  </g>
</svg>
`;

fs.writeFileSync(path.join(publicDir, 'og-image.svg'), ogSvg.trim());

// 2. Render og-image.png (1200x630)
await sharp(Buffer.from(ogSvg))
  .resize(1200, 630)
  .png({ quality: 95, compressionLevel: 8 })
  .toFile(path.join(publicDir, 'og-image.png'));

console.log('Created og-image.svg and og-image.png');

// 3. App Icons for PWA
const iconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="iconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#242c22"/>
      <stop offset="100%" stop-color="#121412"/>
    </linearGradient>
    <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#6A795D"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#iconBg)"/>
  <rect x="24" y="24" width="464" height="464" rx="88" stroke="#3b4834" stroke-width="8"/>
  
  <!-- Filmstrip body -->
  <rect x="116" y="116" width="280" height="280" rx="36" fill="#1b2019" stroke="url(#iconGrad)" stroke-width="12"/>
  
  <!-- Perforations -->
  <rect x="136" y="146" width="32" height="42" rx="8" fill="#6A795D"/>
  <rect x="136" y="206" width="32" height="42" rx="8" fill="#6A795D"/>
  <rect x="136" y="266" width="32" height="42" rx="8" fill="#6A795D"/>
  <rect x="136" y="326" width="32" height="42" rx="8" fill="#6A795D"/>

  <rect x="344" y="146" width="32" height="42" rx="8" fill="#6A795D"/>
  <rect x="344" y="206" width="32" height="42" rx="8" fill="#6A795D"/>
  <rect x="344" y="266" width="32" height="42" rx="8" fill="#6A795D"/>
  <rect x="344" y="326" width="32" height="42" rx="8" fill="#6A795D"/>

  <!-- Play / Merge symbol in center -->
  <polygon points="230,206 230,306 310,256" fill="url(#iconGrad)"/>
</svg>
`;

await sharp(Buffer.from(iconSvg)).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
await sharp(Buffer.from(iconSvg)).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
await sharp(Buffer.from(iconSvg)).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));

console.log('Created icon-512.png, icon-192.png, apple-touch-icon.png');
