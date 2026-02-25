/**
 * AUTOINTRO: src/scripts/services/github/githubApi.js
 * Objetivo: Cliente HTTP do frontend para consumir o proxy GitHub com cache, deduplicacao e tratamento de erro.
 * Escopo: Define a responsabilidade completa deste modulo dentro da arquitetura do projeto.
 */
import {
  GITHUB_API_URL,
  GITHUB_PROXY_ENDPOINT,
} from "./config.js";

const GITHUB_PROXY_HEADER = "X-GitHub-Proxy";
const PROXY_HELP_MESSAGE =
  "Proxy GitHub indisponivel. Rode `node server.js` e abra o site em http://127.0.0.1:3000 (ou mantenha CORS habilitado para chamar essa porta).";
const REQUEST_TIMEOUT_MS = 12000;
const PROXY_ENDPOINTS_PRODUCTION = Object.freeze([
  GITHUB_PROXY_ENDPOINT,
]);
const PROXY_ENDPOINTS_LOCAL = Object.freeze([
  GITHUB_PROXY_ENDPOINT,
  `${GITHUB_PROXY_ENDPOINT}/`,
  `${GITHUB_PROXY_ENDPOINT}.js`,
]);

const responseCache = new Map();
const pendingRequests = new Map();

function montarUrlProxy(proxyBaseUrl, urlGithub) {
  return `${proxyBaseUrl}?url=${encodeURIComponent(urlGithub)}`;
}

function isUrlGitHubApi(urlGithub) {
  return typeof urlGithub === "string" && urlGithub.startsWith(GITHUB_API_URL);
}

function isProxyResponse(resp) {
  return resp?.headers?.get(GITHUB_PROXY_HEADER) === "true";
}

function pushCandidates(target, originBase, endpoints) {
  endpoints.forEach((endpoint) => {
    target.push(`${originBase}${endpoint}`);
  });
}

function getProxyCandidates() {
  const candidates = [];

  if (typeof window !== "undefined") {
    const { origin, protocol, hostname, port } = window.location;
    const isHttpOrigin = protocol === "http:" || protocol === "https:";

    // Prioriza mesma origem para deploy normal (Vercel/producao).
    if (isHttpOrigin) {
      const isLocalHostname = hostname === "127.0.0.1" || hostname === "localhost";
      const endpoints = isLocalHostname ? PROXY_ENDPOINTS_LOCAL : PROXY_ENDPOINTS_PRODUCTION;
      pushCandidates(candidates, origin, endpoints);

      // Fallback local sem misturar localhost <-> 127.0.0.1 para evitar CORS cruzado desnecessario.
      if (isLocalHostname && port !== "3000") {
        pushCandidates(candidates, `${protocol}//${hostname}:3000`, endpoints);
      }
    }
  }

  if (!candidates.length) {
    pushCandidates(candidates, "http://127.0.0.1:3000", PROXY_ENDPOINTS_LOCAL);
  }

  return [...new Set(candidates)];
}

async function parseErrorResponse(resp, origem) {
  const corpo = await resp.json().catch(() => ({}));
  throw new Error(corpo.message ?? `GitHub API ${resp.status}: ${origem}`);
}

function withTimeout(signal, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) controller.abort();
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  };
}

async function fetchViaProxy(proxyBaseUrl, urlGithub) {
  const timeout = withTimeout(null, REQUEST_TIMEOUT_MS);

  try {
    const resp = await fetch(montarUrlProxy(proxyBaseUrl, urlGithub), {
      method: "GET",
      signal: timeout.signal,
    });
    return resp;
  } finally {
    timeout.clear();
  }
}

function getCacheKey(urlGithub) {
  return `GET:${urlGithub}`;
}

export async function githubGet(urlGithub, options = {}) {
  const { force = false } = options;

  if (!isUrlGitHubApi(urlGithub)) {
    throw new Error("URL invalida para GitHub API.");
  }

  const cacheKey = getCacheKey(urlGithub);
  if (!force && responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const requestPromise = (async () => {
    const candidates = getProxyCandidates();
    for (const proxyBaseUrl of candidates) {
      let resp;

      try {
        resp = await fetchViaProxy(proxyBaseUrl, urlGithub);
      } catch {
        // endpoint indisponivel, tenta proximo
        continue;
      }

      // Se nao for nosso proxy, tenta o proximo candidato.
      if (!isProxyResponse(resp)) {
        continue;
      }

      if (!resp.ok) {
        await parseErrorResponse(resp, urlGithub);
      }

      const json = await resp.json();
      responseCache.set(cacheKey, json);
      return json;
    }

    throw new Error(PROXY_HELP_MESSAGE);
  })();

  pendingRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

export function limparCacheGithub() {
  responseCache.clear();
  pendingRequests.clear();
}

export function decodificarBase64(conteudo) {
  if (!conteudo) return "";
  const binario = atob(conteudo.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}
