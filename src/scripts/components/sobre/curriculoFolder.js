/**
 * AUTOINTRO: src/scripts/components/sobre/curriculoFolder.js
 * Objetivo: Componente de CTA para download/abertura do curriculo na secao Sobre.
 * Escopo: Define a responsabilidade completa deste modulo dentro da arquitetura do projeto.
 */
function criarEstrutura({ downloadHref, downloadFileName }) {
  return `
    <a
      class="cvf-button"
      href="${downloadHref}"
      download="${downloadFileName}"
      aria-label="Baixar curriculo em PDF"
    >
      <span class="cvf-button__copy">
        <strong class="cvf-button__label">Baixar curriculo</strong>
        <span class="cvf-button__meta">PDF</span>
      </span>
      <span class="cvf-button__icon" aria-hidden="true">-></span>
    </a>
  `;
}

export class CurriculoFolder {
  constructor({
    container,
    downloadHref = "./public/curriculo-lucas-andrade.pdf",
    downloadFileName = "curriculo-lucas-andrade.pdf",
  }) {
    this.container = container;
    this.downloadHref = downloadHref;
    this.downloadFileName = downloadFileName;
  }

  iniciar() {
    if (!this.container) return;

    this.container.classList.add("cvf-download");
    this.container.innerHTML = criarEstrutura({
      downloadHref: this.downloadHref,
      downloadFileName: this.downloadFileName,
    });
  }
}
