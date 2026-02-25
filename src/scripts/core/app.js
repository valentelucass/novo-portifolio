/**
 * AUTOINTRO: src/scripts/core/app.js
 * Objetivo: Orquestra a inicializacao de componentes visuais, animacoes, menu, integracoes GitHub e estado global da pagina.
 * Escopo: Define a responsabilidade completa deste modulo dentro da arquitetura do projeto.
 */
import MenuEscalonado from "../components/menu/menuEscalonado.js";
import { ImpactIntro } from "../components/intro/impactIntro.js";
import { MasonrySobre } from "../components/sobre/masonrySobre.js";
import { CurriculoFolder } from "../components/sobre/curriculoFolder.js";
import { GlassIconsContato } from "../components/contato/flowingMenuContato.js";
import { LogoLoop } from "../components/projetos/logoLoop.js";
import { CardsGithub } from "../components/projetos/cardsGithub.js";
import { SkillsGithub } from "../components/projetos/skillsGithub.js";

const URL_GSAP_LOCAL = "./public/vendor/gsap.min.js";
const URL_GSAP_CDN = "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js";

const DARK_VEIL_OPTIONS = Object.freeze({
  hueShift: 0,
  noiseIntensity: 0,
  scanlineIntensity: 0,
  speed: 0.5,
  scanlineFrequency: 0,
  warpAmount: 0,
  resolutionScale: 1,
});

const MENU_ITEMS = Object.freeze([
  { label: "Home", ariaLabel: "Ir para inicio", link: "#inicio" },
  { label: "Sobre", ariaLabel: "Ir para sobre", link: "#sobre" },
  { label: "Projetos", ariaLabel: "Ir para projetos", link: "#projetos" },
  { label: "Skills", ariaLabel: "Ir para skills", link: "#skills" },
  { label: "Contato", ariaLabel: "Ir para contato", link: "#contato" },
]);

const SOCIAL_ITEMS = Object.freeze([
  { label: "GitHub", link: "https://github.com/valentelucass" },
  { label: "LinkedIn", link: "https://linkedin.com/in/dev-lucasandrade" },
  { label: "E-mail", link: "mailto:lucasmac.dev@gmail.com" },
]);

const CONTATO_ITEMS = Object.freeze([
  {
    link: "mailto:lucasmac.dev@gmail.com",
    label: "E-mail",
    color: "blue",
    icon: "mail",
    external: false,
  },
  {
    link: "https://linkedin.com/in/dev-lucasandrade",
    label: "LinkedIn",
    color: "indigo",
    icon: "linkedin",
    external: true,
  },
  {
    link: "https://github.com/valentelucass",
    label: "GitHub",
    color: "purple",
    icon: "github",
    external: true,
  },
  {
    link: "./public/curriculo-lucas-andrade.pdf",
    label: "Curriculo",
    color: "green",
    icon: "file",
    external: true,
  },
]);

const CURRICULO_OPTIONS = Object.freeze({
  downloadHref: "./public/curriculo-lucas-andrade.pdf",
  downloadFileName: "curriculo-lucas-andrade.pdf",
});

let promessaGsap = null;

function carregarGsap() {
  if (window.gsap) {
    return Promise.resolve(window.gsap);
  }

  if (promessaGsap) {
    return promessaGsap;
  }

  promessaGsap = new Promise((resolve, reject) => {
    const tentarCarregar = (url, fallbackUrl = null) => {
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.onload = () => {
        if (window.gsap) {
          resolve(window.gsap);
          return;
        }

        reject(new Error("GSAP carregou, mas window.gsap nao foi encontrado."));
      };
      script.onerror = () => {
        script.remove();
        if (fallbackUrl) {
          tentarCarregar(fallbackUrl, null);
          return;
        }
        reject(new Error("Falha ao carregar GSAP."));
      };
      document.head.appendChild(script);
    };

    tentarCarregar(URL_GSAP_LOCAL, URL_GSAP_CDN);
  });

  return promessaGsap;
}

function iniciarDarkVeil(container, gsap) {
  if (!container) return null;

  const veil = new ImpactIntro({
    container,
    gsap,
    ...DARK_VEIL_OPTIONS,
  });

  veil.iniciar();
  return veil;
}

