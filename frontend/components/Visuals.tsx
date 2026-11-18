"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { useAmbient } from "@/lib/useAmbient";

export function XLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function PalmTree({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 200 320"
      className={className}
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden="true"
    >
      <path
        d="M96 320 C104 250 100 190 96 128 C94 100 90 78 84 56"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <g fill="currentColor">
        <path d="M84 58 C50 30 22 30 4 44 C28 40 52 48 78 68 Z" />
        <path d="M84 58 C58 20 34 12 14 18 C40 24 58 42 80 66 Z" />
        <path d="M84 58 C74 20 80 4 96 0 C82 20 82 40 88 62 Z" />
        <path d="M84 58 C104 20 130 10 152 16 C122 24 104 42 90 66 Z" />
        <path d="M84 58 C116 32 146 34 166 50 C136 42 110 50 86 68 Z" />
        <path d="M84 58 C60 52 38 62 26 82 C48 66 66 62 88 66 Z" />
      </g>
    </svg>
  );
}

export function CinematicBackdrop({ dense = false }: { dense?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="sky" />
      <div className="sun" />
      <div className="skyline" />
      <div className="horizon" />
      <div className="absolute bottom-[6%] left-[-2%] w-[clamp(140px,20vw,300px)] text-[#080314] opacity-90">
        <PalmTree className="w-full" />
      </div>
      <div className="absolute bottom-[3%] right-[-3%] w-[clamp(170px,24vw,360px)] text-[#080314] opacity-95">
        <PalmTree className="w-full" flip />
      </div>
      {dense && <div className="scanlines" />}
      <div className="grain" />
    </div>
  );
}

export function SoundToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="btn-ghost fixed bottom-5 right-5 z-50 !rounded-full !px-3.5 !py-3"
      aria-label={enabled ? "Mute cinematic sound" : "Enable cinematic sound"}
      title={enabled ? "Mute sound" : "Enable sound"}
    >
      {enabled ? <Volume2 className="h-4 w-4 text-neon" /> : <VolumeX className="h-4 w-4" />}
    </button>
  );
}

export function SoundButton() {
  const { enabled, toggle } = useAmbient();
  return <SoundToggle enabled={enabled} onToggle={toggle} />;
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-8 w-8 items-center justify-center rounded-sm border border-neon/60 bg-neon/10 shadow-[0_0_18px_rgba(255,45,149,0.35)]">
        <span className="display text-lg leading-none text-neon">Y</span>
      </div>
      {!compact && (
        <span className="display text-lg tracking-wider text-white">
          YOU<span className="text-neon">in</span>GTA6
        </span>
      )}
    </div>
  );
}

export function CharacterImage({
  src,
  name,
  className = "",
  accent = "#ff2d95",
}: {
  src?: string;
  name: string;
  className?: string;
  accent?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");

  if (!src || failed) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden ${className}`}
        style={{ background: `radial-gradient(circle at 50% 35%, ${accent}44, #0a0418 70%)` }}
        aria-label={name}
      >
        <span className="display text-6xl text-white/25">{initials}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className={`object-cover object-top ${className}`}
    />
  );
}
