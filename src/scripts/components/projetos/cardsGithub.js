/**
 * AUTOINTRO: src/scripts/components/projetos/cardsGithub.js
 * Objetivo: Monta os cards de repositorios/projetos a partir dos dados vindos da camada de servico GitHub.
 * Escopo: Define a responsabilidade completa deste modulo dentro da arquitetura do projeto.
 */
import { buscarRepositoriosPortfolio } from "../../services/github/repositoriosGithubCliente.js";

const CATEGORY_ICONS = {
  engenharia: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                 <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
                 <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
                 <line x1="6" y1="6" x2="6.01" y2="6"/>
                 <line x1="6" y1="18" x2="6.01" y2="18"/>
               </svg>`,
  web: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>`,
};

const CATEGORIES = [
  { id: "engenharia", label: "Dados, Automacao e Engenharia" },
  { id: "web", label: "Desenvolvimento Web" },
];

const TILT_MAX = 10;
const TILT_TAU = 0.1;

function supportsHoverTilt() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function createTiltEngine(el) {
  let rafId = null;
  let initialTs = 0;
  let currentX = 50;
  let currentY = 50;
  let targetX = 50;
  let targetY = 50;
  let active = false;

  const apply = () => {
    el.style.setProperty("--rx", `${(-(currentY - 50) / 50 * TILT_MAX).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((currentX - 50) / 50 * TILT_MAX).toFixed(2)}deg`);
    el.style.setProperty("--px", `${currentX.toFixed(1)}%`);
    el.style.setProperty("--py", `${currentY.toFixed(1)}%`);
  };

  const tick = (now) => {
    if (!initialTs) initialTs = now;
    const dt = (now - initialTs) / 1000;
    initialTs = now;

    const k = 1 - Math.exp(-dt / TILT_TAU);
    currentX += (targetX - currentX) * k;
    currentY += (targetY - currentY) * k;
    apply();

    const settled = Math.abs(targetX - currentX) < 0.08 && Math.abs(targetY - currentY) < 0.08;
    if (!settled || active) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    rafId = null;
    initialTs = 0;
  };

  const play = () => {
    if (!rafId) {
      initialTs = 0;
      rafId = requestAnimationFrame(tick);
    }
  };

  return {
    onMove(event) {
      const rect = el.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width) * 100;
      targetY = ((event.clientY - rect.top) / rect.height) * 100;
      play();
    },
    onEnter() {
      active = true;
      el.dataset.ativo = "";
      play();
    },
    onLeave() {
      active = false;
      delete el.dataset.ativo;
      targetX = 50;
      targetY = 50;
      play();
    },
    destroy() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}

function createSkeletonCard() {
  const el = document.createElement("div");
  el.className = "ghc-card ghc-card--skel";
  el.innerHTML = `
    <div class="ghc-img-wrap ghc-skel-block"></div>
    <div class="ghc-body">
      <div class="ghc-skel-line" style="width:55%;height:.95rem;margin-bottom:.6rem"></div>
      <div class="ghc-skel-line" style="width:100%;height:.7rem;margin-bottom:.3rem"></div>
      <div class="ghc-skel-line" style="width:78%;height:.7rem;margin-bottom:.3rem"></div>
      <div class="ghc-skel-line" style="width:62%;height:.7rem;margin-bottom:1rem"></div>
      <div style="display:flex;gap:.4rem;margin-bottom:.8rem">
        <div class="ghc-skel-line" style="width:46px;height:1.25rem;border-radius:99px"></div>
        <div class="ghc-skel-line" style="width:46px;height:1.25rem;border-radius:99px"></div>
      </div>
      <div style="display:flex;gap:.5rem">
        <div class="ghc-skel-line" style="width:68px;height:1.85rem;border-radius:8px"></div>
        <div class="ghc-skel-line" style="width:56px;height:1.85rem;border-radius:8px"></div>
      </div>
    </div>
  `;
  return el;
}

