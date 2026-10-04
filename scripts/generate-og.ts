import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { OUT_DIR, PUBLIC_DIR, withPage } from "./lib/render";

const SIZE = { width: 1200, height: 630 };

async function main() {
  const target = resolve(PUBLIC_DIR, "og.png");
  await mkdir(PUBLIC_DIR, { recursive: true });
  await withPage("/og/", SIZE, async (page) => {
    await page.screenshot({
      path: target,
      clip: { x: 0, y: 0, ...SIZE },
      animations: "disabled",
    });
  });
  await copyFile(target, resolve(OUT_DIR, "og.png"));
  console.log("og image → public/og.png (+ out/)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
