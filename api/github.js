/**
 * AUTOINTRO: api/github.js
 * Objetivo: Entrypoint serverless para Vercel que encaminha requisicoes permitidas para a API do GitHub com seguranca.
 * Escopo: Aplica regras de metodo/erros e encaminha requisicoes permitidas para o backend de proxy seguro.
 */
const {
  applyProxyHeaders,
  proxyGitHubRequest,
} = require("../src/backend/githubProxy");

function setCorsHeaders(req, res) {
  const origin = req.headers?.origin;
  const requestedHeaders = req.headers?.["access-control-request-headers"];
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

// Serverless entrypoint (ex.: Vercel) para o proxy do GitHub.
module.exports = async function githubProxy(req, res) {
  applyProxyHeaders(res);
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.status(204);
    res.setHeader("Allow", "GET,OPTIONS");
    res.send("");
    return;
  }

  try {
    const rawUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
    const response = await proxyGitHubRequest({
      method: req.method,
      rawUrl,
      githubToken: process.env.GITHUB_TOKEN,
    });

    res.status(response.statusCode);
    res.setHeader("Content-Type", response.contentType);
    res.send(response.body);
  } catch {
    res.status(500);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(JSON.stringify({ message: "Unexpected proxy failure." }));
  }
};
