/**
 * AUTOINTRO: src/scripts/components/projetos/logoLoop.js
 * Objetivo: Controla o loop visual de logos/tecnologias exibidas na secao de projetos.
 * Escopo: Define a responsabilidade completa deste modulo dentro da arquitetura do projeto.
 */
/**
 * LogoLoop — Carrossel infinito de logos em vanilla JS
 * Usa CSS animation para loop suave e sem dependências
 */

const TECNOLOGIAS = [
    {
        nome: "Java",
        icone: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg",
        href: "https://www.java.com"
    },
    {
        nome: "Spring Boot",
        icone: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/spring/spring-original.svg",
        href: "https://spring.io/projects/spring-boot"
    },
    {
        nome: "Python",
        icone: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg",
        href: "https://www.python.org"
    },
    {
        nome: "JavaScript",
        icone: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg",
        href: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript"
    },
    {
        nome: "TypeScript",
        icone: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg",
        href: "https://www.typescriptlang.org"
    },
    {
        nome: "HTML5",
        icone: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg",
        href: "https://developer.mozilla.org/pt-BR/docs/Web/HTML"
    },
    {
        nome: "CSS3",
        icone: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg",
        href: "https://developer.mozilla.org/pt-BR/docs/Web/CSS"
    },
    {
        nome: "MySQL",
        icone: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg",
        href: "https://www.mysql.com"
    },
    {
        nome: "MongoDB",
        icone: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg",
        href: "https://www.mongodb.com"
    },
    {
        nome: "React",
        icone: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg",
        href: "https://react.dev"
    },
    {
        nome: "Node.js",
        icone: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg",
        href: "https://nodejs.org"
    },
    {
        nome: "Git",
        icone: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg",
        href: "https://git-scm.com"
    },
    {
        nome: "GitHub",
        icone: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg",
        href: "https://github.com",
        inverter: true   // ícone preto → precisa inverter para fundo escuro
    },
    {
        nome: "AWS",
        icone: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg",
        href: "https://aws.amazon.com",
        inverter: true
    },
    {
        nome: "Azure",
        icone: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azure/azure-original.svg",
        href: "https://azure.microsoft.com"
    },
    {
        nome: "Figma",
        icone: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg",
        href: "https://figma.com"
    },
];

function criarItemLogo(tech) {
    const li = document.createElement("li");
    li.className = "ll-item";
    li.setAttribute("role", "listitem");

    const a = document.createElement("a");
    a.href = tech.href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "ll-link";
    a.setAttribute("aria-label", tech.nome);
    a.setAttribute("title", tech.nome);

    const img = document.createElement("img");
    img.src = tech.icone;
    img.alt = tech.nome;
    img.loading = "lazy";
    img.decoding = "async";
    img.draggable = false;
    img.className = "ll-icon" + (tech.inverter ? " ll-icon--inverter" : "");

    a.appendChild(img);

    const nome = document.createElement("span");
    nome.className = "ll-nome";
    nome.textContent = tech.nome;

    a.appendChild(nome);
    li.appendChild(a);
    return li;
}

function criarLista(tecnologias, oculta = false) {
    const ul = document.createElement("ul");
    ul.className = "ll-lista";
    ul.setAttribute("role", "list");
    if (oculta) ul.setAttribute("aria-hidden", "true");

    tecnologias.forEach(tech => {
        ul.appendChild(criarItemLogo(tech));
    });

    return ul;
}

export class LogoLoop {
    constructor({ container }) {
        this.container = container;
    }

    iniciar() {
        this.container.innerHTML = `
      <div class="ll-track" aria-label="Tecnologias utilizadas" role="region"></div>
    `;
        const track = this.container.querySelector(".ll-track");

        // Duplicar a lista para o loop contínuo
        track.appendChild(criarLista(TECNOLOGIAS, false));
        track.appendChild(criarLista(TECNOLOGIAS, true));

        // Pausar animação no hover
        track.addEventListener("mouseenter", () => {
            track.style.animationPlayState = "paused";
        });
        track.addEventListener("mouseleave", () => {
            track.style.animationPlayState = "running";
        });
    }
}
