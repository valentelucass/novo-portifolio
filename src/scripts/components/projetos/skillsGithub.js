/**
 * AUTOINTRO: src/scripts/components/projetos/skillsGithub.js
 * Objetivo: Renderiza a grade de skills com spans dinamicos, interacoes e preenchimento inteligente da largura das linhas.
 * Escopo: Define a responsabilidade completa deste modulo dentro da arquitetura do projeto.
 */
import { buscarHabilidadesGithub } from "../../services/github/habilidadesGithub.js";

const FORMATTER_PERCENTUAL = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const LIMITE_SKILLS = 18;
const SKEL_COUNT = 10;
const ROW_SPAN_UNIFORME = 7;
const TITULO_LEN_MIN = 3;
const TITULO_LEN_MAX = 11;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function calcularProporcaoTitulo(nomeSkill) {
  const nome = String(nomeSkill || "").replace(/\s+/g, "");
  const tamanhoTitulo = clamp(nome.length, TITULO_LEN_MIN, TITULO_LEN_MAX);
  return (tamanhoTitulo - TITULO_LEN_MIN) / (TITULO_LEN_MAX - TITULO_LEN_MIN);
}

function calcularSpanPorTitulo(nomeSkill, spanMinimo, spanMaximo) {
  const proporcao = calcularProporcaoTitulo(nomeSkill);
  const span = Math.round(spanMinimo + proporcao * (spanMaximo - spanMinimo));
  return clamp(span, spanMinimo, spanMaximo);
}

function preencherLacunasDireita(spansBase, totalColunas) {
  const spansAjustados = spansBase.map((span) => clamp(Number(span) || 1, 1, totalColunas));
  let inicioLinha = 0;
  let ultimoIndiceLinha = -1;
  let somaLinha = 0;

  for (let indice = 0; indice < spansAjustados.length; indice += 1) {
    const spanAtual = spansAjustados[indice];
    const ultrapassaLinha = somaLinha + spanAtual > totalColunas;

    if (ultrapassaLinha) {
      if (ultimoIndiceLinha >= inicioLinha) {
        const espacoRestante = totalColunas - somaLinha;
        spansAjustados[ultimoIndiceLinha] = clamp(
          spansAjustados[ultimoIndiceLinha] + espacoRestante,
          1,
          totalColunas
        );
      }
      inicioLinha = indice;
      ultimoIndiceLinha = -1;
      somaLinha = 0;
    }

    somaLinha += spansAjustados[indice];
    ultimoIndiceLinha = indice;

    if (somaLinha === totalColunas) {
      inicioLinha = indice + 1;
      ultimoIndiceLinha = -1;
      somaLinha = 0;
    }
  }

  if (somaLinha > 0 && ultimoIndiceLinha >= inicioLinha) {
    const espacoRestante = totalColunas - somaLinha;
    spansAjustados[ultimoIndiceLinha] = clamp(
      spansAjustados[ultimoIndiceLinha] + espacoRestante,
      1,
      totalColunas
    );
  }

  return spansAjustados;
}

function aplicarSpansBalanceados(lista) {
  const itens = [...lista.querySelectorAll(".ghs-item:not(.ghs-item--skeleton)")];
  if (!itens.length) return;

  const spansDesktopBase = itens.map(
    (item) => Number(item.dataset.spanDesktopBase) || 2
  );
  const spansTabletBase = itens.map(
    (item) => Number(item.dataset.spanTabletBase) || 2
  );
  const spansMobileBase = itens.map(
    (item) => Number(item.dataset.spanMobileBase) || 2
  );

  const spansDesktopAjustados = preencherLacunasDireita(spansDesktopBase, 12);
  const spansTabletAjustados = preencherLacunasDireita(spansTabletBase, 8);
  const spansMobileAjustados = preencherLacunasDireita(spansMobileBase, 4);

  itens.forEach((item, indice) => {
    item.style.setProperty("--ghs-col-span", String(spansDesktopAjustados[indice]));
    item.style.setProperty(
      "--ghs-col-span-tablet",
      String(spansTabletAjustados[indice])
    );
    item.style.setProperty(
      "--ghs-col-span-mobile",
      String(spansMobileAjustados[indice])
    );
  });
}

