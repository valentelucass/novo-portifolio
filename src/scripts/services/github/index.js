/**
 * AUTOINTRO: src/scripts/services/github/index.js
 * Objetivo: Agrega e reexporta funcoes de servico GitHub para importacoes consistentes no app.
 * Escopo: Define a responsabilidade completa deste modulo dentro da arquitetura do projeto.
 */
/**
 * index.js — Barrel de exports do módulo github/
 *
 * Importe daqui para não depender de paths internos diretamente.
 */

export { buscarRepositoriosPortfolio } from "./repositoriosGithubCliente.js";
export { buscarHabilidadesGithub } from "./habilidadesGithub.js";
export { buscarRepositoriosEstreladosGithub } from "./repositoriosEstreladosGithub.js";
export { verificarStatusTokenGithub } from "./statusTokenGithub.js";
