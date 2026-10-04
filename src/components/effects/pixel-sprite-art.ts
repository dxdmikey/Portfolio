/**
 * Pixel-art Ravi, 16 × 20. One string per row; each character is a palette key,
 * "." is transparent. Drawn from his photo: swept-up black quiff, black rectangular
 * glasses, short beard + moustache, navy blazer over a white collar.
 */
export const SPRITE_ROWS = [
  "......HHHHh.....",
  "....HHHHHHHHh...",
  "...HHHHHHHHHHH..",
  "..HHHHhhHHHHHH..",
  "..HHHSSSSSSSHH..",
  "..HSSSSSSSSSSH..",
  "..sGGGGGGGGGGs..",
  "..sGLEGSSGELGs..",
  "...GGGGSSGGGG...",
  "...SSSSssSSSS...",
  "...SSBBBBBBSS...",
  "...BSSMMMMSSB...",
  "...BBBBBBBBBB...",
  "....BBBBBBBB....",
  ".....sSSSSs.....",
  "..NNNWWSSWWNNN..",
  ".NNNNNWWWWNNNNN.",
  "NNNNNnNWWNnNNNNN",
  "NNNNNnNNNNnNNNNN",
  "NNNNNnNNNNnNNNNN",
] as const;

export const SPRITE_WIDTH = 16;
export const SPRITE_HEIGHT = SPRITE_ROWS.length;

/** Eye cells are drawn as lens underneath plus a blinking pupil on top. */
export const EYE_KEY = "E";
export const LENS_KEY = "L";

/** Fixed character colours — the sprite is art, so it doesn't follow the theme. */
const HAIR = "#1e1b2a";
const HAIR_SHINE = "#4a4466";
const SKIN = "#a8693f";
const SKIN_SHADE = "#8a5232";
const LENS = "#cfe0ee";
const FRAME = "#08080d";
const PUPIL = "#1a0f0c";
const BEARD = "#1d1714";
const MOUTH = "#6b3424";
const SHIRT = "#f2f3fa";
const BLAZER = "#24326a";
const BLAZER_SHADE = "#162048";

export const SPRITE_PALETTE: Readonly<Record<string, string>> = {
  H: HAIR,
  h: HAIR_SHINE,
  S: SKIN,
  s: SKIN_SHADE,
  L: LENS,
  G: FRAME,
  E: PUPIL,
  B: BEARD,
  M: MOUTH,
  W: SHIRT,
  N: BLAZER,
  n: BLAZER_SHADE,
};