function calcularPesoVisual(skill) {
  const percentual = Number(skill.percentual) || 0;
  const colSpanDesktop = calcularSpanPorTitulo(skill.nome, 2, 3);
  const colSpanTablet = calcularSpanPorTitulo(skill.nome, 2, 4);
  const colSpanMobile = 2;
  const destaque = colSpanDesktop >= 3;
  const intensidade = clamp(0.22 + percentual / 130, 0.24, 0.54);

  return {
    destaque,
    colSpanDesktop,
    rowSpanDesktop: ROW_SPAN_UNIFORME,
    colSpanTablet,
    rowSpanTablet: ROW_SPAN_UNIFORME,
    colSpanMobile,
    rowSpanMobile: ROW_SPAN_UNIFORME,
    intensidade,
  };
}

function criarSkeletonItem(indice) {
  const destaque = indice % 3 === 1;

  const item = document.createElement("li");
  item.className = "ghs-item ghs-item--skeleton";
  item.style.setProperty("--ghs-col-span", destaque ? "3" : "2");
  item.style.setProperty("--ghs-row-span", String(ROW_SPAN_UNIFORME));
  item.style.setProperty("--ghs-col-span-tablet", destaque ? "4" : "2");
  item.style.setProperty("--ghs-row-span-tablet", String(ROW_SPAN_UNIFORME));
  item.style.setProperty("--ghs-col-span-mobile", "2");
  item.style.setProperty("--ghs-row-span-mobile", String(ROW_SPAN_UNIFORME));
  item.innerHTML = `
    <div class="ghs-item__core">
      <span class="ghs-skel ghs-skel--name"></span>
      <span class="ghs-skel ghs-skel--pct"></span>
    </div>
  `;
  return item;
}

function renderizarCarregando(container) {
  const lista = document.createElement("ul");
  lista.className = "ghs-list";

  for (let i = 0; i < SKEL_COUNT; i += 1) {
    lista.appendChild(criarSkeletonItem(i));
  }

  container.classList.remove("is-ready");
  container.innerHTML = "";
  container.appendChild(lista);
}

function renderizarEstado(container, mensagem, tipo = "vazio") {
  container.classList.remove("is-ready");
  container.innerHTML = "";

  const estado = document.createElement("div");
  estado.className = `ghs-state ghs-state--${tipo}`;
  estado.textContent = mensagem;
  container.appendChild(estado);
}

function criarItemSkill(skill, indice) {
  const pesoVisual = calcularPesoVisual(skill);
  const item = document.createElement("li");
  item.className = `ghs-item ${pesoVisual.destaque ? "is-featured" : ""}`.trim();
  item.style.setProperty("--ghs-color", skill.cor);
  item.style.setProperty("--ghs-delay", `${indice * 36}ms`);
  item.style.setProperty("--ghs-col-span", String(pesoVisual.colSpanDesktop));
  item.style.setProperty("--ghs-row-span", String(pesoVisual.rowSpanDesktop));
  item.style.setProperty("--ghs-col-span-tablet", String(pesoVisual.colSpanTablet));
  item.style.setProperty("--ghs-row-span-tablet", String(pesoVisual.rowSpanTablet));
  item.style.setProperty("--ghs-col-span-mobile", String(pesoVisual.colSpanMobile));
  item.style.setProperty("--ghs-row-span-mobile", String(pesoVisual.rowSpanMobile));
  item.dataset.spanDesktopBase = String(pesoVisual.colSpanDesktop);
  item.dataset.spanTabletBase = String(pesoVisual.colSpanTablet);
  item.dataset.spanMobileBase = String(pesoVisual.colSpanMobile);
  item.style.setProperty("--ghs-intensity", pesoVisual.intensidade.toFixed(3));
  item.style.setProperty(
    "--ghs-fill-target",
    String(Math.max(4, Math.min(100, skill.percentual)))
  );
  item.tabIndex = 0;
  item.setAttribute("role", "button");

  const porcentagemTexto = `${FORMATTER_PERCENTUAL.format(skill.percentual)}%`;
  item.setAttribute("aria-label", `${skill.nome}: ${porcentagemTexto}`);

  item.innerHTML = `
    <div class="ghs-item__core">
      <span class="ghs-name">${skill.nome}</span>
      <div class="ghs-orb" role="presentation" aria-hidden="true">
        <span class="ghs-orb-fill"></span>
        <span class="ghs-orb-wave"></span>
        <span class="ghs-orb-gloss"></span>
        <span class="ghs-orb-value">${porcentagemTexto}</span>
      </div>
    </div>
  `;

  return item;
}