function createProjectCard(repo, cleanupBag) {
  const card = document.createElement("article");
  card.className = "ghc-card";

  const name = repo.nome.replace(/[-_]/g, " ");
  const maxTags = 4;
  const tags = repo.techs.slice(0, maxTags);
  const extraTags = repo.techs.length - maxTags;
  const tagsHtml =
    tags.map((tech) => `<span class="ghc-tag">${tech}</span>`).join("") +
    (extraTags > 0 ? `<span class="ghc-tag ghc-tag--mais">+${extraTags}</span>` : "");

  const demoButton = repo.urlDemo
    ? `<a class="ghc-btn ghc-btn--demo"
          href="${repo.urlDemo}" target="_blank" rel="noopener noreferrer"
          aria-label="Ver demo de ${name}">
         <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
           <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
           <polyline points="15 3 21 3 21 9"/>
           <line x1="10" y1="14" x2="21" y2="3"/>
         </svg>
         Demo
       </a>`
    : "";

  card.innerHTML = `
    <div class="ghc-behind" aria-hidden="true"></div>
    <div class="ghc-shell">
      <div class="ghc-shine" aria-hidden="true"></div>
      <div class="ghc-glare" aria-hidden="true"></div>
      <div class="ghc-img-wrap">
        <img class="ghc-img"
          src="${repo.imgUrl}" alt="Preview - ${name}"
          loading="lazy" decoding="async"
          onerror="this.closest('.ghc-img-wrap').classList.add('ghc-img--erro')"
        />
      </div>
      <div class="ghc-body">
        <h3 class="ghc-titulo">${name}</h3>
        <p class="ghc-desc">${repo.descricao}</p>
        <div class="ghc-tags" role="list">${tagsHtml}</div>
        <div class="ghc-acoes">
          <a class="ghc-btn ghc-btn--gh"
             href="${repo.urlGithub}" target="_blank" rel="noopener noreferrer"
             aria-label="Ver ${name} no GitHub">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </a>
          ${demoButton}
        </div>
      </div>
    </div>
  `;

  if (supportsHoverTilt()) {
    const shell = card.querySelector(".ghc-shell");
    const tilt = createTiltEngine(shell);

    shell.addEventListener("pointermove", tilt.onMove);
    shell.addEventListener("pointerenter", tilt.onEnter);
    shell.addEventListener("pointerleave", tilt.onLeave);

    cleanupBag.push(() => {
      shell.removeEventListener("pointermove", tilt.onMove);
      shell.removeEventListener("pointerenter", tilt.onEnter);
      shell.removeEventListener("pointerleave", tilt.onLeave);
      tilt.destroy();
    });
  }

  return card;
}

function bindDynamicShadows(carousel, track) {
  const sync = () => {
    const left = Math.round(track.scrollLeft);
    const hasOverflow = track.scrollWidth > track.clientWidth + 4;

    carousel.classList.toggle("shadow-left", left > 0 && hasOverflow);
    carousel.classList.toggle("shadow-right", left + track.clientWidth < track.scrollWidth - 2 && hasOverflow);
  };

  const onScroll = () => sync();
  track.addEventListener("scroll", onScroll, { passive: true });

  let resizeObserver = null;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => requestAnimationFrame(sync));
    resizeObserver.observe(track);
  } else {
    window.addEventListener("resize", sync, { passive: true });
  }

  requestAnimationFrame(() => {
    track.scrollLeft = 0;
    sync();
  });

  return () => {
    track.removeEventListener("scroll", onScroll);
    if (resizeObserver) {
      resizeObserver.disconnect();
    } else {
      window.removeEventListener("resize", sync);
    }
  };
}

