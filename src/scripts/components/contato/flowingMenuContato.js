/**
 * AUTOINTRO: src/scripts/components/contato/flowingMenuContato.js
 * Objetivo: Renderiza os botoes de contato em estilo glass e controla comportamento/interacao do bloco de contato.
 * Escopo: Define a responsabilidade completa deste modulo dentro da arquitetura do projeto.
 */
const GRADIENT_MAPPING = Object.freeze({
  blue: "linear-gradient(hsl(223, 90%, 50%), hsl(208, 90%, 50%))",
  purple: "linear-gradient(hsl(283, 90%, 50%), hsl(268, 90%, 50%))",
  red: "linear-gradient(hsl(3, 90%, 50%), hsl(348, 90%, 50%))",
  indigo: "linear-gradient(hsl(253, 90%, 50%), hsl(238, 90%, 50%))",
  orange: "linear-gradient(hsl(43, 90%, 50%), hsl(28, 90%, 50%))",
  green: "linear-gradient(hsl(123, 90%, 40%), hsl(108, 90%, 40%))",
});

const MONO_GRADIENT_MAPPING = Object.freeze({
  blue: "linear-gradient(hsl(222, 15%, 52%), hsl(216, 18%, 36%))",
  purple: "linear-gradient(hsl(268, 13%, 54%), hsl(262, 16%, 36%))",
  red: "linear-gradient(hsl(352, 14%, 55%), hsl(344, 18%, 37%))",
  indigo: "linear-gradient(hsl(245, 14%, 53%), hsl(238, 16%, 35%))",
  orange: "linear-gradient(hsl(35, 17%, 54%), hsl(30, 18%, 37%))",
  green: "linear-gradient(hsl(142, 12%, 50%), hsl(132, 15%, 34%))",
});

const ICON_MARKUP = Object.freeze({
  mail: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16v12H4z"></path>
      <path d="m4 7 8 6 8-6"></path>
    </svg>
  `,
  linkedin: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2"></rect>
      <circle cx="8" cy="8" r="1"></circle>
      <path d="M8 11v5"></path>
      <path d="M12 16v-3a2 2 0 0 1 4 0v3"></path>
    </svg>
  `,
  github: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 19c-5 1.5-5-2.5-7-3"></path>
      <path d="M16 22v-3.87a3.37 3.37 0 0 0-.94-2.61"></path>
      <path d="M20.49 11.62A5.44 5.44 0 0 0 22 7.84"></path>
      <path d="M14.56 3.52a13.35 13.35 0 0 0-5.12 0"></path>
      <path d="M5.09 1A5.07 5.07 0 0 0 5 4.77"></path>
      <path d="M19.91 1A5.07 5.07 0 0 1 20 4.77"></path>
      <path d="M9.4 15.52c-3.14-.35-6.44-1.54-6.44-7"></path>
      <path d="M21 8.55c0 5.42-3.3 6.61-6.44 7"></path>
      <path d="M3.5 8.55A5.44 5.44 0 0 1 5 4.77"></path>
    </svg>
  `,
  file: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <path d="M14 2v6h6"></path>
      <path d="M16 13H8"></path>
      <path d="M16 17H8"></path>
      <path d="M10 9H8"></path>
    </svg>
  `,
  link: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 14a4 4 0 0 1 0-6l2-2a4 4 0 0 1 6 6l-1 1"></path>
      <path d="M14 10a4 4 0 0 1 0 6l-2 2a4 4 0 0 1-6-6l1-1"></path>
    </svg>
  `,
});

function createElement(className, tag = "div") {
  const el = document.createElement(tag);
  el.className = className;
  return el;
}

function resolveItemLabel(item) {
  return item.label || item.text || "Contato";
}

function inferIconFromLabel(label) {
  const text = (label || "").toLowerCase();
  if (text.includes("mail")) return "mail";
  if (text.includes("linkedin")) return "linkedin";
  if (text.includes("github")) return "github";
  if (text.includes("curriculo") || text.includes("cv")) return "file";
  return "link";
}

function resolveIconMarkup(item) {
  if (typeof item.icon === "string" && ICON_MARKUP[item.icon]) {
    return ICON_MARKUP[item.icon];
  }

  if (typeof item.icon === "string" && item.icon.trim().startsWith("<svg")) {
    return item.icon;
  }

  return ICON_MARKUP[inferIconFromLabel(resolveItemLabel(item))];
}

export class GlassIconsContato {
  constructor({
    container,
    gsap,
    items = [],
    className = "",
    colorful = false,
  }) {
    this.container = container;
    this.gsap = gsap || window.gsap || null;
    this.items = items;
    this.className = className;
    this.colorful = colorful;
  }

  iniciar() {
    if (!this.container || !this.items.length) return;

    this.renderizar();
    this.animarEntrada();
  }

  getBackgroundStyle(color) {
    if (this.colorful) {
      return GRADIENT_MAPPING[color] || color || GRADIENT_MAPPING.indigo;
    }

    return MONO_GRADIENT_MAPPING[color] || "linear-gradient(hsl(224, 12%, 52%), hsl(226, 14%, 35%))";
  }

  criarIcone(item) {
    const icon = createElement("icon-btn__icon", "span");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = resolveIconMarkup(item);
    return icon;
  }

  criarItem(item, index) {
    const root = createElement("icon-item", "li");
    const link = createElement(`icon-btn ${item.customClass || ""}`.trim(), "a");
    const back = createElement("icon-btn__back", "span");
    const front = createElement("icon-btn__front", "span");
    const label = createElement("icon-btn__label", "span");

    const linkLabel = resolveItemLabel(item);
    link.href = item.link || "#";
    link.target = item.external ? "_blank" : "_self";
    link.rel = item.external ? "noopener noreferrer" : "";
    link.setAttribute("aria-label", linkLabel);
    link.style.setProperty("--icon-delay", `${index * 45}ms`);

    back.style.background = this.getBackgroundStyle(item.color);
    back.setAttribute("aria-hidden", "true");

    front.appendChild(this.criarIcone(item));

    label.textContent = linkLabel;

    link.append(back, front, label);
    root.appendChild(link);

    return root;
  }

  renderizar() {
    this.container.innerHTML = "";
    this.container.classList.add("contato__menu", "ct-wrap");

    if (this.className.trim()) {
      this.className
        .trim()
        .split(/\s+/)
        .forEach((className) => this.container.classList.add(className));
    }

    const lista = createElement("icon-btns", "ul");
    lista.setAttribute("role", "list");
    lista.setAttribute("aria-label", "Canais de contato");

    this.items.forEach((item, index) => {
      lista.appendChild(this.criarItem(item, index));
    });

    this.container.appendChild(lista);
  }

  animarEntrada() {
    if (!this.gsap) return;

    const botoes = this.container.querySelectorAll(".icon-btn");
    if (!botoes.length) return;

    this.gsap.fromTo(
      botoes,
      { opacity: 0, y: 14, scale: 0.94 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.52,
        ease: "power3.out",
        stagger: 0.07,
      }
    );
  }
}

// Compatibilidade com nome antigo do componente.
export { GlassIconsContato as FlowingMenuContato };
