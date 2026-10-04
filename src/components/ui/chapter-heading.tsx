import type { ReactNode } from "react";
import { chapterById, chapters, type ChapterId } from "@/content/story";
import { cn } from "@/lib/cn";

/** Chapters are numbered from 0 (the launchpad), so the last number is length - 1. */
const LAST_CHAPTER = chapters.length - 1;

interface ChapterHeadingProps {
  chapter: ChapterId;
  icon: ReactNode;
  /** Centre-align (e.g. Transmission). Default left. */
  align?: "left" | "center";
  className?: string;
}

/**
 * Chapter title card: small "CH3" marker, big amber pixel title, and the chapter's tagline.
 * The <h2> id is `${chapter}-title`, which `<Screen id={chapter}>` uses for aria-labelledby.
 */
export function ChapterHeading({ chapter, icon, align = "left", className }: ChapterHeadingProps) {
  const c = chapterById(chapter);
  const centred = align === "center";
  return (
    <header className={cn("mb-10", centred && "text-center", className)}>
      <p className={cn("font-pixel text-px-xs text-plasma mb-3 flex items-center gap-3 uppercase", centred && "justify-center")}>
        <span aria-hidden className="border-plasma border-2 px-2 py-1">
          CH{c.number}
        </span>
        <span className="text-dust">
          Chapter {c.number} of {LAST_CHAPTER}
        </span>
      </p>
      <h2
        id={`${chapter}-title`}
        className={cn("font-pixel text-px-lg text-coin sm:text-px-xl flex items-center gap-4 uppercase", centred && "justify-center")}
      >
        <span aria-hidden className="text-warp shrink-0">
          {icon}
        </span>
        <span className="text-glow">{c.label}</span>
        {centred ? null : <span aria-hidden className="border-dust/50 hidden flex-1 border-t-2 border-dashed sm:block" />}
      </h2>
      <p className={cn("text-dust mt-4 max-w-[62ch]", centred && "mx-auto")}>{c.tagline}</p>
    </header>
  );
}
