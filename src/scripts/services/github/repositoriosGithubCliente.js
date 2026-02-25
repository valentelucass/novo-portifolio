/**
 * AUTOINTRO: src/scripts/services/github/repositoriosGithubCliente.js
 * Objetivo: Busca e normaliza repositorios do usuario para alimentar cards e blocos de projetos.
 * Escopo: Define a responsabilidade completa deste modulo dentro da arquitetura do projeto.
 */
/**
 * repositoriosGithubCliente.js
 *
 * Carrega os projetos do portfólio a partir dos repos públicos do GitHub.
 * Um projeto só aparece se o README contiver o bloco <!-- PORTFOLIO-FEATURED -->.
 *
 * Formato da tag:
 * <!-- PORTFOLIO-FEATURED
 * title:       Nome Legível do Projeto
 * description: Descrição curta (máx 3 linhas no card)
 * technologies: React, Node.js, PostgreSQL
 * category:    dados          ← força categoria (dados | automacao | web)
 * demo:        https://url    ← opcional
 * image:       public/img.png ← opcional (path relativo ao root do repo)
 * -->
 *
 * Categorias:
 *   dados     → Ciência e Análise de Dados
 *   automacao → Automação e Engenharia de Software
 *   web       → Desenvolvimento Web  (fallback para projetos front-end puros)
 */

import { GITHUB_API_URL, GITHUB_USUARIO } from "./config.js";
import { githubGet, decodificarBase64 } from "./githubApi.js";

const TAG_RE = /<!--\s*PORTFOLIO-FEATURED\s*([\s\S]*?)-->/;
const README_FILE_RE = /^readme(\.[a-z0-9_-]+)?$/i;


/* ─────────────────────────────────────────────────────────────────
   Parser da tag PORTFOLIO-FEATURED
───────────────────────────────────────────────────────────────── */
function parsearTag(readme) {
    const match = readme.match(TAG_RE);
    if (!match) return null;

    const bloco = match[1];
    const ler = (chave) => {
        const m = bloco.match(new RegExp(`${chave}:\\s*(.+)`));
        return m ? m[1].trim() : null;
    };

    return {
        titulo: ler("title"),
        descricao: ler("description"),
        tecnologias: (ler("technologies") ?? "").split(",").map(t => t.trim()).filter(Boolean),
        categoriaExplicita: ler("category") ?? null,
        demo: ler("demo") ?? null,
        imagem: ler("image") ?? null,
    };
}

function imagemMetaValida(imagem) {
    if (!imagem || typeof imagem !== "string") return false;
    const valor = imagem.trim();
    if (!valor) return false;

    if (/^https?:\/\//i.test(valor)) {
        return true;
    }

    return /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(valor);
}

function urlExternaValida(url) {
    if (!url || typeof url !== "string") return null;

    let valor = url.trim();
    if (!valor) return null;

    const temProtocolo = /^https?:\/\//i.test(valor);
    if (!temProtocolo) {
        // Evita transformar strings soltas (ex.: "github") em URL valida.
        const pareceDominio = /^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(valor);
        if (!pareceDominio) return null;
        valor = `https://${valor}`;
    }

    try {
        const parsed = new URL(valor);
        if (!/^https?:$/i.test(parsed.protocol)) return null;
        return parsed.toString();
    } catch {
        return null;
    }
}

/* ─────────────────────────────────────────────────────────────────
   Categorização por tecnologias

   Matching por PALAVRAS EXATAS após normalização:
     - "javascript".includes("java")   → FALSE  ✓ sem falso positivo
     - "tailwind".includes("ai")       → FALSE  ✓ sem falso positivo
     - "node.js"  bate keyword "node"  → TRUE   ✓ match correto

   Prioridade dados > automacao > web por pontuação dominante.
───────────────────────────────────────────────────────────────── */

/* ── Normaliza tech em palavras ── */
const normalizarPalavras = (s) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);

/* ────────────────────────────────────────────────────────────────
   Categorização

   Regra:
     1. Campo `category` no README — fonte primária e mais confiável.
        Defina manualmente em cada projeto para controle total.

     2. Fallback automático — conservador:
        • Tem qualquer indicador de frontend (HTML/CSS/JS/framework) → web
        • Tem ferramentas de dados/ML/automação sem layer web         → engenharia
        • Dúvida (Node+MySQL, PHP+MySQL, etc.)                        → web

   Por que Node/MySQL/PHP não classificam como "engenharia":
   A tecnologia não define o propósito. Um site institucional com Node.js é web.
──────────────────────────────────────────────────────────────── */

