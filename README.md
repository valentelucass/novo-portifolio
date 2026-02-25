# Lucas Andrade - Portfolio

Portfolio pessoal focado em projetos reais de software, com interface premium e dados vivos do GitHub.

## Destaques

- Visual forte com tema `liquid glass` e background WebGL (`DarkVeil`).
- Secoes dinamicas de projetos e skills alimentadas por GitHub.
- Proxy seguro para GitHub API (token nunca exposto no frontend).
- Estrutura modular em `src/` para facilitar manutencao e evolucao.
- Deploy pronto na Vercel com headers de seguranca.

## Stack

- Frontend: HTML, CSS, JavaScript modular (ESM)
- Animacao/UI: GSAP + efeitos custom
- Backend leve: Node.js (proxy + static server local)
- Deploy: Vercel (`api/github.js` serverless)

## Estrutura do projeto

```text
.
|-- api/
|   `-- github.js                 # endpoint serverless (Vercel)
|-- src/
|   |-- backend/
|   |   `-- githubProxy.js        # regras de seguranca/allowlist para GitHub API
|   |-- scripts/
|   |   |-- core/app.js
|   |   |-- components/
|   |   `-- services/github/
|   `-- styles/
|       |-- base/
|       |-- layout/
|       `-- components/
|-- public/
|-- index.html
|-- server.js                     # servidor local para dev
|-- vercel.json
`-- package.json
```

## Como os dados do GitHub chegam na UI

1. Frontend chama `/api/github?url=...`.
2. `api/github.js` valida metodo e encaminha para `src/backend/githubProxy.js`.
3. O proxy valida host/path permitido, aplica timeout e headers seguros.
4. Resposta volta para os servicos em `src/scripts/services/github/`.
5. Componentes renderizam cards e skills na pagina.

## Setup local

Crie um `.env` baseado no `.env.example`:

```env
GITHUB_TOKEN=github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Instalacao e execucao:

```bash
npm install
npm run dev
```

Abrir no navegador:

```text
http://127.0.0.1:3000
```

## Deploy na Vercel

1. Importar o repositorio na Vercel.
2. Configurar `GITHUB_TOKEN` em `Settings -> Environment Variables`.
3. Fazer deploy.

`vercel.json` ja inclui:

- runtime Node 20 para `api/*.js`
- politicas de seguranca (CSP, HSTS, X-Frame-Options, etc.)

## Seguranca

- Token GitHub somente no servidor.
- Allowlist de endpoints em `src/backend/githubProxy.js`.
- Bloqueio de host fora de `api.github.com`.
- Timeout de request para evitar hanging.
- Headers de seguranca no proxy e no deploy.

## Status

Projeto pronto para portfolio e deploy continuo na Vercel.
