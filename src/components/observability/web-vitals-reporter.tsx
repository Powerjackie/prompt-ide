"use client";

import { useReportWebVitals } from "next/web-vitals";

type TrackedMetricName = "CLS" | "FCP" | "INP" | "LCP" | "TTFB";

type TrackedMetric = {
  id: string;
  name: TrackedMetricName;
  value: number;
  rating?: string;
  navigationType?: string;
};

const TRACKED_METRICS = new Set<TrackedMetricName>(["CLS", "FCP", "INP", "LCP", "TTFB"]);

declare global {
  interface Window {
    __PROMPT_IDE_WEB_VITALS__?: TrackedMetric[];
  }
}

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (!TRACKED_METRICS.has(metric.name as TrackedMetricName)) {
      return;
    }

    const metricName = metric.name as TrackedMetricName;
    const payload: TrackedMetric = {
      id: metric.id,
      name: metricName,
      value: metric.value,
      rating: metric.rating,
      navigationType: metric.navigationType,
    };

    if (typeof window !== "undefined") {
      window.__PROMPT_IDE_WEB_VITALS__ = window.__PROMPT_IDE_WEB_VITALS__ ?? [];
      window.__PROMPT_IDE_WEB_VITALS__.push(payload);
    }

    // Keep this opt-in so local probing is explicit and production logs stay quiet.
    if (process.env.NEXT_PUBLIC_WEB_VITALS_DEBUG === "1") {
      console.info("[web-vitals]", payload);
    }
  });

  return null;
}
