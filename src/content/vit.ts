import { education } from "./certifications";
import type { DiscoveryId } from "./discoveries";
import type { Accent } from "@/types/content";

export const vitCopy = {
  logHeading: "Tutorial log",
  logIntro: "The short version, no crater-cracking required.",
  hint: "Tap a crater to crack it open.",
  locked: "Unopened crater",
  landed: "LANDED",
  complete: "TUTORIAL COMPLETE ✦",
  completeNote: "All four craters cracked. Level up: next stop, the real missions.",
} as const;

const SPEC_PATTERN = /^(.*?) \(Specialization in (.*)\)$/;
const match = SPEC_PATTERN.exec(education.degree);
const degree = match?.[1] ?? education.degree;
const specialization = match?.[2] ?? "";

export interface Crater {
  key: string;
  discovery: DiscoveryId;
  /** Short label on the log and the opened card. */
  label: string;
  value: string;
  accent: Accent;
  /** Position on the planet face, as a percentage of its box. */
  pos: { x: number; y: number };
}

/** Facts come from `education`, so the planet never disagrees with the resume. */
export const craters: readonly Crater[] = [
  { key: "degree", discovery: "crater-degree", label: "Degree", value: degree, accent: "plasma", pos: { x: 34, y: 42 } },
  { key: "spec", discovery: "crater-spec", label: "Specialization", value: specialization, accent: "warp", pos: { x: 62, y: 34 } },
  { key: "grade", discovery: "crater-grade", label: "Grade", value: education.grade, accent: "coin", pos: { x: 44, y: 68 } },
  {
    key: "years",
    discovery: "crater-years",
    label: "Years",
    value: `${education.period} at VIT ${education.location.split(",")[0] ?? ""}`.trim(),
    accent: "xp",
    pos: { x: 70, y: 62 },
  },
];
