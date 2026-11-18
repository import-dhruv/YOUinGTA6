"use client";

import { motion } from "framer-motion";
import { Check, Copy, Download, Image as ImageIcon, Loader2, Share2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { AnalyzeResponse } from "@/lib/types";
import { XLogo } from "./Visuals";

function proxied(url: string) {
  if (!url) return "";
  if (url.startsWith("/")) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

export function Poster({ result }: { result: AnalyzeResponse }) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { primary, profile } = result;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const shareText = `I'm ${primary.name} — ${primary.match_score}% personality match in Leonida. ${primary.tagline} Your tweets. Your mindset. Your identity. #YOUinGTA6`;
  const shareUrl = `${siteUrl}/result?r=${result.analysis_id}`;
  const summary = `${shareText}\n${shareUrl}`;

  const avatarUrl = useMemo(() => proxied(profile.profile_image_url), [profile.profile_image_url]);
  const characterUrl = primary.image;

  const generate = async (): Promise<string | null> => {
    if (!posterRef.current) return null;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        imagePlaceholder: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz4=",
      });
      return dataUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not render the poster.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    const dataUrl = await generate();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `youingta6-${primary.character_id}.png`;
    link.href = dataUrl;
    link.click();
  };

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Clipboard is unavailable in this browser.");
    }
  };

  const share = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,noreferrer,width=620,height=560",
    );
  };

  return (
    <section id="poster" className="relative scroll-mt-10 border-t border-white/5 bg-night px-5 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="condensed text-sm tracking-[0.3em] text-sunset">TAKE IT WITH YOU</p>
          <h2 className="display mt-2 text-4xl text-white md:text-6xl">YOUR IDENTITY POSTER</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
            A cinematic, shareable 4:5 poster rendered from real data — no image-generation API involved.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Preview (scaled wrapper, unscaled capture node) */}
          <div className="flex justify-center">
            <div className="w-full max-w-[340px] overflow-hidden rounded-lg shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
              <div style={{ transform: "scale(0.53)", transformOrigin: "top left", width: 640, height: 800 }}>
                <div ref={posterRef} className="poster-root" style={{ fontFamily: "Inter, Arial, sans-serif" }}>
                  {/* Poster background */}
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 50% 78%, #ff7a1a55 0%, #ff2d9533 40%, transparent 70%), linear-gradient(180deg,#070317,#1a0b35 40%,#4a124f 68%,#c03b3f 88%,#ff8a3c)" }} />
                  <div style={{ position: "absolute", left: "50%", top: "38%", width: 460, height: 460, transform: "translate(-50%,-50%)", borderRadius: "50%", background: "linear-gradient(180deg,#ffe98a,#ff7a1a 45%,#ff2d95)", boxShadow: "0 0 100px 30px rgba(255,90,70,0.4)", opacity: 0.85 }} />
                  <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 3px, rgba(0,0,0,0.12) 3px 4px)" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(5,2,15,0.25),rgba(5,2,15,0.92))" }} />

                  <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", padding: "42px 44px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 26, letterSpacing: 2, color: "#fff" }}>
                        YOU<span style={{ color: "#ff2d95" }}>in</span>GTA6
                      </div>
                      <div style={{ fontSize: 11, letterSpacing: 3, color: "#22d3ee", fontFamily: "monospace" }}>LEONIDA FILE</div>
                    </div>

                    <div style={{ marginTop: 44 }}>
                      <div style={{ fontSize: 13, letterSpacing: 5, color: "#ffb4d8", fontFamily: "monospace" }}>MY GTA VI IDENTITY</div>
                      <div style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 74, lineHeight: 0.92, color: "#fff", marginTop: 10, textShadow: `0 0 40px ${primary.accent}aa` }}>
                        {primary.name.toUpperCase()}
                      </div>
                      <div style={{ width: 120, height: 4, background: "linear-gradient(90deg,#ff2d95,#ff7a1a)", marginTop: 20 }} />
                    </div>

                    {/* Portraits */}
                    <div style={{ display: "flex", gap: 18, marginTop: 34, alignItems: "flex-end" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, letterSpacing: 2, color: "#cbd5e1", marginBottom: 8 }}>THE PERSON</div>
                        <div style={{ width: "100%", height: 220, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.25)", background: "#120a24", position: "relative" }}>
                          {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarUrl} alt="profile" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ display: "grid", placeItems: "center", height: "100%", color: "rgba(255,255,255,0.25)", fontSize: 46 }}>@</div>
                          )}
                        </div>
                      </div>
                      <div style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 30, color: "#ff2d95" }}>VS</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, letterSpacing: 2, color: primary.accent, marginBottom: 8 }}>THE LEGEND</div>
                        <div style={{ width: "100%", height: 220, borderRadius: 8, overflow: "hidden", border: `1px solid ${primary.accent}66`, background: "#120a24" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={characterUrl} alt={primary.name} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 26, display: "flex", alignItems: "baseline", gap: 30 }}>
                      <div style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 92, lineHeight: 1, color: "#fff" }}>{primary.match_score}<span style={{ fontSize: 42, color: "#ff7a1a" }}>%</span></div>
                      <div style={{ fontSize: 12, letterSpacing: 3, color: "#cbd5e1" }}>PERSONALITY<br />MATCH</div>
                    </div>

                    <div style={{ marginTop: 10, fontSize: 17, fontStyle: "italic", lineHeight: 1.4, color: "#ffe4f1", maxWidth: 520 }}>
                      “{primary.tagline}”
                    </div>

                    <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.18)", paddingTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#fff" }}>
                        <span style={{ display: "inline-flex" }}><XLogo className="h-4 w-4" /></span>@{profile.username}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>unofficial fan project</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col justify-center">
            <div className="glass rounded-lg p-7">
              <h3 className="display text-3xl text-white">READY TO POST?</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Download the high-resolution PNG, share it on X, or copy your result text.
              </p>
              <div className="mt-7 space-y-3">
                <button onClick={download} disabled={busy} className="btn-primary w-full">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  DOWNLOAD PNG
                </button>
                <button onClick={share} className="btn-ghost w-full !py-3.5">
                  <Share2 className="h-4 w-4" /> Share on X
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => copy(shareUrl, "link")} className="btn-ghost !py-3">
                    {copied === "link" ? <Check className="h-4 w-4 text-cyanx" /> : <Copy className="h-4 w-4" />}
                    {copied === "link" ? "Copied" : "Copy link"}
                  </button>
                  <button onClick={() => copy(summary, "summary")} className="btn-ghost !py-3">
                    {copied === "summary" ? <Check className="h-4 w-4 text-cyanx" /> : <Copy className="h-4 w-4" />}
                    {copied === "summary" ? "Copied" : "Copy text"}
                  </button>
                </div>
              </div>
              {error && <p className="mt-4 text-xs text-rose-400">{error}</p>}
              <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-slate-600">
                <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Portraits are stylised local placeholder art. Replace the files in <code className="text-slate-500">public/characters/</code> with authorised imagery for production.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
