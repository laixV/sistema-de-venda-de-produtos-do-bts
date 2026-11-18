export function entrarComoAdministradora() {
  cy.env(["ADMIN", "SENHA_PADRAO"]).then(({ ADMIN, SENHA_PADRAO }) => {
    cy.get("#login-email").type(ADMIN);
    cy.get("#login-password").type(SENHA_PADRAO, { log: false });
    cy.get("#form-login button[type='submit']").click();
    cy.contains("h2", "Cadastrar produto").should("be.visible");
  });
}

export function cadastrarCliente(nome = "Cliente") {
  cy.contains("#view-auth button", "Criar conta").click();
  cy.get("#form-register").should("be.visible");
  return cy.env(["CLIENTE", "SENHA_PADRAO"]).then(({ CLIENTE, SENHA_PADRAO }) => {
    cy.get("#register-name").type(nome);
    cy.get("#register-email").type(CLIENTE);
    cy.get("#register-password").type(SENHA_PADRAO, { log: false });
    cy.get("#register-confirm").type(SENHA_PADRAO, { log: false });
    cy.get("#form-register button[type='submit']").click();
      cy.contains("h2", "Produtos").should("be.visible");
    return sair();
  });
}

export function sair() {
  cy.get("#sair").click();
  return cy.get("#form-login").should("be.visible");
}

export function entrarComoCliente() {
  return cy.env(["CLIENTE", "SENHA_PADRAO"]).then(({ CLIENTE, SENHA_PADRAO }) => {
    cy.get("#login-email").type(CLIENTE);
    cy.get("#login-password").type(SENHA_PADRAO, { log: false });
    cy.get("#login").click();
    return cy.contains("h2", "Produtos").should("be.visible");
  });
}
