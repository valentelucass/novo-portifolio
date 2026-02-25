/**
 * AUTOINTRO: src/scripts/services/github/repositoriosEstreladosGithub.js
 * Objetivo: Busca e normaliza repositorios estrelados usados nas secoes de portfolio.
 * Escopo: Define a responsabilidade completa deste modulo dentro da arquitetura do projeto.
 */
/**
 * repositoriosEstreladosGithub.js
 *
 * Busca os repos estrelados do usuário com conteúdo do README decodificado.
 * Nota: este endpoint retorna repos estrelados POR outros usuários, não pelo
 * próprio dono. Para portfolio, prefira repositoriosGithubCliente.js que usa
 * a tag PORTFOLIO-FEATURED no README como critério de exibição.
 */

import { GITHUB_API_URL, GITHUB_USUARIO } from "./config.js";
import { githubGet, decodificarBase64 } from "./githubApi.js";

const README_FILE_RE = /^readme(\.[a-z0-9_-]+)?$/i;

function extrairReadmeItem(arquivos) {
  if (!Array.isArray(arquivos)) return null;
  return (
    arquivos.find((arquivo) => {
      if (!arquivo || arquivo.type !== "file") return false;
      return README_FILE_RE.test(String(arquivo.name || ""));
    }) || null
  );
}

async function buscarReadme(owner, repo) {
  try {
    const arquivosRaiz = await githubGet(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents`);
    const readmeItem = extrairReadmeItem(arquivosRaiz);
    if (!readmeItem?.url) return "";

    const dataReadme = await githubGet(readmeItem.url);
    if (dataReadme?.encoding !== "base64" || typeof dataReadme?.content !== "string") {
      return "";
    }

    return decodificarBase64(dataReadme.content);
  } catch {
    return "";
  }
}

function ordenar(a, b) {
  const porData = new Date(b.updated_at) - new Date(a.updated_at);
  if (porData !== 0) return porData;
  return (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0);
}

export async function buscarRepositoriosEstreladosGithub() {
  const repos = await githubGet(
    `${GITHUB_API_URL}/users/${GITHUB_USUARIO}/starred?per_page=100&sort=updated&direction=desc`
  );

  const comReadme = await Promise.all(
    repos.map(async (repo) => {
      if (Number(repo.size || 0) <= 0) {
        return { ...repo, readme_content: "" };
      }

      return {
        ...repo,
        readme_content: await buscarReadme(repo.owner.login, repo.name),
      };
    })
  );

  return comReadme.sort(ordenar);
}
