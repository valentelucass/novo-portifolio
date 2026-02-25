/**
 * AUTOINTRO: src/backend/githubProxy.js
 * Objetivo: Concentra regras de seguranca do proxy GitHub (allowlist, validacao de URL, timeout e headers).
 * Escopo: Define a responsabilidade completa deste modulo dentro da arquitetura do projeto.
 */
const GITHUB_HOST = "api.github.com";
const MAX_TARGET_URL_LENGTH = 2048;
const FETCH_TIMEOUT_MS = 10000;
const GITHUB_USER_AGENT = "portfolio-2-github-proxy";

const ALLOWED_PATHS = [
  /^\/users\/[^/]+\/repos$/,
  /^\/users\/[^/]+\/starred$/,
  /^\/repos\/[^/]+\/[^/]+\/readme$/,
  /^\/repos\/[^/]+\/[^/]+\/contents$/,
  /^\/repos\/[^/]+\/[^/]+\/contents\/.+$/,
  /^\/repos\/[^/]+\/[^/]+\/languages$/,
  /^\/user$/,
];

const PROXY_RESPONSE_HEADERS = {
  "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-GitHub-Proxy": "true",
};

function applyProxyHeaders(res) {
  Object.entries(PROXY_RESPONSE_HEADERS).forEach(([name, value]) => {
    res.setHeader(name, value);
  });
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(body),
  };
}

function isAllowedGitHubPath(pathname) {
  return ALLOWED_PATHS.some((pattern) => pattern.test(pathname));
}

function parseTargetUrl(rawUrl) {
  if (!rawUrl) {
    return jsonResponse(400, { message: "Missing `url` query parameter." });
  }

  if (typeof rawUrl !== "string" || rawUrl.length > MAX_TARGET_URL_LENGTH) {
    return jsonResponse(400, { message: "Invalid GitHub URL length." });
  }

  let target;
  try {
    target = new URL(rawUrl.trim());
  } catch {
    return jsonResponse(400, { message: "Invalid GitHub URL." });
  }

  if (target.protocol !== "https:" || target.hostname !== GITHUB_HOST) {
    return jsonResponse(403, { message: "Only https://api.github.com is allowed." });
  }

  if (target.username || target.password) {
    return jsonResponse(403, { message: "Credentials in URL are not allowed." });
  }

  if (!isAllowedGitHubPath(target.pathname)) {
    return jsonResponse(403, { message: "Endpoint is not allowed by proxy policy." });
  }

  return { target };
}

async function proxyGitHubRequest({ method, rawUrl, githubToken }) {
  if (method !== "GET") {
    return jsonResponse(405, { message: "Method not allowed." });
  }

  const parsed = parseTargetUrl(rawUrl);
  if (!parsed.target) {
    return parsed;
  }

  const upstreamHeaders = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": GITHUB_USER_AGENT,
  };

  if (githubToken) {
    upstreamHeaders.Authorization = `Bearer ${githubToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const upstreamResp = await fetch(parsed.target.toString(), {
      method: "GET",
      headers: upstreamHeaders,
      signal: controller.signal,
    });

    const body = await upstreamResp.text();
    const contentType =
      upstreamResp.headers.get("content-type") || "application/json; charset=utf-8";

    return {
      statusCode: upstreamResp.status,
      contentType,
      body,
    };
  } catch (erro) {
    if (erro?.name === "AbortError") {
      return jsonResponse(504, { message: "GitHub API timeout." });
    }

    return jsonResponse(502, { message: "Failed to reach GitHub API." });
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  applyProxyHeaders,
  proxyGitHubRequest,
};
