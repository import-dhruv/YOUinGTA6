"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Fingerprint, Loader2, Radio, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { saveResult, streamAnalyze } from "@/lib/api";
import type { StageEvent } from "@/lib/types";
import { BrandMark, CinematicBackdrop, SoundButton, XLogo } from "./Visuals";

const STAGES = [
  "CONNECTING TO YOUR X PROFILE",
  "ANALYZING YOUR POSTS",
  "STUDYING YOUR WRITING STYLE",
  "DETECTING YOUR PERSONALITY PATTERNS",
  "CALCULATING YOUR LEONIDA IDENTITY",
  "MATCHING GTA VI CHARACTERS",
  "PREPARING YOUR CHARACTER REVEAL",
];

const STAGE_INDEX: Record<string, number> = {
  connecting: 0, connected: 0, posts: 1, style: 2, patterns: 3,
  identity: 4, matching: 5, reveal: 6,
};

const TIPS = [
  "Reading public profile metadata…",
  "Cleaning text, removing links and duplicates…",
  "Measuring vocabulary, tone and emoji patterns…",
  "Scoring fourteen behavioural signals…",
  "Comparing your vector with nine profiles…",
  "Ranking matches with weighted similarity…",
  "Finalising your identity file…",
];

export function AnalysisView({ username, demo }: { username: string; demo: boolean }) {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(4);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    streamAnalyze(username, demo, (event: StageEvent) => {
      if (event.stage === "result") {
        try {
          const result = JSON.parse(event.message);
          if (!result?.ranking?.length || result.primary?.character_id === "unknown") {
            setError("We could not find enough public data for this handle. Try a labelled demo account or the manual quiz.");
            return;
          }
          if (result?.profile) {
            saveResult(result);
            setActive(7);
            setProgress(100);
            setDone(true);
            setTimeout(() => router.push("/result"), 650);
          }
        } catch {
          /* handled below */
        }
        return;
      }
      if (event.stage === "error" || event.stage === "insufficient") {
        setError(event.message.replace(/^ERROR:\s*/, ""));
        return;
      }
      const idx = STAGE_INDEX[event.stage];
      if (idx !== undefined) {
        setActive((prev) => Math.max(prev, idx));
        setProgress((prev) => Math.max(prev, event.progress));
      }
    }).catch((err) => {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    });
  }, [username, demo, router]);

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-night text-white">
      <CinematicBackdrop dense />
      <header className="relative z-10 flex items-center justify-between px-5 py-6 md:px-12">
        <BrandMark />
        <span className="chip"><Radio className="h-3 w-3 text-neon" /> LIVE ANALYSIS</span>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 pb-20">
        {!error ? (
          <>
            <div className="mb-3 flex items-center gap-2 text-cyanx">
              <Fingerprint className="h-5 w-5" />
              <span className="condensed text-sm tracking-[0.25em]">BUILDING YOUR LEONIDA FILE</span>
            </div>
            <h1 className="display text-4xl text-white md:text-6xl">
              ANALYSING <span className="neon-text">@{username}</span>
            </h1>

            <div className="mt-8 glass-strong rounded-lg p-6 md:p-9">
              <div className="mb-3 flex items-end justify-between">
                <span className="condensed text-xs tracking-[0.2em] text-slate-400">PROGRESS</span>
                <span className="display text-2xl text-neon">{Math.round(progress)}%</span>
              </div>
              <div className="bar-track mb-9"><div className="bar-fill" style={{ width: `${progress}%` }} /></div>

              <div className="space-y-1">
                {STAGES.map((stage, i) => {
                  const state = i < active ? "done" : i === active ? "active" : "idle";
                  return (
                    <AnimatePresence key={stage}>
                      <motion.div
                        className="stage-line"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: state === "idle" ? 0.32 : 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className={`stage-dot ${state}`}>
                          {state === "done" ? <Check className="h-3 w-3" /> : state === "active" ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="text-[10px]">{i + 1}</span>}
                        </div>
                        <p className={`condensed pt-0.5 text-sm tracking-[0.12em] md:text-base ${state === "active" ? "neon-text" : state === "done" ? "text-cyanx" : "text-slate-500"}`}>
                          {stage}
                        </p>
                        {state === "active" && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-0.5 text-xs text-slate-500">
                            {TIPS[i]}
                          </motion.p>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  );
                })}
              </div>
            </div>

            {done && (
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center text-cyanx">
                <Sparkles className="mr-2 inline h-4 w-4" /> Identity file complete — opening the reveal…
              </motion.p>
            )}

            <p className="mt-7 text-center text-xs leading-relaxed text-slate-600">
              Stages reflect real processing steps on the server. If the profile is protected or posts are unavailable, we&apos;ll tell you instead of inventing data.
            </p>
          </>
        ) : (
          <div className="glass-strong mx-auto max-w-xl rounded-lg p-8 text-center">
            <XLogo className="mx-auto h-8 w-8 text-slate-400" />
            <h1 className="display mt-5 text-3xl text-white">NO DATA AVAILABLE</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">{error}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button className="btn-primary !px-5 !py-2.5 !text-sm" onClick={() => router.push("/")}>Try another handle</button>
              <button className="btn-ghost" onClick={() => router.push("/?quiz=1")}>Take the quiz</button>
            </div>
          </div>
        )}
      </div>
      <SoundButton />
    </main>
  );
}
