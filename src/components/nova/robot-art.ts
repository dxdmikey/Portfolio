import { pixelPath, pixelPathsByChar } from "@/lib/pixel-path";

/**
 * NOVA's sprite, 13×14. Body layer chars:
 * a = antenna stem, l = antenna light, h = head shell, f = face screen, b = body, e = ear bolts.
 * Eyes and mouth are separate overlays so they can change with NOVA's mood.
 */
const BODY = [
  "......l......",
  "......a......",
  "..hhhhhhhhh..",
  ".hhhhhhhhhhh.",
  "ehfffffffffhe",
  "ehfffffffffhe",
  ".hfffffffffh.",
  ".hfffffffffh.",
  ".hfffffffffh.",
  ".hhhhhhhhhhh.",
  "..hhhhhhhhh..",
  "....bbbbb....",
  "..bbbbbbbbb..",
  ".bb.bbbbb.bb.",
] as const;

const EYES_OPEN = ["", "", "", "", "...##...##...", "...##...##..."] as const;

const EYES_CLOSED = ["", "", "", "", "", "...##...##..."] as const;

const MOUTH_SMILE = ["", "", "", "", "", "", "", "....#...#....", ".....###....."] as const;

const MOUTH_OPEN = ["", "", "", "", "", "", "", ".....###.....", ".....###....."] as const;

const filled = (ch: string) => ch === "#";

export const ROBOT_VIEWBOX = { width: 13, height: 14 } as const;

/** Body layer: one path per colour, computed once. */
export const ROBOT_BODY = [...pixelPathsByChar(BODY).entries()];

export const ROBOT_FILL: Record<string, string> = {
  a: "fill-dust",
  l: "fill-coin",
  h: "fill-plasma",
  f: "fill-void",
  b: "fill-dust",
  e: "fill-warp",
};

export const ROBOT_FACE = {
  eyesOpen: pixelPath(EYES_OPEN, filled),
  eyesClosed: pixelPath(EYES_CLOSED, filled),
  mouthSmile: pixelPath(MOUTH_SMILE, filled),
  mouthOpen: pixelPath(MOUTH_OPEN, filled),
} as const;
