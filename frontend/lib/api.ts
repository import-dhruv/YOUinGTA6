import type { AnalyzeResponse, DemoAccount, StageEvent } from "./types";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

export function apiUrl(path: string) {
  return `${API_BASE}${path}`;
}

export function validateHandle(raw: string): { ok: boolean; handle: string; error?: string } {
  const handle = raw.trim().replace(/^@/, "").toLowerCase();
  if (!handle) return { ok: false, handle, error: "Enter an X username." };
  if (handle.length > 15) return { ok: false, handle, error: "X usernames are at most 15 characters." };
  if (!/^[a-z0-9_]+$/.test(handle)) {
    return { ok: false, handle, error: "Use only letters, numbers and underscores." };
  }
  return { ok: true, handle };
}

export async function fetchDemoAccounts(): Promise<DemoAccount[]> {
  const res = await fetch(apiUrl("/api/demo/accounts"), { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function analyze(username: string, forceDemo: boolean): Promise<AnalyzeResponse> {
  const res = await fetch(apiUrl("/api/analyze"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, force_demo: forceDemo }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Analysis failed. Please try again.");
  return data as AnalyzeResponse;
}

export async function matchVector(
  vector: Record<string, number>,
  confidence: number,
  username = "you",
): Promise<AnalyzeResponse> {
  const res = await fetch(apiUrl("/api/match"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vector, confidence, source: "quiz", username }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Matching failed. Please try again.");
  return data as AnalyzeResponse;
}

/** Consume the SSE stream. onEvent receives genuine backend processing stages. */
export async function streamAnalyze(
  username: string,
  forceDemo: boolean,
  onEvent: (event: StageEvent) => void,
): Promise<AnalyzeResponse> {
  const res = await fetch(apiUrl("/api/analyze/stream"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, force_demo: forceDemo }),
  });
  if (!res.ok || !res.body) {
    // Graceful fallback to the non-streaming endpoint.
    return analyze(username, forceDemo);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: AnalyzeResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() || "";
    for (const chunk of chunks) {
      const line = chunk.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      const payload = line.slice(6);
      let parsed: StageEvent;
      try {
        parsed = JSON.parse(payload) as StageEvent;
      } catch {
        continue;
      }
      if (parsed.stage === "result") {
        try {
          result = JSON.parse(parsed.message) as AnalyzeResponse;
        } catch {
          /* ignore malformed final payload */
        }
        onEvent(parsed);
      } else if (parsed.stage === "error") {
        onEvent(parsed);
        throw new Error(parsed.message);
      } else {
        onEvent(parsed);
      }
    }
  }
  if (result) return result;
  return analyze(username, forceDemo);
}

const STORAGE_KEY = "youingta6:result";

export function saveResult(result: AnalyzeResponse) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    /* storage may be unavailable */
  }
}

export function loadResult(): AnalyzeResponse | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AnalyzeResponse) : null;
  } catch {
    return null;
  }
}
