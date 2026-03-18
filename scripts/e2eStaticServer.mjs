import { createServer } from "node:http";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const HOST = "127.0.0.1";
const PORT = 4173;
const DIST_DIR = path.resolve(process.cwd(), "dist-e2e");
const INDEX_PATH = path.join(DIST_DIR, "index.html");
const MAIN_BUNDLE_PATH = path.join(DIST_DIR, "main.js");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const getMimeType = (filePath) => {
  const extension = path.extname(filePath).toLowerCase();

  return MIME_TYPES[extension] ?? "application/octet-stream";
};

const writeIndexHtml = async () => {
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SpeedPlane</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>
`;

  await writeFile(INDEX_PATH, indexHtml, "utf-8");
};

const ensureBundleExists = async () => {
  try {
    await stat(MAIN_BUNDLE_PATH);
  } catch {
    throw new Error(
      "Missing dist-e2e/main.js. Run `bun build src/main.tsx --outdir dist-e2e --target browser` first.",
    );
  }
};

const toFilePath = (requestPath) => {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const trimmedPath = normalizedPath.replace(/^\/+/, "");
  const resolvedPath = path.resolve(DIST_DIR, trimmedPath);

  if (!resolvedPath.startsWith(DIST_DIR)) {
    return undefined;
  }

  return resolvedPath;
};

const startServer = async () => {
  await ensureBundleExists();
  await writeIndexHtml();

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);
    const filePath = toFilePath(requestUrl.pathname);

    if (!filePath) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Forbidden");

      return;
    }

    try {
      const fileContent = await readFile(filePath);

      response.writeHead(200, { "Content-Type": getMimeType(filePath) });
      response.end(fileContent);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not Found");
    }
  });

  await new Promise((resolve) => {
    server.listen(PORT, HOST, resolve);
  });

  console.log(`E2E static server ready: http://${HOST}:${PORT}`);
};

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
