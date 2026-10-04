import { createServer, type Server } from "node:http";
import { readFile, stat } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { extname, join, normalize, resolve, sep } from "node:path";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".pdf": "application/pdf",
  ".xml": "application/xml",
};

async function resolveFile(root: string, urlPath: string): Promise<string | null> {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, "");
  const full = resolve(root, clean);
  if (full !== root && !full.startsWith(root + sep)) return null;
  const candidates = [full, join(full, "index.html"), `${full}.html`];
  for (const c of candidates) {
    try {
      if ((await stat(c)).isFile()) return c;
    } catch {
      /* try next */
    }
  }
  return null;
}

export interface StaticServer {
  url: string;
  close: () => Promise<void>;
}

/** Dependency-free static server for the `out/` export (handles trailingSlash index.html). */
export async function startStaticServer(rootDir: string): Promise<StaticServer> {
  const root = resolve(rootDir);
  const server: Server = createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
      const file = await resolveFile(root, pathname);
      if (!file) {
        res.writeHead(404).end("Not found");
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(500).end("Server error");
    }
  });
  await new Promise<void>((ok, fail) => {
    server.once("error", fail);
    server.listen(0, "127.0.0.1", ok);
  });
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((ok) => server.close(() => ok())),
  };
}
