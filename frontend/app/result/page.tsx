"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ResultView } from "@/components/ResultView";
import { loadResult } from "@/lib/api";
import type { AnalyzeResponse } from "@/lib/types";
import { BrandMark } from "@/components/Visuals";

export default function ResultPage() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setResult(loadResult());
    setChecked(true);
  }, []);

  if (!checked) {
    return (
      <div className="grid min-h-screen place-items-center bg-night">
        <Loader2 className="h-8 w-8 animate-spin text-neon" />
      </div>
    );
  }

  if (!result || !result.primary || result.primary.character_id === "unknown") {
    return (
      <div className="grid min-h-screen place-items-center bg-night px-5 text-center">
        <div>
          <BrandMark />
          <h1 className="display mt-8 text-4xl text-white">NO IDENTITY FILE FOUND</h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-slate-400">
            Your result is stored only in this browser session. Run the analysis again to generate a new one.
          </p>
          <Link href="/" className="btn-primary mt-8 inline-flex">START THE ANALYSIS</Link>
        </div>
      </div>
    );
  }

  return <ResultView result={result} />;
}
