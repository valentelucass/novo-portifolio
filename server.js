/**
 * AUTOINTRO: server.js
 * Objetivo: Sobe o servidor HTTP local, entrega arquivos estaticos e exp?e o proxy /api/github para desenvolvimento.
 * Escopo: Define a responsabilidade completa deste modulo dentro da arquitetura do projeto.
 */
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const {
  applyProxyHeaders,
  proxyGitHubRequest,
} = require("./src/backend/githubProxy");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const ROOT = path.resolve(__dirname);

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function loadDotEnv(filepath) {
  if (!fs.existsSync(filepath)) return;

  const data = fs.readFileSync(filepath, "utf8");
  const lines = data.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const idx = line.indexOf("=");
    if (idx <= 0) continue;

    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  const requestedHeaders = req.headers["access-control-request-headers"];
  const allowHeaders = requestedHeaders || "Content-Type,Accept";
  if (!origin) return;

  if (origin === "null") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", allowHeaders);
    res.setHeader("Access-Control-Max-Age", "600");
    return;
  }

  const localhostOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  if (!localhostOriginPattern.test(origin)) return;

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", allowHeaders);
  res.setHeader("Access-Control-Max-Age", "600");
}

async function handleGitHubProxy(req, res, requestUrl) {
  // Mesma regra de proxy usada no entrypoint serverless (api/github.js).
  applyProxyHeaders(res);
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const response = await proxyGitHubRequest({
    method: req.method,
    rawUrl: requestUrl.searchParams.get("url"),
    githubToken: process.env.GITHUB_TOKEN,
  });

  res.statusCode = response.statusCode;
  res.setHeader("Content-Type", response.contentType);
  res.end(response.body);
}

function safeResolvePath(pathname) {
  let relativePath = pathname;
  if (relativePath === "/") {
    relativePath = "/index.html";
  }

  let decoded;
  try {
    decoded = decodeURIComponent(relativePath);
  } catch {
    return null;
  }

  const targetPath = path.normalize(path.join(ROOT, decoded));
  const relativeToRoot = path.relative(ROOT, targetPath);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    return null;
  }

  return targetPath;
}

function handleStatic(req, res, requestUrl) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 405, { message: "Method not allowed." });
    return;
  }

  const iconAliases = {
    "/favicon.ico": "/public/favicon.svg",
    "/apple-touch-icon.png": "/public/favicon.svg",
  };
  const pathname = iconAliases[requestUrl.pathname] || requestUrl.pathname;

  const targetPath = safeResolvePath(pathname);
  if (!targetPath || !fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  const ext = path.extname(targetPath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
  res.setHeader("Content-Type", contentType);

  if (req.method === "HEAD") {
    res.statusCode = 200;
    res.end();
    return;
  }

  const stream = fs.createReadStream(targetPath);
  stream.on("error", () => {
    res.statusCode = 500;
    res.end("Internal server error");
  });
  stream.pipe(res);
}

function createServer() {
  loadDotEnv(path.join(ROOT, ".env"));

  return http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url || "/", `http://${req.headers.host || `${HOST}:${PORT}`}`);

    if (requestUrl.pathname === "/api/github" || requestUrl.pathname === "/api/github.js") {
      await handleGitHubProxy(req, res, requestUrl);
      return;
    }

    handleStatic(req, res, requestUrl);
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, HOST, () => {
    console.log(`Servidor rodando em http://${HOST}:${PORT}`);
  });
}

module.exports = { createServer };
