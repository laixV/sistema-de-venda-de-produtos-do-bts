const QUANTIDADE_MAXIMA = 5;

export function adicionarAoCarrinho(nome) {
  const quantidade = Math.floor(Math.random() * QUANTIDADE_MAXIMA) + 1;
  const card = () => cy.contains("#vitrine-lista .vitrine-card", nome);

  for (let vez = 1; vez < quantidade; vez += 1) {
    card().find("button[aria-label^='Aumentar quantidade']").click();
  }

  card().contains("button", `Adicionar ${quantidade} ao carrinho`).click();
  return card()
    .contains(".add-feedback", `No carrinho: ${quantidade}`)
    .should("be.visible")
    .then(() => quantidade);
}

export function seguirParaCarrinho(nome, quantidade) {
  cy.get("button[data-shop='carrinho']").click();
  cy.contains("h2", "Carrinho").should("be.visible");
  cy.contains("#lista-carrinho .cart-item", nome)
    .find(".qty span")
    .should("have.text", String(quantidade));
}

export function seguirParaCompra() {
  cy.get("#seguir-compra").should("be.visible").click();
  cy.get("#carrinho-aviso").should("be.visible");
  cy.get("#carrinho-aviso span").should(
    "have.text",
    "Pedido criado. O código Pix abaixo expira em 15 minutos."
  );
  cy.get("#pix-code").should("be.visible");
}
