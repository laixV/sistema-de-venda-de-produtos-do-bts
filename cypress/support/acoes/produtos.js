export const IMAGENS_PRODUTO = [
  "fotos dos produtos/be essential.jpg",
  "fotos dos produtos/be deluxe.jpg"
];
export const VALORES_PRODUTO = Array.from({ length: 501 }, (_, indice) => 100 + indice);

export const ALBUNS_BTS = [
  "2 Cool 4 Skool",
  "O!RUL8,2?",
  "Skool Luv Affair",
  "Skool Luv Affair Special Addition",
  "Dark & Wild",
  "Wake Up",
  "The Most Beautiful Moment in Life, Pt. 1",
  "The Most Beautiful Moment in Life, Pt. 2",
  "The Most Beautiful Moment in Life: Young Forever",
  "Youth",
  "Wings",
  "You Never Walk Alone",
  "Love Yourself: Her",
  "Face Yourself",
  "Love Yourself: Tear",
  "Love Yourself: Answer",
  "Map of the Soul: Persona",
  "Map of the Soul: 7",
  "Map of the Soul: 7 ~ The Journey ~",
  "BE",
  "BTS, The Best",
  "Proof"
];

export const INTEGRANTES_BTS = ["RM", "Jin", "SUGA", "j-hope", "Jimin", "V", "Jungkook"];

export const LIGHTSTICKS_BTS = [
  "Army Bomb Ver. 1",
  "Army Bomb Ver. 2",
  "Army Bomb Ver. 3",
  "Army Bomb Special Edition",
  "Army Bomb Ver. 4"
];

function sortear(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function nomesDaCategoria(categoria) {
  const nome = categoria.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (nome.includes("lightstick")) return LIGHTSTICKS_BTS;
  if (nome.includes("photocard")) return INTEGRANTES_BTS;
  if (nome.includes("album")) return ALBUNS_BTS;
  return null;
}

export function abrirProdutos() {
  cy.contains("button", "Cadastro de produtos").click();
  cy.contains("h2", "Cadastrar produto").should("be.visible");
}

export function selecionarCategoriaAleatoria() {
  cy.get("#categoria-botao").click();
  return cy.get("#categoria-lista button").then(($botoes) => {
    const categorias = [...$botoes].filter((botao) => {
      const nome = botao.textContent;
      return nome !== "Selecione a categoria" && nome !== "Cadastre uma categoria primeiro";
    });
    expect(categorias.length, "categorias cadastradas").to.be.greaterThan(0);
    const escolhida = sortear(categorias);
    const nome = escolhida.textContent.trim();
    cy.wrap(escolhida).click();
    return cy.get("#categoria-rotulo").should("have.text", nome).then(() => nome);
  });
}

export function preencherProduto({ nome, descricao, imagem } = {}) {
  return selecionarCategoriaAleatoria().then((categoria) => {
    const grupo = nomesDaCategoria(categoria);
    const candidatos = grupo ? grupo.filter((item) => item.trim().length >= 2) : [];
    const escolhido = candidatos.length ? sortear(candidatos) : nome;
    if (escolhido) cy.get("#produto-nome").type(escolhido);
    const textoDescricao = grupo ? escolhido : descricao;
    if (textoDescricao) cy.get("#produto-descricao").type(textoDescricao);

    const reais = sortear(VALORES_PRODUTO);
    cy.get("#produto-valor").type(String(reais * 100));
    cy.get("#produto-valor").should(
      "have.value",
      reais.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    );
    const arquivo = imagem || sortear(IMAGENS_PRODUTO);
    cy.get("#produto-imagem").selectFile(arquivo, { force: true });
    cy.get("#produto-preview").should("be.visible");
    return cy.get("#produto-imagem-nome").should("contain", arquivo.split("/").pop()).then(() => escolhido);
  });
}
