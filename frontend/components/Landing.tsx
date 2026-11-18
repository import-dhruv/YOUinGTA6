"use client";

import { motion } from "framer-motion";
import { ArrowRight, Fingerprint, Loader2, ScanSearch, ShieldCheck, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchDemoAccounts, validateHandle } from "@/lib/api";
import type { DemoAccount } from "@/lib/types";
import { BrandMark, CharacterImage, CinematicBackdrop, SoundButton, XLogo } from "./Visuals";
import { QuizModal } from "./QuizModal";
import { matchVector, saveResult } from "@/lib/api";

export function Landing() {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [demos, setDemos] = useState<DemoAccount[]>([]);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizBusy, setQuizBusy] = useState(false);

  useEffect(() => {
    fetchDemoAccounts().then(setDemos).catch(() => setDemos([]));
    if (new URLSearchParams(window.location.search).get("quiz") === "1") {
      setQuizOpen(true);
    }
  }, []);

  const start = (raw: string, forceDemo = false) => {
    const result = validateHandle(raw);
    if (!result.ok) {
      setError(result.error ?? "Invalid username");
      return;
    }
    setError(null);
    const params = new URLSearchParams({ username: result.handle });
    if (forceDemo) params.set("demo", "1");
    router.push(`/analysis?${params.toString()}`);
  };

  const submitQuiz = async (vector: Record<string, number>, confidence: number) => {
    setQuizBusy(true);
    setError(null);
    try {
      const result = await matchVector(vector, confidence, "quiz-player");
      saveResult(result);
      router.push("/result?source=quiz");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setQuizBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-night text-white">
      {/* ---------- HERO ---------- */}
      <section className="relative flex min-h-screen flex-col overflow-hidden">
        <CinematicBackdrop dense />
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{ background: "radial-gradient(ellipse 55% 42% at 50% 40%, rgba(5,2,15,0.82) 0%, rgba(5,2,15,0.45) 55%, transparent 80%)" }}
          aria-hidden="true"
        />

        <header className="relative z-10 flex items-center justify-between px-5 py-6 md:px-12">
          <BrandMark />
          <a href="#how" className="condensed hidden text-sm tracking-[0.2em] text-slate-300 transition-colors hover:text-neon sm:block">
            HOW IT WORKS
          </a>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-5 pb-24 pt-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon" />
              <span className="condensed text-xs tracking-[0.22em] text-neon">LEONIDA PERSONALITY FILE</span>
            </div>

            <h1 className="display text-[clamp(3.2rem,10vw,8.5rem)] leading-[0.88]">
              <span className="block text-white">WHICH GTA VI</span>
              <span className="gradient-text block">CHARACTER</span>
              <span className="block text-white">ARE YOU?</span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
              <span className="font-semibold text-white">Your tweets reveal your personality.</span>{" "}
              Discover your identity in Leonida.
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
              Enter your X username. We&apos;ll analyse your digital personality and reveal which GTA VI character matches your mindset.
            </p>
          </motion.div>

          <motion.div
            className="mt-10 w-full max-w-xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                start(handle);
              }}
              className="glass-strong rounded-lg p-2.5 shadow-2xl"
            >
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <div className="relative flex-1">
                  <XLogo className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={handle}
                    onChange={(e) => {
                      setHandle(e.target.value);
                      setError(null);
                    }}
                    className="input-handle"
                    placeholder="@yourusername"
                    aria-label="X username"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <button type="submit" className="btn-primary shrink-0">
                  REVEAL MY CHARACTER <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
            {error && <p className="mt-2.5 text-sm text-rose-400">{error}</p>}

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-slate-500">No API access? Try a demo:</span>
              {demos.slice(0, 3).map((demo) => (
                <button
                  key={demo.handle}
                  onClick={() => start(demo.handle, true)}
                  className="chip transition-colors hover:border-cyanx/70 hover:text-cyanx"
                  title={demo.description}
                >
                  <Sparkles className="h-3 w-3 text-cyanx" /> @{demo.handle}
                </button>
              ))}
              <button onClick={() => setQuizOpen(true)} className="chip transition-colors hover:border-neon/70 hover:text-neon">
                <Fingerprint className="h-3 w-3" /> Take the quiz
              </button>
            </div>
          </motion.div>

          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
          >
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-cyanx" /> Public data only</span>
            <span className="flex items-center gap-1.5"><ScanSearch className="h-3.5 w-3.5 text-cyanx" /> No AI model used</span>
            <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-cyanx" /> Just for fun</span>
          </motion.div>
        </div>

        <div className="relative z-10 pb-8 text-center">
          <a href="#how" className="condensed text-xs tracking-[0.3em] text-slate-500 hover:text-white">
            SCROLL TO EXPLORE ↓
          </a>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how" className="relative border-t border-white/5 bg-ink/80 px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="condensed text-center text-sm tracking-[0.3em] text-neon">THE PROCESS</p>
          <h2 className="display mt-2 text-center text-4xl text-white md:text-6xl">FOUR STEPS TO YOUR IDENTITY</h2>
          <div className="mt-14 grid gap-5 md:grid-cols-4">
            {[
              { n: "01", icon: <XLogo className="h-5 w-5" />, title: "ENTER YOUR HANDLE", body: "We look up your public X profile and available posts through an authorised API — or you choose a demo." },
              { n: "02", icon: <ScanSearch className="h-5 w-5" />, title: "READ THE SIGNALS", body: "Python NLP cleans your text and measures vocabulary, tone, hashtags, emoji and interaction patterns." },
              { n: "03", icon: <Fingerprint className="h-5 w-5" />, title: "BUILD YOUR PROFILE", body: "Fourteen transparent behavioural scores are calculated. No LLM, no guesswork, no invented quotes." },
              { n: "04", icon: <Sparkles className="h-5 w-5" />, title: "MEET YOUR MATCH", body: "A weighted similarity algorithm compares you to all nine characters and reveals your Leonida identity." },
            ].map((step) => (
              <div key={step.n} className="glass noise-card rounded-lg p-6 transition-transform hover:-translate-y-1">
                <div className="mb-5 flex items-center justify-between">
                  <span className="display text-3xl text-white/15">{step.n}</span>
                  <span className="text-cyanx">{step.icon}</span>
                </div>
                <h3 className="condensed text-lg tracking-wider text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CHARACTER STRIP ---------- */}
      <section className="relative bg-night px-5 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="condensed text-sm tracking-[0.3em] text-cyanx">NINE POSSIBLE IDENTITIES</p>
          <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-9">
            {[
              ["jason-duval", "Jason Duval", "#38bdf8"], ["lucia-caminos", "Lucia Caminos", "#fb7185"],
              ["cal-hampton", "Cal Hampton", "#a78bfa"], ["raul-bautista", "Raul Bautista", "#f59e0b"],
              ["brian-heder", "Brian Heder", "#34d399"], ["boobie-ike", "Boobie Ike", "#f472b6"],
              ["drequan-priest", "Dre'Quan Priest", "#c084fc"], ["bae-luxe", "Bae-Luxe", "#22d3ee"],
              ["roxy", "Roxy", "#facc15"],
            ].map(([slug, name, accent]) => (
              <div key={name} className="group text-center">
                <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-md border border-white/10 bg-ink transition-all group-hover:border-neon/60">
                  <CharacterImage
                    src={`/characters/${slug}.svg`}
                    name={name}
                    accent={accent}
                    className="h-full w-full transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <p className="mt-2 text-[10px] font-medium leading-tight text-slate-400">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="relative border-t border-white/5 bg-ink px-5 py-12 text-center">
        <BrandMark />
        <p className="display mt-5 text-2xl text-white/80">YOUR TWEETS. YOUR MINDSET. YOUR IDENTITY IN LEONIDA.</p>
        <p className="mx-auto mt-4 max-w-3xl text-xs leading-relaxed text-slate-500">
          YOUinGTA6 is an unofficial, non-commercial fan project. It is not affiliated with or endorsed by Rockstar Games.
          GTA VI character names and imagery belong to their respective owners. Results are entertainment-only, derived from
          public text patterns and configurable assumptions — not psychological assessments. No AI model or image-generation service is used.
        </p>
      </footer>

      <SoundButton />
      <QuizModal open={quizOpen} onClose={() => setQuizOpen(false)} onSubmit={submitQuiz} busy={quizBusy} />
      {quizBusy && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70">
          <Loader2 className="h-8 w-8 animate-spin text-neon" />
        </div>
      )}
    </main>
  );
}
