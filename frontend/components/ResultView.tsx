"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import type { AnalyzeResponse } from "@/lib/types";
import { Comparison } from "./Comparison";
import { PersonalityDashboard } from "./PersonalityDashboard";
import { Poster } from "./Poster";
import { Reveal } from "./Reveal";
import { BrandMark, CinematicBackdrop, SoundButton } from "./Visuals";

export function ResultView({ result }: { result: AnalyzeResponse }) {
  return (
    <main className="relative min-h-screen bg-night text-white">
      <div className="relative">
        <CinematicBackdrop />
        <header className="relative z-10 flex items-center justify-between border-b border-white/5 px-5 py-5 md:px-12">
          <Link href="/"><BrandMark /></Link>
          <Link href="/" className="btn-ghost !py-2.5 !text-xs">
            <RotateCcw className="h-3.5 w-3.5" /> Start over
          </Link>
        </header>
      </div>

      <Reveal result={result} />
      <Comparison result={result} />
      <PersonalityDashboard result={result} />
      <Poster result={result} />

      <footer className="border-t border-white/5 bg-ink px-5 py-10 text-center">
        <p className="display text-xl text-white/75">YOUR TWEETS. YOUR MINDSET. YOUR IDENTITY IN LEONIDA.</p>
        <p className="mx-auto mt-3 max-w-3xl text-xs leading-relaxed text-slate-600">
          Entertainment only. Not a psychological assessment. Not affiliated with Rockstar Games.
          Built with traditional NLP and mathematics — no AI model or image-generation API.
        </p>
      </footer>
      <SoundButton />
    </main>
  );
}
