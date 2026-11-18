"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, GitCompare, X as CloseIcon } from "lucide-react";
import { useState } from "react";
import type { AnalyzeResponse, CharacterMatch } from "@/lib/types";
import { CharacterImage } from "./Visuals";

export function Comparison({ result }: { result: AnalyzeResponse }) {
  const [selected, setSelected] = useState<CharacterMatch | null>(null);
  const top = [result.primary, ...result.runners_up].filter(Boolean);

  return (
    <section id="comparison" className="relative border-t border-white/5 bg-night px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="condensed text-sm tracking-[0.3em] text-neon">THE LINEUP</p>
          <h2 className="display mt-2 text-4xl text-white md:text-6xl">YOUR TOP THREE MATCHES</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
            Ranked by relative similarity. Click any character to see the trait-by-trait comparison.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {top.map((char, i) => (
            <motion.button
              key={char.character_id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              onClick={() => setSelected(char)}
              className="glass noise-card group relative overflow-hidden rounded-lg p-5 text-left transition-colors hover:border-neon/50"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="condensed text-xs tracking-[0.2em] text-slate-500">#{i + 1} MATCH</span>
                <ArrowUpRight className="h-4 w-4 text-slate-500 transition-colors group-hover:text-neon" />
              </div>
              <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-md border border-white/10">
                <CharacterImage src={char.image} name={char.name} accent={char.accent} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-3 left-3 display text-2xl text-white">{char.name}</div>
                <div className="absolute right-3 top-3 display rounded bg-black/60 px-2 py-1 text-xl" style={{ color: char.accent }}>{char.match_score}%</div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-cyanx">Matching traits</p>
                <div className="flex flex-wrap gap-1.5">
                  {char.matching_traits.slice(0, 3).map((t) => (
                    <span key={t.trait} className="chip !py-1 !text-[10px]">{t.label}</span>
                  ))}
                </div>
                {char.biggest_difference && (
                  <p className="pt-1 text-xs leading-relaxed text-slate-500">
                    <span className="text-amber-300/80">Biggest gap:</span> {char.biggest_difference.label} — you {char.biggest_difference.user_score}, they {char.biggest_difference.character_score}.
                  </p>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          Character bios are paraphrased from official promotional material. Trait values are configurable assumptions for this fan project.
        </p>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="glass-strong max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-cyanx"><GitCompare className="h-5 w-5" /><span className="condensed text-sm tracking-[0.2em]">TRAIT COMPARISON</span></div>
              <button onClick={() => setSelected(null)} className="btn-ghost !p-2.5" aria-label="Close"><CloseIcon className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 flex items-center gap-5">
              <CharacterImage src={selected.image} name={selected.name} accent={selected.accent} className="h-24 w-20 shrink-0 rounded-md" />
              <div>
                <h3 className="display text-3xl text-white">{selected.name}</h3>
                <p className="condensed mt-1 text-sm tracking-wider" style={{ color: selected.accent }}>{selected.match_score}% MATCH</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{selected.canonical_bio}</p>
              </div>
            </div>
            <div className="mt-7 space-y-3">
              {[...selected.matching_traits].sort((a, b) => b.difference - a.difference).map((t) => (
                <div key={t.trait}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-300">{t.label}</span>
                    <span className="text-slate-500">you {t.user_score} · them {t.character_score}</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="bar-track flex-1"><div className="bar-fill" style={{ width: `${t.user_score}%` }} /></div>
                    <div className="bar-track flex-1"><div className="h-full rounded-full" style={{ width: `${t.character_score}%`, background: selected.accent }} /></div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[11px] leading-relaxed text-slate-600">{selected.interpretation_note}</p>
          </motion.div>
        </div>
      )}
    </section>
  );
}
