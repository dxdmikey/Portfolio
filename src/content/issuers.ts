/**
 * Certificate issuers and their pixel logos.
 *
 * EXCEPTION to the "tokens, never raw hex" rule (like the sky colours in `scenes.ts`): brand colours are
 * fixed by the brands, so they live here as data. Components never hard-code them.
 *
 * `rows` is a pixel grid, one char per pixel ("." = empty); `palette` maps each char to a brand colour.
 */
export interface Issuer {
  id: string;
  name: string;
  rows: readonly string[];
  palette: Readonly<Record<string, string>>;
}

export const issuers = {
  microsoft: {
    id: "microsoft",
    name: "Microsoft",
    // The four-square mark: 6px squares with a 2px gap.
    rows: [
      "rrrrrr..gggggg",
      "rrrrrr..gggggg",
      "rrrrrr..gggggg",
      "rrrrrr..gggggg",
      "rrrrrr..gggggg",
      "rrrrrr..gggggg",
      "..............",
      "..............",
      "bbbbbb..yyyyyy",
      "bbbbbb..yyyyyy",
      "bbbbbb..yyyyyy",
      "bbbbbb..yyyyyy",
      "bbbbbb..yyyyyy",
      "bbbbbb..yyyyyy",
    ],
    palette: { r: "#F25022", g: "#7FBA00", b: "#00A4EF", y: "#FFB900" },
  },
  databricks: {
    id: "databricks",
    name: "Databricks",
    // A diamond over two chevrons: the stacked-layers mark.
    rows: [
      "......dd......",
      "....dddddd....",
      "..dddddddddd..",
      "....dddddd....",
      "......dd......",
      "..............",
      "dddd......dddd",
      "..dddd..dddd..",
      "....dddddd....",
      "......dd......",
      "dddd......dddd",
      "..dddd..dddd..",
      "....dddddd....",
      "......dd......",
    ],
    palette: { d: "#FF3621" },
  },
} as const satisfies Record<string, Issuer>;

export type IssuerId = keyof typeof issuers;

export function issuerById(id: string): Issuer | undefined {
  return (issuers as Record<string, Issuer>)[id];
}
