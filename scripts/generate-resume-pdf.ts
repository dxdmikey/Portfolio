import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { OUT_DIR, PUBLIC_DIR, withPage } from "./lib/render";

const FILE = "Kadwasra_Ravi_Kumar_Resume.pdf";
const A4_PX = { width: 794, height: 1123 };

async function main() {
  const target = resolve(PUBLIC_DIR, FILE);
  await mkdir(PUBLIC_DIR, { recursive: true });
  await withPage("/resume/", A4_PX, async (page) => {
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: target,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
  });
  await copyFile(target, resolve(OUT_DIR, FILE));
  console.log(`resume pdf → public/${FILE} (+ out/)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
