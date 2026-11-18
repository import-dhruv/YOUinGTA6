"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowDown, Check, Quote, Sparkles } from "lucide-react";
import type { AnalyzeResponse } from "@/lib/types";
import { CharacterImage, XLogo } from "./Visuals";

function CountUp({ value }: { value: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="display gradient-text text-[clamp(5rem,16vw,11rem)] leading-none"
    >
      {value}<span className="text-[0.4em]">%</span>
    </motion.span>
  );
}

export function Reveal({ result }: { result: AnalyzeResponse }) {
  const { primary, profile, personality, reasons } = result;
  const demo = profile.demo;
  const hasData = profile.available && profile.post_count_analyzed > 0;

  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-16 md:pt-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-40"
        style={{ background: `radial-gradient(60% 70% at 50% 0%, ${primary.accent}40, transparent 70%)` }} />

      <div className="relative mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="condensed text-sm tracking-[0.35em] text-cyanx">YOUR LEONIDA IDENTITY</p>
          <h2 className="display mt-2 text-2xl text-slate-300 md:text-3xl">YOU ARE:</h2>
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="display mt-2 text-[clamp(3.2rem,10vw,8rem)] text-white"
            style={{ textShadow: `0 0 40px ${primary.accent}80` }}
          >
            {primary.name}
          </motion.h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-300 md:text-lg">“{primary.tagline}”</p>
        </motion.div>

        {/* ---------- Composition ---------- */}
        <div className="mt-12 grid items-center gap-5 md:grid-cols-[1fr_auto_1fr]">
          {/* User card */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.7 }}
            className="glass noise-card relative overflow-hidden rounded-lg p-5"
          >
            <p className="condensed mb-4 text-xs tracking-[0.25em] text-slate-400">THE PERSON</p>
            <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-white/10 bg-ink">
              {profile.profile_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.profile_image_url} alt={profile.display_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet/30 to-ink">
                  <XLogo className="h-20 w-20 text-white/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="text-lg font-bold text-white">{profile.display_name}</p>
                <p className="flex items-center gap-1.5 text-sm text-slate-300"><XLogo className="h-3 w-3" /> @{profile.username}</p>
              </div>
            </div>
            {demo && <span className="chip mt-3 border-cyanx/40 text-cyanx">DEMO ACCOUNT · FICTIONAL</span>}
            {!hasData && !demo && <span className="chip mt-3 border-amber-400/40 text-amber-300">NO POSTS ANALYSED</span>}
          </motion.div>

          {/* VS + score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center py-2 text-center"
          >
            <div className="display relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-neon/60 bg-neon/10 text-2xl text-neon shadow-[0_0_35px_rgba(255,45,149,0.5)]">
              VS
            </div>
            <div className="my-4 h-px w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <CountUp value={primary.match_score} />
            <p className="condensed mt-1 text-sm tracking-[0.25em] text-slate-300">PERSONALITY MATCH</p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
              <Sparkles className="h-3 w-3 text-cyanx" /> relative similarity score
            </div>
          </motion.div>

          {/* Character card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.7 }}
            className="glass noise-card relative overflow-hidden rounded-lg p-5"
            style={{ borderColor: `${primary.accent}55` }}
          >
            <p className="condensed mb-4 text-xs tracking-[0.25em]" style={{ color: primary.accent }}>THE LEGEND</p>
            <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-white/10 bg-ink">
              <CharacterImage src={primary.image} name={primary.name} accent={primary.accent} className="h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="display text-2xl text-white">{primary.name}</p>
                <p className="text-xs text-slate-300">GTA VI · LEONIDA</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">{primary.canonical_bio}</p>
          </motion.div>
        </div>

        {/* ---------- Warnings ---------- */}
        {(personality.warning || personality.low_confidence) && hasData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 flex items-start gap-3 rounded-md border border-amber-400/30 bg-amber-400/5 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div>
              <p className="text-sm font-semibold text-amber-200">Lower-confidence result</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-100/70">{personality.warning || "Limited data available — treat this as a rough first impression."}</p>
            </div>
          </motion.div>
        )}

        {/* ---------- Reasons ---------- */}
        {reasons.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mt-12">
            <div className="divider-neon mb-7" />
            <h3 className="display text-center text-3xl text-white md:text-4xl">WHY THIS MATCH?</h3>
            <div className="mx-auto mt-7 grid max-w-5xl gap-4 md:grid-cols-2">
              {reasons.map((reason, i) => (
                <div key={i} className="glass rounded-md p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neon/15 text-neon"><Check className="h-3.5 w-3.5" /></span>
                    <span className="condensed text-xs tracking-[0.2em] text-slate-400">SIGNAL {String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300">{reason}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Evidence from actual posts */}
        {hasData && Object.values(personality.features || {}).length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mx-auto mt-8 max-w-5xl">
            <p className="condensed mb-3 text-xs tracking-[0.2em] text-cyanx">EVIDENCE FROM YOUR ACTUAL POSTS</p>
            <div className="grid gap-3 md:grid-cols-3">
              {primary.matching_traits.slice(0, 3).map((trait) => {
                const evidence = personality.features?.[trait.trait]?.evidence?.[0];
                if (!evidence) return null;
                return (
                  <div key={trait.trait} className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                    <Quote className="mb-2 h-4 w-4 text-neon/70" />
                    <p className="text-xs italic leading-relaxed text-slate-300">“{evidence.text}”</p>
                    <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">
                      matched: {evidence.matched_terms.join(", ")}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <div className="mt-14 flex justify-center">
          <a href="#dashboard" className="condensed flex items-center gap-2 text-sm tracking-[0.25em] text-slate-400 transition-colors hover:text-neon">
            EXPLORE YOUR PERSONALITY DASHBOARD <ArrowDown className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
