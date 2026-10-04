/**
 * Converts private source images in `_source/` (gitignored) into web-ready assets in `public/`.
 * Run with `npm run images`. Re-run only when a source image changes; outputs are committed.
 */
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "_source", "My photo.png");
const OUT_DIR = path.join(ROOT, "public", "images");

const VARIANTS = [
  { file: "ravi.webp", width: 480, height: 600 },
  { file: "ravi@2x.webp", width: 960, height: 1200 },
] as const;

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`Source photo not found at ${SOURCE}. Place it there and re-run.`);
    process.exit(1);
  }
  await mkdir(OUT_DIR, { recursive: true });
  for (const v of VARIANTS) {
    const out = path.join(OUT_DIR, v.file);
    await sharp(SOURCE)
      .resize(v.width, v.height, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toFile(out);
    console.log(`✓ ${path.relative(ROOT, out)}`);
  }
}

void main();
