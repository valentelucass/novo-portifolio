/**
 * AUTOINTRO: src/scripts/components/menu/menuEscalonado.js
 * Objetivo: Implementa o menu lateral animado, links de navegacao e interacoes de abertura/fechamento.
 * Escopo: Define a responsabilidade completa deste modulo dentro da arquitetura do projeto.
 */
function escaparHtml(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export class MenuEscalonado {
  constructor(opcoes = {}) {
    this.opcoes = {
      container: null,
      gsap: null,
      position: "right",
      colors: ["#B19EEF", "#5227FF"],
      items: [],
      socialItems: [],
      displaySocials: true,
      displayItemNumbering: true,
      logoUrl: "",
      logoTexto: "LV",
      menuButtonColor: "#ffffff",
      openMenuButtonColor: "#ffffff",
      accentColor: "#5227FF",
      changeMenuColorOnOpen: true,
      closeOnClickAway: true,
      onMenuOpen: null,
      onMenuClose: null,
      ...opcoes
    };

    this.gsap = this.opcoes.gsap || window.gsap || null;
    this.aberto = false;
    this.animando = false;
    this.ref = {};
    this.handlers = {};
  }

  iniciar() {
    if (!this.gsap) {
      throw new Error("GSAP nao carregado.");
    }

    if (!this.opcoes.container) {
      throw new Error("Container do MenuEscalonado nao informado.");
    }

    this.renderizar();
    this.mapearReferencias();
    this.configurarEstadoInicial();
    this.registrarEventos();
  }

  renderizar() {
    const {
      container,
      items,
      socialItems,
      displaySocials,
      displayItemNumbering,
      position,
      accentColor,
      logoUrl,
      logoTexto
    } = this.opcoes;

    const cores = this.definirCoresCamadas();
    const atributosLista = displayItemNumbering ? 'data-numbering="true"' : "";

    const itensMenu = items.length
      ? items
        .map(
          (item, indice) => `
              <li class="sm-panel-itemWrap">
                <a class="sm-panel-item" href="${escaparHtml(item.link || "#")}" aria-label="${escaparHtml(
            item.ariaLabel || item.label || "Item de menu"
          )}" data-index="${indice + 1}">
                  <span class="sm-panel-itemLabel">${escaparHtml(item.label || "Sem titulo")}</span>
                </a>
              </li>
            `
        )
        .join("")
      : `
        <li class="sm-panel-itemWrap">
          <span class="sm-panel-item">
            <span class="sm-panel-itemLabel">Sem itens</span>
          </span>
        </li>
      `;

    const blocoSociais =
      displaySocials && socialItems.length
        ? `
          <section class="sm-socials" aria-label="Links sociais">
            <h2 class="sm-socials-title">Sociais</h2>
            <ul class="sm-socials-list" role="list">
              ${socialItems
          .map(
            (item) => `
                    <li class="sm-socials-item">
                      <a href="${escaparHtml(item.link || "#")}" target="_blank" rel="noopener noreferrer" class="sm-socials-link">
                        ${escaparHtml(item.label || "Link social")}
                      </a>
                    </li>
                  `
          )
          .join("")}
            </ul>
          </section>
        `
        : "";

    const logo = logoUrl
      ? `<img src="${escaparHtml(logoUrl)}" alt="Logotipo" class="sm-logo-img" />`
      : `<span class="sm-logo-text">${escaparHtml(logoTexto)}</span>`;

    container.innerHTML = `
      <div class="staggered-menu-wrapper" data-position="${position}" style="--sm-accent: ${accentColor};">
        <div class="sm-prelayers" aria-hidden="true">
          ${cores.map((cor) => `<div class="sm-prelayer" style="background:${cor}"></div>`).join("")}
        </div>

        <header class="staggered-menu-header" aria-label="Cabecalho de navegacao">
          <div class="sm-logo" aria-label="Logo">
            ${logo}
          </div>

          <button class="sm-toggle" aria-label="Abrir menu" aria-expanded="false" type="button">
            <span class="sm-toggle-textWrap" aria-hidden="true">
              <span class="sm-toggle-textInner">
                <span class="sm-toggle-line">MENU</span>
                <span class="sm-toggle-line">FECHAR</span>
              </span>
            </span>
            <span class="sm-icon" aria-hidden="true">
              <span class="sm-icon-line"></span>
              <span class="sm-icon-line sm-icon-line-v"></span>
            </span>
          </button>
        </header>

        <aside class="staggered-menu-panel" aria-hidden="true">
          <div class="sm-panel-inner">
            <ul class="sm-panel-list" role="list" ${atributosLista}>
              ${itensMenu}
            </ul>
            ${blocoSociais}
          </div>
        </aside>
      </div>
    `;
  }

  definirCoresCamadas() {
    const lista = this.opcoes.colors && this.opcoes.colors.length ? [...this.opcoes.colors] : ["#1e1e22", "#35353c"];
    const limite = lista.slice(0, 4);

    if (limite.length >= 3) {
      const meio = Math.floor(limite.length / 2);
      limite.splice(meio, 1);
    }

    return limite;
  }

  mapearReferencias() {
    const raiz = this.opcoes.container.querySelector(".staggered-menu-wrapper");
    this.ref = {
      raiz,
      preLayers: [...raiz.querySelectorAll(".sm-prelayer")],
      painel: raiz.querySelector(".staggered-menu-panel"),
      botao: raiz.querySelector(".sm-toggle"),
      textoBotao: raiz.querySelector(".sm-toggle-textInner"),
      icone: raiz.querySelector(".sm-icon"),
      itensRotulo: [...raiz.querySelectorAll(".sm-panel-itemLabel")],
      itensNumerados: [...raiz.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item")],
      tituloSociais: raiz.querySelector(".sm-socials-title"),
      linksSociais: [...raiz.querySelectorAll(".sm-socials-link")],
      linksMenu: [...raiz.querySelectorAll(".sm-panel-item[href]")]
    };
  }

  configurarEstadoInicial() {
    const { gsap } = this;
    const deslocamento = this.opcoes.position === "left" ? -100 : 100;

    gsap.set([this.ref.painel, ...this.ref.preLayers], { xPercent: deslocamento });
    gsap.set(this.ref.icone, { rotate: 0, transformOrigin: "50% 50%" });
    gsap.set(this.ref.textoBotao, { yPercent: 0 });
    gsap.set(this.ref.itensRotulo, { yPercent: 130, rotate: 8, opacity: 0 });

    if (this.ref.itensNumerados.length) {
      gsap.set(this.ref.itensNumerados, { "--sm-num-opacity": 0 });
    }

    if (this.ref.tituloSociais) {
      gsap.set(this.ref.tituloSociais, { opacity: 0 });
    }

    if (this.ref.linksSociais.length) {
      gsap.set(this.ref.linksSociais, { y: 24, opacity: 0 });
    }

    this.aplicarCorBotao(false);
  }

  registrarEventos() {
    this.handlers.onToggle = () => {
      this.toggle();
    };

    this.ref.botao.addEventListener("click", this.handlers.onToggle);

    this.handlers.onCliqueFora = (evento) => {
      if (!this.opcoes.closeOnClickAway || !this.aberto) {
        return;
      }

      if (!this.ref.raiz.contains(evento.target)) {
        this.fechar();
      }
    };

    document.addEventListener("mousedown", this.handlers.onCliqueFora);

    this.handlers.onEsc = (evento) => {
      if (evento.key === "Escape" && this.aberto) {
        this.fechar();
      }
    };

    document.addEventListener("keydown", this.handlers.onEsc);

    this.handlers.onCliqueLink = () => {
      this.fechar();
    };

    this.ref.linksMenu.forEach((link) => {
      link.addEventListener("click", this.handlers.onCliqueLink);
    });
  }

  toggle() {
    if (this.aberto) {
      this.fechar();
      return;
    }

    this.abrir();
  }

  abrir() {
    if (this.animando || this.aberto) {
      return;
    }

    this.aberto = true;
    this.animando = true;
    this.ref.raiz.dataset.open = "true";
    this.ref.botao.setAttribute("aria-expanded", "true");
    this.ref.botao.setAttribute("aria-label", "Fechar menu");
    this.ref.painel.setAttribute("aria-hidden", "false");

    if (typeof this.opcoes.onMenuOpen === "function") {
      this.opcoes.onMenuOpen();
    }

    this.animarIcone(true);
    this.animarTextoBotao(true);
    this.aplicarCorBotao(true);
    this.animarAbertura();
  }

  fechar() {
    if (this.animando || !this.aberto) {
      return;
    }

    this.aberto = false;
    this.animando = true;
    delete this.ref.raiz.dataset.open;
    this.ref.botao.setAttribute("aria-expanded", "false");
    this.ref.botao.setAttribute("aria-label", "Abrir menu");
    this.ref.painel.setAttribute("aria-hidden", "true");

    if (typeof this.opcoes.onMenuClose === "function") {
      this.opcoes.onMenuClose();
    }

    this.animarIcone(false);
    this.animarTextoBotao(false);
    this.aplicarCorBotao(false);
    this.animarFechamento();
  }

  animarAbertura() {
    const { gsap } = this;
    const layers = this.ref.preLayers;
    const painel = this.ref.painel;
    const linhaBase = layers.length ? layers.length * 0.07 : 0;

    const timeline = gsap.timeline({
      onComplete: () => {
        this.animando = false;
      }
    });

    layers.forEach((layer, indice) => {
      timeline.to(
        layer,
        {
          xPercent: 0,
          duration: 0.5,
          ease: "power4.out"
        },
        indice * 0.07
      );
    });

    timeline.to(
      painel,
      {
        xPercent: 0,
        duration: 0.64,
        ease: "power4.out"
      },
      linhaBase
    );

    if (this.ref.itensRotulo.length) {
      timeline.to(
        this.ref.itensRotulo,
        {
          yPercent: 0,
          rotate: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power4.out",
          stagger: { each: 0.1, from: "start" }
        },
        linhaBase + 0.12
      );
    }

    if (this.ref.itensNumerados.length) {
      timeline.to(
        this.ref.itensNumerados,
        {
          "--sm-num-opacity": 1,
          duration: 0.58,
          ease: "power2.out",
          stagger: { each: 0.08, from: "start" }
        },
        linhaBase + 0.22
      );
    }

    if (this.ref.tituloSociais) {
      timeline.to(
        this.ref.tituloSociais,
        {
          opacity: 1,
          duration: 0.46,
          ease: "power2.out"
        },
        linhaBase + 0.3
      );
    }

    if (this.ref.linksSociais.length) {
      timeline.to(
        this.ref.linksSociais,
        {
          y: 0,
          opacity: 1,
          duration: 0.52,
          ease: "power3.out",
          stagger: { each: 0.08, from: "start" }
        },
        linhaBase + 0.34
      );
    }
  }

  animarFechamento() {
    const { gsap } = this;
    const deslocamento = this.opcoes.position === "left" ? -100 : 100;

    gsap.to([this.ref.painel, ...this.ref.preLayers], {
      xPercent: deslocamento,
      duration: 0.34,
      ease: "power3.in",
      overwrite: "auto",
      onComplete: () => {
        gsap.set(this.ref.itensRotulo, { yPercent: 130, rotate: 8, opacity: 0 });

        if (this.ref.itensNumerados.length) {
          gsap.set(this.ref.itensNumerados, { "--sm-num-opacity": 0 });
        }

        if (this.ref.tituloSociais) {
          gsap.set(this.ref.tituloSociais, { opacity: 0 });
        }

        if (this.ref.linksSociais.length) {
          gsap.set(this.ref.linksSociais, { y: 24, opacity: 0 });
        }

        this.animando = false;
      }
    });
  }

  animarIcone(abrindo) {
    this.gsap.to(this.ref.icone, {
      rotate: abrindo ? 225 : 0,
      duration: abrindo ? 0.8 : 0.34,
      ease: abrindo ? "power4.out" : "power3.inOut",
      overwrite: "auto"
    });
  }

  animarTextoBotao(abrindo) {
    this.gsap.to(this.ref.textoBotao, {
      yPercent: abrindo ? -50 : 0,
      duration: 0.42,
      ease: "power3.out",
      overwrite: "auto"
    });
  }

  aplicarCorBotao(abrindo) {
    const { menuButtonColor, openMenuButtonColor, changeMenuColorOnOpen } = this.opcoes;
    const cor = changeMenuColorOnOpen
      ? abrindo
        ? openMenuButtonColor
        : menuButtonColor
      : menuButtonColor;

    this.gsap.to(this.ref.botao, {
      color: cor,
      duration: 0.28,
      ease: "power2.out",
      overwrite: "auto"
    });
  }

  destruir() {
    if (this.ref.botao && this.handlers.onToggle) {
      this.ref.botao.removeEventListener("click", this.handlers.onToggle);
    }

    if (this.handlers.onCliqueFora) {
      document.removeEventListener("mousedown", this.handlers.onCliqueFora);
    }

    if (this.handlers.onEsc) {
      document.removeEventListener("keydown", this.handlers.onEsc);
    }

    if (this.handlers.onCliqueLink && this.ref.linksMenu?.length) {
      this.ref.linksMenu.forEach((link) => {
        link.removeEventListener("click", this.handlers.onCliqueLink);
      });
    }

    this.ref = {};
    this.handlers = {};
    this.aberto = false;
    this.animando = false;
  }
}

export default MenuEscalonado;
