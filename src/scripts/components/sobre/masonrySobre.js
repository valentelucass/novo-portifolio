/**
 * AUTOINTRO: src/scripts/components/sobre/masonrySobre.js
 * Objetivo: Organiza o bloco Sobre em layout tipo masonry e aplica comportamento responsivo associado.
 * Escopo: Define a responsabilidade completa deste modulo dentro da arquitetura do projeto.
 */
/**
 * MasonrySobre — Masonry layout em vanilla JS + GSAP
 * Animado ao entrar na viewport (IntersectionObserver + GSAP)
 */

// position: onde ancorar o background para não cortar rosto
// height: altura base (relativa a largura 600px — será escalonada)
const FOTOS = [
  { id: "f1", src: "./public/foto (1).jpeg", height: 450, position: "center center" }, // cartão na mão — close-up ok
  { id: "f2", src: "./public/foto (2).jpeg", height: 260, position: "center center" }, // palco/evento — landscape
  { id: "f3", src: "./public/foto (3).jpeg", height: 550, position: "center center" }, // setup computador — landscape
  { id: "f4", src: "./public/foto (4).jpeg", height: 270, position: "center center" }, // evento/multidão — landscape
  { id: "f5", src: "./public/foto (5).jpeg", height: 390, position: "top center" }, // dupla — landscape
  { id: "f6", src: "./public/foto (6).jpeg", height: 400, position: "top center" }, // trilho trem — landscape
  { id: "f7", src: "./public/foto (7).jpeg", height: 440, position: "top center" }, // grupo pessoas — landscape
  { id: "f8", src: "./public/foto (8).jpeg", height: 850, position: "top center" }, // homem oracle — landscape
  { id: "f9", src: "./public/foto (9).jpeg", height: 550, position: "center center" }, // homem computador — landscape
  { id: "f10", src: "./public/foto (10).jpeg", height: 860, position: "center center" }, // homem praia — landscape
  { id: "f11", src: "./public/foto (11).jpeg", height: 890, position: "top center" }, // homem frente computador — landscape
];

function getColumns() {
  const w = window.innerWidth;
  if (w >= 1200) return 4;
  if (w >= 860) return 3;
  if (w >= 520) return 2;
  return 2;
}

function buildGrid(items, columns, containerWidth) {
  const colHeights = new Array(columns).fill(0);
  const colWidth = containerWidth / columns;
  const GAP = 10;

  return items.map(item => {
    const col = colHeights.indexOf(Math.min(...colHeights));
    const x = colWidth * col;
    const h = item.height * (colWidth / 600); // proporção relativa a 600px de base
    const y = colHeights[col];
    colHeights[col] += h + GAP;
    return { ...item, x, y, w: colWidth, h, col };
  });
}

function totalGridHeight(grid) {
  if (!grid.length) return 0;
  return Math.max(...grid.map(i => i.y + i.h));
}

export class MasonrySobre {
  constructor({ gsap, container }) {
    this.gsap = gsap;
    this.container = container;
    this.listEl = null;
    this.grid = [];
    this.hasAnimated = false;
    this.ro = null;
    this.io = null;
  }

  iniciar() {
    this._renderEstrutura();
    this._calcularEDesenhar(true);
    this._registrarResize();
    this._registrarScroll();
  }

  _renderEstrutura() {
    this.container.innerHTML = `
      <div class="msb-list" aria-label="Galeria de fotos" role="list"></div>
    `;
    this.listEl = this.container.querySelector(".msb-list");

    FOTOS.forEach(foto => {
      const wrapper = document.createElement("div");
      wrapper.className = "msb-item";
      wrapper.dataset.key = foto.id;
      wrapper.setAttribute("role", "listitem");
      wrapper.style.cssText = "position:absolute;top:0;left:0;will-change:transform,opacity;";

      wrapper.innerHTML = `
        <div class="msb-item__img" style="background-image:url('${foto.src}'); background-position:${foto.position};" role="img" aria-label="Foto"></div>
      `;

      this.listEl.appendChild(wrapper);
    });
  }

  _calcularEDesenhar(primeiraVez = false) {
    const containerWidth = this.container.offsetWidth;
    if (!containerWidth) return;

    const columns = getColumns();
    this.grid = buildGrid(FOTOS, columns, containerWidth);
    const totalH = totalGridHeight(this.grid);

    this.listEl.style.height = totalH + "px";

    this.grid.forEach(item => {
      const el = this.listEl.querySelector(`[data-key="${item.id}"]`);
      if (!el) return;

      if (primeiraVez && !this.hasAnimated) {
        // Estado inicial — escondido abaixo
        this.gsap.set(el, {
          x: item.x,
          y: item.y + 60,
          width: item.w,
          height: item.h,
          opacity: 0,
          filter: "blur(8px)",
        });
      } else if (this.hasAnimated) {
        // Atualiza apenas posição/tamanho (resize)
        this.gsap.to(el, {
          x: item.x,
          y: item.y,
          width: item.w,
          height: item.h,
          duration: 0.55,
          ease: "power3.out",
          overwrite: "auto",
        });
      }
    });
  }

  _animarEntrada() {
    if (this.hasAnimated) return;
    this.hasAnimated = true;

    this.grid.forEach((item, i) => {
      const el = this.listEl.querySelector(`[data-key="${item.id}"]`);
      if (!el) return;

      this.gsap.to(el, {
        x: item.x,
        y: item.y,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.85,
        ease: "power3.out",
        delay: i * 0.055,
        overwrite: "auto",
      });
    });
  }

  _registrarResize() {
    this.ro = new ResizeObserver(() => {
      this._calcularEDesenhar(false);
    });
    this.ro.observe(this.container);
  }

  _registrarScroll() {
    this.io = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this._animarEntrada();
            this.io.disconnect();
          }
        });
      },
      { threshold: 0.08 }
    );
    this.io.observe(this.listEl);
  }

  destruir() {
    this.ro?.disconnect();
    this.io?.disconnect();
  }
}
