type PerfCounts = Record<string, number>;

type PerfSnapshot = {
  enabled: boolean;
  counts: PerfCounts;
  measures: Record<string, { count: number; totalMs: number; maxMs: number }>;
};

type PerfApi = {
  enabled: boolean;
  count: (name: string, amount?: number) => void;
  start: (name: string) => number;
  end: (name: string, startedAt: number) => number;
  measure: <T>(name: string, task: () => T) => T;
  snapshot: () => PerfSnapshot;
};

const enabled = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("perf") === "1";
const counts: PerfCounts = Object.create(null) as PerfCounts;
const measures: PerfSnapshot["measures"] = Object.create(null) as PerfSnapshot["measures"];

const api: PerfApi = {
  enabled,
  count(name, amount = 1) {
    if (!enabled) return;
    counts[name] = (counts[name] ?? 0) + amount;
  },
  start(name) {
    if (!enabled) return 0;
    return performance.now();
  },
  end(name, startedAt) {
    if (!enabled || startedAt === 0) return 0;
    const durationMs = performance.now() - startedAt;
    const summary = measures[name] ?? { count: 0, totalMs: 0, maxMs: 0 };
    summary.count += 1;
    summary.totalMs += durationMs;
    summary.maxMs = Math.max(summary.maxMs, durationMs);
    measures[name] = summary;
    return durationMs;
  },
  measure(name, task) {
    if (!enabled) return task();
    const startedAt = api.start(name);
    try {
      return task();
    } finally {
      api.end(name, startedAt);
    }
  },
  snapshot() {
    return {
      enabled,
      counts: { ...counts },
      measures: Object.fromEntries(
        Object.entries(measures).map(([name, value]) => [name, { ...value }]),
      ),
    };
  },
};

if (enabled) {
  (window as Window & { __pikachuPerf?: PerfApi }).__pikachuPerf = api;
}

export const perfDiagnostics = api;