function createCategoryRow(category, repos, cleanupBag) {
  const section = document.createElement("div");
  section.className = "ghc-row";

  const icon = CATEGORY_ICONS[category.id] ?? "";
  const hasNav = repos.length > 3;

  section.innerHTML = `
    <header class="ghc-row__header">
      <div class="ghc-row__meta">
        <span class="ghc-row__icon" aria-hidden="true">${icon}</span>
        <h3 class="ghc-row__titulo">${category.label}</h3>
        <span class="ghc-row__count">${repos.length} projeto${repos.length !== 1 ? "s" : ""}</span>
      </div>
      <div class="ghc-row__nav"${!hasNav ? " hidden" : ""}>
        <button class="ghc-nav-btn ghc-nav-btn--prev" aria-label="Anterior" type="button" disabled>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button class="ghc-nav-btn ghc-nav-btn--next" aria-label="Proximo" type="button">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </header>
    <div class="ghc-carousel" role="region" aria-label="Projetos de ${category.label}">
      <div class="ghc-track"></div>
    </div>
  `;

  const carousel = section.querySelector(".ghc-carousel");
  const track = section.querySelector(".ghc-track");

  repos.forEach((repo) => {
    track.appendChild(createProjectCard(repo, cleanupBag));
  });

  cleanupBag.push(bindDynamicShadows(carousel, track));

  if (hasNav) {
    const prev = section.querySelector(".ghc-nav-btn--prev");
    const next = section.querySelector(".ghc-nav-btn--next");

    const step = () => {
      const card = track.querySelector(".ghc-card");
      const gap = parseFloat(getComputedStyle(track).gap) || 20;
      return card ? card.offsetWidth + gap : 0;
    };

    const onPrev = () => track.scrollBy({ left: -step(), behavior: "smooth" });
    const onNext = () => track.scrollBy({ left: step(), behavior: "smooth" });
    const onTrackScroll = () => {
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };

    prev.addEventListener("click", onPrev);
    next.addEventListener("click", onNext);
    track.addEventListener("scroll", onTrackScroll, { passive: true });
    onTrackScroll();

    cleanupBag.push(() => {
      prev.removeEventListener("click", onPrev);
      next.removeEventListener("click", onNext);
      track.removeEventListener("scroll", onTrackScroll);
    });
  }

  return section;
}

function createState(type, message = "") {
  const el = document.createElement("div");
  el.className = "ghc-estado";

  if (type === "erro") {
    el.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>Nao foi possivel carregar os projetos.</p>
      <small>${message}</small>
    `;
    return el;
  }

  el.innerHTML = "<p>Nenhum projeto encontrado nesta categoria.</p>";
  return el;
}

export class CardsGithub {
  constructor({ container }) {
    this.container = container;
    this.cleanupHandlers = [];
  }

  limpar() {
    this.cleanupHandlers.forEach((cleanup) => cleanup());
    this.cleanupHandlers = [];
  }

  renderizarSkeleton() {
    this.container.innerHTML = "";
    this.container.className = "ghc-wrapper";

    CATEGORIES.forEach((category) => {
      const row = document.createElement("div");
      row.className = "ghc-row";
      row.innerHTML = `
        <header class="ghc-row__header">
          <div class="ghc-row__meta">
            <span class="ghc-row__icon" aria-hidden="true">${CATEGORY_ICONS[category.id] ?? ""}</span>
            <h3 class="ghc-row__titulo">${category.label}</h3>
          </div>
        </header>
        <div class="ghc-carousel"><div class="ghc-track"></div></div>
      `;

      const track = row.querySelector(".ghc-track");
      for (let index = 0; index < 3; index += 1) {
        track.appendChild(createSkeletonCard());
      }

      this.container.appendChild(row);
    });
  }

  async iniciar() {
    if (!this.container) return;

    this.limpar();
    this.renderizarSkeleton();

    try {
      const repositorios = await buscarRepositoriosPortfolio();
      this.container.innerHTML = "";

      let hasAnyProject = false;

      CATEGORIES.forEach((category) => {
        const reposDaCategoria = repositorios.filter((repo) => repo.categoria === category.id);
        if (!reposDaCategoria.length) return;

        hasAnyProject = true;
        this.container.appendChild(createCategoryRow(category, reposDaCategoria, this.cleanupHandlers));
      });

      if (!hasAnyProject) {
        this.container.appendChild(createState("vazio"));
      }
    } catch (error) {
      console.error("[CardsGithub]", error);
      this.container.innerHTML = "";
      this.container.appendChild(createState("erro", error.message));
    }
  }

  destruir() {
    this.limpar();
  }
}