function registrarInteracoes(lista) {
  const itens = [...lista.querySelectorAll(".ghs-item:not(.ghs-item--skeleton)")];
  if (!itens.length) return () => {};

  const fecharTodos = (exceto = null) => {
    itens.forEach((item) => {
      if (item !== exceto) item.classList.remove("is-open");
    });
  };

  const removers = [];

  itens.forEach((item) => {
    const onClick = () => {
      const estavaAberto = item.classList.contains("is-open");
      fecharTodos(item);
      item.classList.toggle("is-open", !estavaAberto);
    };

    const onKeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        item.click();
      }
      if (event.key === "Escape") {
        item.classList.remove("is-open");
      }
    };

    const onPointerLeave = () => {
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        item.classList.remove("is-open");
      }
    };

    const onBlur = () => {
      if (!item.matches(":hover")) item.classList.remove("is-open");
    };

    item.addEventListener("click", onClick);
    item.addEventListener("keydown", onKeydown);
    item.addEventListener("pointerleave", onPointerLeave);
    item.addEventListener("blur", onBlur);

    removers.push(() => {
      item.removeEventListener("click", onClick);
      item.removeEventListener("keydown", onKeydown);
      item.removeEventListener("pointerleave", onPointerLeave);
      item.removeEventListener("blur", onBlur);
    });
  });

  const onPointerDown = (event) => {
    if (!lista.contains(event.target)) fecharTodos();
  };

  document.addEventListener("pointerdown", onPointerDown);
  removers.push(() => document.removeEventListener("pointerdown", onPointerDown));

  return () => {
    removers.forEach((remove) => remove());
  };
}

function renderizarSkills(container, skills) {
  const lista = document.createElement("ul");
  lista.className = "ghs-list";

  skills.forEach((skill, indice) => {
    lista.appendChild(criarItemSkill(skill, indice));
  });

  aplicarSpansBalanceados(lista);

  container.classList.remove("is-ready");
  container.innerHTML = "";
  container.appendChild(lista);

  const cleanupInteracoes = registrarInteracoes(lista);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      container.classList.add("is-ready");
    });
  });

  return cleanupInteracoes;
}

export class SkillsGithub {
  constructor({ container }) {
    this.container = container;
    this.cleanupInteracoes = null;
  }

  async iniciar() {
    if (!this.container) return;

    if (typeof this.cleanupInteracoes === "function") {
      this.cleanupInteracoes();
      this.cleanupInteracoes = null;
    }

    this.container.classList.add("ghs-wrapper");
    renderizarCarregando(this.container);

    try {
      const skills = await buscarHabilidadesGithub();
      const skillsVisiveis = skills.slice(0, LIMITE_SKILLS);

      if (!skillsVisiveis.length) {
        renderizarEstado(this.container, "Nenhuma skill encontrada no GitHub.");
        return;
      }

      this.cleanupInteracoes = renderizarSkills(this.container, skillsVisiveis);
    } catch (erro) {
      console.error("[SkillsGithub]", erro);
      renderizarEstado(
        this.container,
        "Nao foi possivel carregar as skills agora.",
        "erro"
      );
    }
  }

  destruir() {
    if (typeof this.cleanupInteracoes === "function") {
      this.cleanupInteracoes();
      this.cleanupInteracoes = null;
    }
  }
}
