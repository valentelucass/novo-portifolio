/**
 * AUTOINTRO: src/scripts/services/github/statusTokenGithub.js
 * Objetivo: Valida disponibilidade/autorizacao do token GitHub via proxy para informar status de integracao.
 * Escopo: Define a responsabilidade completa deste modulo dentro da arquitetura do projeto.
 */
/**
 * statusTokenGithub.js
 *
 * Verifica se o token do GitHub está válido consultando /user.
 * Útil para debug — não é chamado no fluxo principal do portfólio.
 */

import { GITHUB_API_URL } from "./config.js";
import { githubGet } from "./githubApi.js";

export async function verificarStatusTokenGithub() {
  try {
    const usuario = await githubGet(`${GITHUB_API_URL}/user`);
    return {
      status: "valido",
      mensagem: "Token válido",
      usuario: usuario.login,
    };
  } catch (err) {
    return {
      status: "invalido",
      mensagem: err.message ?? "Erro ao verificar token",
    };
  }
}
