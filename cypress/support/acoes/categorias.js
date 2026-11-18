export function abrirCategorias() {
  cy.contains("button", "Cadastro de categorias").click();
  cy.contains("h2", "Cadastrar categoria").should("be.visible");
}

export function cadastrarCategoria(nome) {
  const salvo = nome.trim().replace(/\s+/g, " ");
  abrirCategorias();
  cy.get("#categoria-nome").clear().type(nome);
  cy.get("#form-categoria button[type='submit']").click();
  cy.get("#categoria-banner span").should("have.text", "Categoria cadastrada.");
  cy.get("#lista-categorias").should("contain", salvo);
}
