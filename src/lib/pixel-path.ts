/**
 * Converts pixel-art rows (one string per row, one char per pixel) into a single SVG
 * path for the pixels matching `match`. Horizontal runs merge into one rectangle each,
 * so a glyph costs one DOM node instead of one <rect> per pixel.
 */
export function pixelPath(rows: readonly string[], match: (ch: string) => boolean): string {
  const parts: string[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!match(row[x] ?? "")) {
        x += 1;
        continue;
      }
      const start = x;
      while (x < row.length && match(row[x] ?? "")) x += 1;
      parts.push(`M${start} ${y}h${x - start}v1h${start - x}z`);
    }
  });
  return parts.join("");
}

/** Groups pixels by character: one path per distinct non-empty char. */
export function pixelPathsByChar(rows: readonly string[], empty = "."): ReadonlyMap<string, string> {
  const chars = new Set(rows.join("").split("").filter((c) => c !== empty));
  return new Map([...chars].map((c) => [c, pixelPath(rows, (ch) => ch === c)]));
}
