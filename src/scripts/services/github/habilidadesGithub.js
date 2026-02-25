/**
 * AUTOINTRO: src/scripts/services/github/habilidadesGithub.js
 * Objetivo: Consolida linguagens dos repositorios e calcula ranking percentual de skills por volume de codigo.
 * Escopo: Define a responsabilidade completa deste modulo dentro da arquitetura do projeto.
 */
/**
 * habilidadesGithub.js
 *
 * Busca e agrega as linguagens de todos os repos públicos do usuário,
 * retornando um ranking percentual de habilidades com cor associada.
 */

import { GITHUB_API_URL, GITHUB_USUARIO } from "./config.js";
import { githubGet } from "./githubApi.js";

const LINGUAGENS_IGNORADAS = new Set(["PowerShell", "Roff", "Batchfile", "Shell"]);

const CORES_LINGUAGEM = {
  JavaScript: "#f7df1e", TypeScript: "#3178c6", Python: "#3776ab",
  Java: "#ed8b00", "C++": "#00599c", "C#": "#239120",
  PHP: "#777bb4", Ruby: "#cc342d", Go: "#00add8",
  Rust: "#ce422b", Swift: "#ffac45", Kotlin: "#7f52ff",
  Dart: "#0175C2", Scala: "#DC322F", Perl: "#0298c3",
  Shell: "#89e051", "Objective-C": "#438eff",
  React: "#61dafb", Vue: "#4fc08d", Angular: "#dd0031",
  "Next.js": "#000000", "Nuxt.js": "#00DC82", Svelte: "#FF3E00",
  "Tailwind CSS": "#06b6d4", CSS: "#1572b6", HTML: "#e34f26",
  "Node.js": "#339933", Express: "#000000", Django: "#092e20",
  Flask: "#000000", FastAPI: "#009688", Spring: "#6DB33F",
  Laravel: "#FF2D20", "ASP.NET": "#512BD4",
  MySQL: "#4479A1", PostgreSQL: "#336791", SQLite: "#003B57",
  MongoDB: "#47A248", Redis: "#DC382D", Docker: "#2496ED",
  Kubernetes: "#326CE5", Git: "#F05032", Terraform: "#844FBA",
};

const corDaLinguagem = (nome) => CORES_LINGUAGEM[nome] ?? "#6b7280";

export async function buscarHabilidadesGithub() {
  const repos = await githubGet(
    `${GITHUB_API_URL}/users/${GITHUB_USUARIO}/repos?per_page=100`
  );

  const bytesPorLinguagem = {};

  await Promise.all(
    repos.map(async (repo) => {
      if (!repo.languages_url) return;
      try {
        const linguagens = await githubGet(repo.languages_url);
        for (const [lang, bytes] of Object.entries(linguagens)) {
          bytesPorLinguagem[lang] = (bytesPorLinguagem[lang] ?? 0) + bytes;
        }
      } catch {
        // ignora repos sem linguagem
      }
    })
  );

  const total = Object.values(bytesPorLinguagem).reduce((a, b) => a + b, 0);
  if (!total) return [];

  return Object.entries(bytesPorLinguagem)
    .map(([nome, bytes]) => ({ nome, bytes, percentual: Number(((bytes / total) * 100).toFixed(2)) }))
    .filter(h => h.percentual > 0 && !LINGUAGENS_IGNORADAS.has(h.nome))
    .sort((a, b) => b.bytes - a.bytes)
    .map(({ bytes: _bytes, ...resto }) => ({ ...resto, cor: corDaLinguagem(resto.nome) }));
}
