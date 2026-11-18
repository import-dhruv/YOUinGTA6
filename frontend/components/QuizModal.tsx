"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import type { Trait } from "@/lib/types";

type Option = { label: string; delta: Partial<Record<Trait, number>> };
type Question = { title: string; subtitle: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    title: "A new opportunity lands in your lap.",
    subtitle: "What's your first move?",
    options: [
      { label: "Study it, then go all in.", delta: { ambition: 28, strategic_thinking: 22 } },
      { label: "Say yes first, figure it out later.", delta: { impulsiveness: 24, risk_appetite: 18 } },
      { label: "Only if my people are in.", delta: { loyalty: 24, social_energy: 14 } },
      { label: "Pass — I'm happy where I am.", delta: { ambition: -20, adaptability: -10 } },
    ],
  },
  {
    title: "At 2am, someone says: 'we should do it.'",
    subtitle: "Be honest.",
    options: [
      { label: "Already grabbing my keys.", delta: { risk_appetite: 30, impulsiveness: 28 } },
      { label: "Give me the plan and a map.", delta: { strategic_thinking: 24, risk_appetite: 10 } },
      { label: "I need to sleep on it.", delta: { impulsiveness: -24, confidence: -8 } },
      { label: "I'm the one who said it.", delta: { rebelliousness: 26, expressiveness: 18 } },
    ],
  },
  {
    title: "Your group chat, in one word.",
    subtitle: "Pick the vibe.",
    options: [
      { label: "Chaos.", delta: { humor: 26, social_energy: 22, expressiveness: 20 } },
      { label: "Strategy sessions.", delta: { strategic_thinking: 20, entrepreneurial: 16 } },
      { label: "Quiet but loyal.", delta: { loyalty: 22, social_energy: -14 } },
      { label: "Mostly memes.", delta: { humor: 24, creativity: 14 } },
    ],
  },
  {
    title: "Someone disrespects you in public.",
    subtitle: "Your instinct?",
    options: [
      { label: "I say exactly what I'm thinking.", delta: { confidence: 26, expressiveness: 22, rebelliousness: 14 } },
      { label: "I let the work speak for itself.", delta: { confidence: 14, independence: 18 } },
      { label: "I don't forget, and I don't forgive.", delta: { rebelliousness: 22, loyalty: -10 } },
      { label: "I laugh it off and move on.", delta: { humor: 18, adaptability: 18 } },
    ],
  },
  {
    title: "Your ideal side project.",
    subtitle: "What are you building?",
    options: [
      { label: "A business nobody's thought of.", delta: { entrepreneurial: 30, creativity: 20, ambition: 14 } },
      { label: "Something artistic and personal.", delta: { creativity: 28, independence: 16 } },
      { label: "A system that runs itself.", delta: { strategic_thinking: 26, entrepreneurial: 12 } },
      { label: "Nothing — I'm living in the moment.", delta: { impulsiveness: 18, ambition: -18 } },
    ],
  },
  {
    title: "Everything goes sideways.",
    subtitle: "What kicks in?",
    options: [
      { label: "Calm, focused, step by step.", delta: { strategic_thinking: 24, adaptability: 18 } },
      { label: "Pure adrenaline and instinct.", delta: { risk_appetite: 22, impulsiveness: 20 } },
      { label: "I call my crew.", delta: { loyalty: 20, social_energy: 18 } },
      { label: "I make a joke about it.", delta: { humor: 24, adaptability: 12 } },
    ],
  },
  {
    title: "How do you show up for people?",
    subtitle: "Your loyalty style.",
    options: [
      { label: "Ride or die, no questions.", delta: { loyalty: 30, social_energy: 12 } },
      { label: "I keep my circle very small.", delta: { loyalty: 18, independence: 18, social_energy: -12 } },
      { label: "I show up when it counts.", delta: { loyalty: 16, adaptability: 12 } },
      { label: "I'm a free agent.", delta: { independence: 24, loyalty: -16 } },
    ],
  },
  {
    title: "Describe your communication style.",
    subtitle: "Last one.",
    options: [
      { label: "Loud, expressive, unforgettable.", delta: { expressiveness: 30, humor: 14 } },
      { label: "Short, sharp, to the point.", delta: { expressiveness: -16, confidence: 18 } },
      { label: "Thoughtful and measured.", delta: { strategic_thinking: 18, expressiveness: -10 } },
      { label: "I say what others won't.", delta: { rebelliousness: 24, expressiveness: 16 } },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (vector: Record<string, number>, confidence: number) => void;
  busy?: boolean;
}

export function QuizModal({ open, onClose, onSubmit, busy }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUESTIONS.length).fill(null));

  const choose = (optionIndex: number) => {
    // Prevent scheduling the auto-advance timer twice for the same step;
    // clicking a different option on a revisited question just changes it.
    if (answers[index] !== null) {
      if (answers[index] === optionIndex) return;
      const revised = [...answers];
      revised[index] = optionIndex;
      setAnswers(revised);
      return;
    }
    const next = [...answers];
    next[index] = optionIndex;
    setAnswers(next);
    if (index < QUESTIONS.length - 1) setTimeout(() => setIndex(index + 1), 180);
  };

  const submit = () => {
    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};
    answers.forEach((answerIndex, qi) => {
      if (answerIndex === null) return;
      const delta = QUESTIONS[qi].options[answerIndex].delta;
      Object.entries(delta).forEach(([trait, value]) => {
        totals[trait] = (totals[trait] ?? 0) + value;
        counts[trait] = (counts[trait] ?? 0) + 1;
      });
    });
    const answered = answers.filter((a) => a !== null).length;
    const vector: Record<string, number> = {};
    Object.keys(totals).forEach((trait) => {
      vector[trait] = Math.max(0, Math.min(100, 50 + totals[trait] / counts[trait]));
    });
    const confidence = Math.min(0.85, 0.35 + (answered / QUESTIONS.length) * 0.5);
    onSubmit(vector, confidence);
  };

  const answeredCount = answers.filter((a) => a !== null).length;
  const current = QUESTIONS[index];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-strong w-full max-w-2xl rounded-xl p-6 md:p-9"
            initial={{ scale: 0.94, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="condensed text-sm tracking-[0.25em] text-cyanx">OFFLINE MODE</p>
                <h2 className="display mt-1 text-3xl text-white">BUILD YOUR PROFILE</h2>
                <p className="mt-2 text-sm text-slate-400">
                  No X account needed. Eight quick questions, then the same matching engine.
                </p>
              </div>
              <button onClick={onClose} className="btn-ghost !px-2.5 !py-2.5" aria-label="Close quiz">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-6 flex gap-1.5">
              {QUESTIONS.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Question ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i === index ? "bg-neon" : answers[i] !== null ? "bg-cyanx" : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
              >
                <p className="condensed text-xs tracking-[0.2em] text-neon">
                  QUESTION {index + 1} / {QUESTIONS.length}
                </p>
                <h3 className="display mt-2 text-2xl text-white">{current.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{current.subtitle}</p>
                <div className="mt-6 grid gap-2.5">
                  {current.options.map((option, oi) => (
                    <button
                      key={oi}
                      onClick={() => choose(oi)}
                      className={`group flex items-center gap-3 rounded-md border px-4 py-3.5 text-left text-sm transition-all ${
                        answers[index] === oi
                          ? "border-neon bg-neon/10 text-white shadow-[0_0_20px_rgba(255,45,149,0.18)]"
                          : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-cyanx/60 hover:bg-cyanx/5"
                      }`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-current text-xs opacity-70">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
              <button
                className="btn-ghost"
                disabled={index === 0}
                onClick={() => setIndex(Math.max(0, index - 1))}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <span className="text-xs text-slate-500">{answeredCount}/{QUESTIONS.length} answered</span>
              <button
                className="btn-primary !px-5 !py-2.5 !text-sm"
                disabled={answeredCount < 3 || busy}
                onClick={submit}
              >
                {index < QUESTIONS.length - 1 ? (
                  <>Last question <ArrowRight className="h-4 w-4" /></>
                ) : (
                  <>Reveal my character <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
