import type { Metadata } from "next";
import { profile } from "@/content/profile";

export const metadata: Metadata = {
  title: "Social card",
  robots: { index: false, follow: false },
};

const STAR_COUNT = 48;
const SIZE = { w: 1200, h: 630 } as const;

/** Deterministic pseudo-random starfield so the render is identical on every build. */
function stars() {
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    x: Math.round(next() * SIZE.w),
    y: Math.round(next() * SIZE.h),
    s: next() > 0.8 ? 6 : 4,
    c: next() > 0.7 ? "var(--plasma)" : next() > 0.5 ? "var(--coin)" : "var(--star)",
  }));
}

export default function OgPage() {
  const site = profile.siteUrl.replace(/^https?:\/\//, "");
  return (
    <main
      id="main"
      className="bg-void text-starlight relative overflow-hidden"
      style={{ width: SIZE.w, height: SIZE.h }}
    >
      <svg width={SIZE.w} height={SIZE.h} className="absolute inset-0" aria-hidden="true">
        {stars().map((s) => (
          <rect key={s.id} x={s.x} y={s.y} width={s.s} height={s.s} fill={s.c} opacity={0.7} />
        ))}
      </svg>
      <div className="border-grid absolute inset-6 border-4" />
      <div className="relative flex h-full flex-col justify-center gap-9 px-24">
        <span className="font-pixel text-px-lg bg-coin text-on-accent shadow-pixel w-fit px-5 py-3">
          PORTFOLIO.EXE
        </span>
        <h1 className="font-pixel text-plasma text-glow text-[56px] leading-[1.35]">
          KADWASRA
          <br />
          RAVI KUMAR
        </h1>
        <p className="font-pixel text-px-xl text-xp">✦ DATA &amp; AI ENGINEER ✦</p>
        <p className="font-body text-starlight text-[30px] font-medium">
          Azure · Databricks · Fabric · PySpark · AI agents
        </p>
      </div>
      <p className="font-pixel text-px-md text-coin absolute right-24 bottom-12">{site}</p>
    </main>
  );
}
