import { cn } from "@/lib/cn";
import { pixelPath } from "@/lib/pixel-path";

/**
 * Hand-drawn 8×8 pixel glyphs. Each row is a string; "#" = filled pixel.
 * Rendered as crisp SVG rects in `currentColor`, so they theme for free.
 */
const GLYPHS = {
  user: ["..####..", "..####..", "..####..", "...##...", ".######.", "########", "#.####.#", "..#..#.."],
  bolt: ["....###.", "...###..", "..###...", ".######.", "...###..", "..###...", ".##.....", "#......."],
  scroll: [".######.", "#......#", ".#.##.#.", ".#....#.", ".#.##.#.", ".#....#.", "#......#", ".######."],
  planet: ["..####..", ".######.", "########", "#..##..#", "########", ".######.", "..####..", "........"],
  flask: ["..####..", "...##...", "...##...", "..#..#..", ".#....#.", "#.####.#", "#.####.#", ".######."],
  chest: ["........", ".######.", "#......#", "########", "#..##..#", "#......#", "########", "........"],
  trophy: ["########", "#.####.#", "#.####.#", ".######.", "..####..", "...##...", "..####..", ".######."],
  floppy: ["#######.", "#.###..#", "#.###..#", "#......#", "#.####.#", "#.#..#.#", "#.####.#", "########"],
  star: ["...##...", "...##...", "########", ".######.", "..####..", ".##..##.", "##....##", "........"],
  sound: ["...#....", "..##..#.", "####.#..", "####.#.#", "####.#.#", "####.#..", "..##..#.", "...#...."],
  mute: ["...#....", "..##....", "####.#.#", "####..#.", "####..#.", "####.#.#", "..##....", "...#...."],
  music: ["..######", "..######", "..#....#", "..#....#", "..#....#", ".##...##", "###..###", ".#....#."],
  "music-off": ["..#.....", "..##....", "..#.#...", "..#..#.#", "..#...#.", ".##..#.#", "###.....", ".#......"],
  sun: ["#..##..#", ".#....#.", "..####..", "#.####.#", "#.####.#", "..####..", ".#....#.", "#..##..#"],
  moon: ["..###...", ".##.....", "##......", "##......", "##......", "##....#.", ".######.", "..####.."],
  rocket: ["...##...", "..####..", "..#..#..", "..####..", "..####..", ".######.", "##.##.##", "#..##..#"],
  lock: ["..####..", ".#....#.", ".#....#.", "########", "###..###", "###..###", "########", "........"],
  close: ["##....##", ".##..##.", "..####..", "...##...", "..####..", ".##..##.", "##....##", "........"],
} as const;

export type GlyphName = keyof typeof GLYPHS;

/** Precomputed once: each glyph becomes a single SVG path. */
const GLYPH_PATHS = Object.fromEntries(
  Object.entries(GLYPHS).map(([name, rows]) => [name, pixelPath(rows, (ch) => ch === "#")]),
) as Record<GlyphName, string>;

interface PixelIconProps {
  name: GlyphName;
  size?: number;
  className?: string;
  /** Leave undefined for decorative icons (aria-hidden). */
  title?: string;
}

export function PixelIcon({ name, size = 16, className, title }: PixelIconProps) {
  return (
    <svg
      viewBox="0 0 8 8"
      width={size}
      height={size}
      className={cn("pixelated inline-block shrink-0", className)}
      shapeRendering="crispEdges"
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d={GLYPH_PATHS[name]} />
    </svg>
  );
}