// Presentes em qualquer projeto com interface visual no browser
const FRONTEND_KW = new Set([
    "html", "html5", "css", "css3", "javascript", "typescript",
    "react", "vue", "angular", "svelte", "next", "nextjs", "nuxt",
    "sveltekit", "astro", "remix", "solid",
    "tailwind", "bootstrap", "sass", "scss", "gsap", "threejs",
    "vite", "webpack", "parcel",
]);

// Ferramentas que indicam trabalho de dados/ML/automação SEM camada web
const ENGENHARIA_KW = new Set([
    "numpy", "pandas", "matplotlib", "seaborn", "statsmodels",
    "tensorflow", "pytorch", "keras", "sklearn", "scikit",
    "jupyter", "notebook", "colab", "kaggle",
    "spark", "hadoop", "airflow", "dbt", "etl",
    "selenium", "playwright", "puppeteer", "rpa",
    "pdfplumber", "beautifulsoup", "scrapy", "python", "node", "mysql", "php",
    "java", "maven", "gradle", "spring", "hibernate", "jpa", "junit", "jmock", "jmockit", "jmock"
]);

function categorizar(techs, categoriaExplicita) {
    // 1. Campo category no README — sempre prevalece
    if (categoriaExplicita) {
        const c = categoriaExplicita
            .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        if (["engenharia", "dados", "automacao"].includes(c)) return "engenharia";
        if (c === "web") return "web";
    }

    // 2. Fallback: extrai todas as palavras das techs
    const palavras = new Set(techs.flatMap(t => normalizarPalavras(t)));

    // Se tem qualquer indicador de frontend → web (independente de backend)
    for (const kw of FRONTEND_KW) {
        if (palavras.has(kw)) return "web";
    }

    // Sem frontend + tem ferramentas de dados/ML/automação → engenharia
    for (const kw of ENGENHARIA_KW) {
        if (palavras.has(kw)) return "engenharia";
    }

    // Default conservador: web
    return "web";
}

/* ── Busca README ── */
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
        if (!readmeItem?.url) return null;

        const dataReadme = await githubGet(readmeItem.url);
        if (dataReadme?.encoding !== "base64" || typeof dataReadme?.content !== "string") {
            return null;
        }

        return decodificarBase64(dataReadme.content);
    } catch {
        return null;
    }
}

/* ── Função principal exportada ── */
export async function buscarRepositoriosPortfolio() {
    const repos = await githubGet(
        `${GITHUB_API_URL}/users/${GITHUB_USUARIO}/repos?per_page=100&sort=updated&type=public`
    );

    const ativos = repos.filter(r => !r.archived);
    if (ativos.length === 0) return [];

    const resultados = await Promise.all(
        ativos.map(async (repo) => {
            if (Number(repo.size || 0) <= 0) return null;

            const readme = await buscarReadme(repo.owner.login, repo.name);
            if (!readme) return null;

            const meta = parsearTag(readme);
            if (!meta) return null;

            const nome = meta.titulo ?? repo.name.replace(/[-_]/g, " ");
            const usaImagemMeta = imagemMetaValida(meta.imagem);
            const imgUrl = usaImagemMeta
                ? (/^https?:\/\//i.test(meta.imagem)
                    ? meta.imagem
                    : `https://raw.githubusercontent.com/${GITHUB_USUARIO}/${repo.name}/HEAD/${meta.imagem}`)
                : `https://opengraph.githubassets.com/1/${GITHUB_USUARIO}/${repo.name}`;
            const urlDemo = urlExternaValida(meta.demo) ?? urlExternaValida(repo.homepage);

            return {
                id: repo.id,
                nome,
                descricao: meta.descricao ?? repo.description ?? "Sem descrição.",
                urlGithub: repo.html_url,
                urlDemo,
                techs: meta.tecnologias,
                imgUrl,
                categoria: categorizar(meta.tecnologias, meta.categoriaExplicita),
                atualizadoEm: repo.updated_at,
            };
        })
    );

    return resultados
        .filter(Boolean)
        .sort((a, b) => new Date(b.atualizadoEm) - new Date(a.atualizadoEm));
}