function iniciarAnimacoesScroll(gsap) {
  document.querySelectorAll("[data-animate-projetos-header], [data-animate-header]").forEach((header) => {
    const label = header.querySelector(".sobre__label, .projetos__label");
    const titulo = header.querySelector(".sobre__titulo, .projetos__titulo");
    if (!label || !titulo) return;

    gsap.set([label, titulo], { opacity: 0, y: 30 });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          gsap.to(label, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" });
          gsap.to(titulo, { opacity: 1, y: 0, duration: 0.75, ease: "power3.out", delay: 0.12 });
          io.disconnect();
        });
      },
      { threshold: 0.2 }
    );

    io.observe(header);
  });

  const textoBloco = document.querySelector("#sobre-texto");
  if (!textoBloco) return;

  const ioTexto = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        textoBloco.classList.add("visivel");
        ioTexto.disconnect();
      });
    },
    { threshold: 0.15 }
  );

  ioTexto.observe(textoBloco);
}

function iniciarMenu(alvoMenu, gsap, alvoStatus) {
  if (!alvoMenu) return;

  const menu = new MenuEscalonado({
    container: alvoMenu,
    gsap,
    position: "right",
    items: MENU_ITEMS,
    socialItems: SOCIAL_ITEMS,
    displaySocials: true,
    displayItemNumbering: false,
    menuButtonColor: "#ffffff",
    openMenuButtonColor: "#ffffff",
    changeMenuColorOnOpen: true,
    colors: ["#B19EEF", "#5227FF"],
    accentColor: "#5227FF",
    logoTexto: "lucas.dev",
    onMenuOpen: () => {
      alvoStatus.textContent = "Menu aberto.";
    },
    onMenuClose: () => {
      alvoStatus.textContent = "Menu fechado.";
    },
  });

  menu.iniciar();
}

function iniciarContato(alvoContato, gsap) {
  if (!alvoContato) return;

  const contato = new GlassIconsContato({
    container: alvoContato,
    gsap,
    colorful: false,
    items: CONTATO_ITEMS,
  });

  contato.iniciar();
}

function iniciarAnoFooter() {
  const alvoAnoFooter = document.querySelector("#footer-year");
  if (alvoAnoFooter) {
    alvoAnoFooter.textContent = String(new Date().getFullYear());
  }
}

export async function iniciarAplicacao() {
  const alvoStatus = document.querySelector("#status-app");
  const alvoMenu = document.querySelector("#menu-escalonado");
  const alvoMasonry = document.querySelector("#masonry-sobre");

  if (!alvoStatus || !alvoMenu) return;

  alvoStatus.textContent = "Inicializando...";

  try {
    const gsap = await carregarGsap();

    iniciarMenu(alvoMenu, gsap, alvoStatus);
    iniciarDarkVeil(document.querySelector("#intro-dark-veil"), gsap);
    iniciarDarkVeil(document.querySelector("#footer-dark-veil"), gsap);

    if (alvoMasonry) {
      new MasonrySobre({ gsap, container: alvoMasonry }).iniciar();
    }

    const alvoCurriculo = document.querySelector("#curriculo-download");
    if (alvoCurriculo) {
      new CurriculoFolder({
        container: alvoCurriculo,
        ...CURRICULO_OPTIONS,
      }).iniciar();
    }

    const alvoLogoLoop = document.querySelector("#logo-loop");
    if (alvoLogoLoop) {
      new LogoLoop({ container: alvoLogoLoop }).iniciar();
    }

    const alvoCards = document.querySelector("#gh-cards-container");
    if (alvoCards) {
      new CardsGithub({ container: alvoCards }).iniciar();
    }

    const alvoSkills = document.querySelector("#gh-skills-container");
    if (alvoSkills) {
      new SkillsGithub({ container: alvoSkills }).iniciar();
    }

    iniciarContato(document.querySelector("#contato-flowing-menu"), gsap);
    iniciarAnoFooter();
    iniciarAnimacoesScroll(gsap);

    alvoStatus.textContent = "Pronto.";
  } catch (erro) {
    console.error(erro);
    alvoStatus.textContent = "Nao foi possivel inicializar.";
  }
}
