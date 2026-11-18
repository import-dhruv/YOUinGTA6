"use client";

import { motion } from "framer-motion";
import { BarChart3, Info, Radar as RadarIcon } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, PolarAngleAxis, PolarGrid, PolarRadiusAxis,
  Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { TRAITS, TRAIT_EXPLANATIONS, TRAIT_LABELS, type AnalyzeResponse, type Trait } from "@/lib/types";

export function PersonalityDashboard({ result }: { result: AnalyzeResponse }) {
  const { vector, features, overall_confidence, posts_analyzed, data_source } = result.personality;
  const characterTraits = result.primary;

  const radarData = TRAITS.map((trait) => ({
    trait: TRAIT_LABELS[trait].replace(" ", "\n"),
    You: Math.round(vector[trait] ?? 0),
    [result.primary.name]: Math.round(characterTraits.matching_traits.find((t) => t.trait === trait)?.character_score ?? 50),
  }));

  const barData = TRAITS.map((trait) => ({
    name: TRAIT_LABELS[trait].split(" ")[0],
    full: TRAIT_LABELS[trait],
    value: Math.round(vector[trait] ?? 0),
    trait,
  }));

  const topTraits = [...TRAITS].sort((a, b) => (vector[b] ?? 0) - (vector[a] ?? 0)).slice(0, 6);

  return (
    <section id="dashboard" className="relative scroll-mt-10 border-t border-white/5 bg-ink px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="condensed text-sm tracking-[0.3em] text-cyanx">PERSONALITY DASHBOARD</p>
          <h2 className="display mt-2 text-4xl text-white md:text-6xl">THE NUMBERS BEHIND IT</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
            Scores are derived from language patterns in {posts_analyzed > 0 ? `${posts_analyzed} public post(s)` : "your quiz answers"}.
            They are {data_source === "quiz" ? "self-reported" : "behavioural indicators"} — not psychological measurements.
            Confidence: <span className="text-cyanx">{Math.round(overall_confidence * 100)}%</span>.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Radar */}
          <motion.div initial={{ opacity: 0, x: -25 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass rounded-lg p-6">
            <div className="mb-3 flex items-center gap-2">
              <RadarIcon className="h-4 w-4 text-neon" />
              <h3 className="condensed text-sm tracking-[0.2em] text-white">YOU VS {result.primary.name.toUpperCase()}</h3>
            </div>
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="rgba(255,255,255,0.13)" />
                  <PolarAngleAxis dataKey="trait" tick={{ fill: "#cbd5e1", fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="You" dataKey="You" stroke="#ff2d95" fill="#ff2d95" fillOpacity={0.4} />
                  <Radar name={result.primary.name} dataKey={result.primary.name} stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.16} />
                  <Tooltip contentStyle={{ background: "rgba(10,5,24,0.95)", border: "1px solid rgba(255,45,149,0.4)", borderRadius: 6 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-neon" /> You</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-cyanx" /> {result.primary.name}</span>
            </div>
          </motion.div>

          {/* Bars */}
          <motion.div initial={{ opacity: 0, x: 25 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass rounded-lg p-6">
            <div className="mb-5 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyanx" />
              <h3 className="condensed text-sm tracking-[0.2em] text-white">YOUR 14 SIGNALS</h3>
            </div>
            <div className="grid max-h-[400px] grid-cols-1 gap-x-6 gap-y-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {barData.map((item, i) => (
                <div key={item.trait}>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-slate-300">{item.full}</span>
                    <span className="font-semibold text-white">{item.value}</span>
                  </div>
                  <div className="bar-track"><motion.div className="bar-fill" initial={{ width: 0 }} whileInView={{ width: `${item.value}%` }} viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.03 }} /></div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Comparison bar chart */}
        <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass mt-6 rounded-lg p-6">
          <h3 className="condensed mb-5 text-sm tracking-[0.2em] text-white">TOP TRAITS: YOU VS YOUR MATCH</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTraits.map((t) => ({ name: TRAIT_LABELS[t], You: Math.round(vector[t] ?? 0), Match: characterTraits.matching_traits.find((x) => x.trait === t)?.character_score ?? 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "rgba(10,5,24,0.95)", border: "1px solid rgba(34,211,238,0.4)", borderRadius: 6 }} />
                <Bar dataKey="You" fill="#ff2d95" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Match" fill="#22d3ee" radius={[3, 3, 0, 0]}>
                  {topTraits.map((_, i) => <Cell key={i} fill="#22d3ee" fillOpacity={0.75} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Explanations */}
        <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-400" />
            <h3 className="condensed text-sm tracking-[0.2em] text-slate-300">HOW EACH SCORE WAS ESTIMATED</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {TRAITS.map((trait: Trait) => (
              <div key={trait} className="glass rounded-md p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{TRAIT_LABELS[trait]}</p>
                  <span className="condensed text-lg text-neon">{Math.round(vector[trait] ?? 0)}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {features?.[trait]?.explanation || TRAIT_EXPLANATIONS[trait]}
                </p>
                {features?.[trait] && (
                  <p className="mt-2 text-[10px] text-slate-600">
                    {features[trait].posts_contributing} post(s) contributed · raw signal {features[trait].raw_count}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
