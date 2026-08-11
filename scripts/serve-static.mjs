import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd(), "dist");
const port = Number(process.env.PORT ?? 8080);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function resolvePublicFile(urlPathname) {
  const decoded = decodeURIComponent(urlPathname);
  const requested = normalize(decoded === "/" ? "/index.html" : decoded).replace(/^([/\\])+/, "");
  const candidate = join(root, requested);
  if (candidate.startsWith(root) && existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  return join(root, "index.html");
}

createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  const file = resolvePublicFile(pathname);
  const mime = mimeTypes[extname(file)] ?? "application/octet-stream";
  response.writeHead(200, { "Content-Type": mime, "Cache-Control": "public, max-age=300" });
  createReadStream(file).on("error", () => response.end()).pipe(response);
}).listen(port, "0.0.0.0", () => {
  console.log(`Serving Focus Command web build on port ${port}`);
});
