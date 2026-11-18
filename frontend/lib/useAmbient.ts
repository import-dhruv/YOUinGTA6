"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Lightweight cinematic drone generated in-browser. No audio files, no network. */
export function useAmbient() {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);

  const stop = useCallback(() => {
    nodesRef.current.forEach((node) => {
      try { node.stop(); } catch { /* already stopped */ }
    });
    nodesRef.current = [];
    gainRef.current?.gain.setTargetAtTime(0, ctxRef.current?.currentTime ?? 0, 0.25);
  }, []);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = ctxRef.current ?? new Ctx();
    ctxRef.current = ctx;
    void ctx.resume();

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.setTargetAtTime(0.035, ctx.currentTime, 1.2);
    gain.connect(ctx.destination);
    gainRef.current = gain;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 620;
    filter.connect(gain);

    [55, 82.4, 110].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 2 ? "triangle" : "sawtooth";
      osc.frequency.value = freq;
      const partialGain = ctx.createGain();
      partialGain.gain.value = i === 0 ? 0.5 : 0.22;
      osc.connect(partialGain).connect(filter);
      osc.start();
      nodesRef.current.push(osc);
    });
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      if (prev) stop();
      else start();
      return !prev;
    });
  }, [start, stop]);

  useEffect(() => () => stop(), [stop]);

  return { enabled, toggle };
}
