import { cadastrarCliente, entrarComoAdministradora, entrarComoCliente } from "../support/acoes/acesso";
import { adicionarAoCarrinho, seguirParaCarrinho, seguirParaCompra } from "../support/acoes/cliente";
import { cadastrarCategoria } from "../support/acoes/categorias";
import {
  abrirProdutos,
  selecionarCategoriaAleatoria,
  preencherProduto,
  IMAGENS_PRODUTO
} from "../support/acoes/produtos";

describe('Logar na Loja Bangtan House', () => {
    beforeEach(function(){ 
        cy.visit('/index.html');

    });

    it('Cadastrar categoria e produto', function(){
        cy.on('uncaught:exception', (err, runnable) => {
            return false;
        });
        entrarComoAdministradora();
        cadastrarCategoria("Lightsticks");
        cadastrarCategoria("Album");
        cadastrarCategoria("Photocard");
        abrirProdutos();
        preencherProduto().then((nome) => {
          cy.get("#cadastrar-produto").click();
          cy.get("#produto-banner span").should("have.text", "Produto cadastrado.");
          cy.get("#sair-admin").click();
          cy.get("#form-login").should("be.visible");
          cadastrarCliente()
            .then(() => entrarComoCliente())
            .then(() => adicionarAoCarrinho(nome))
            .then((quantidade) => {
              seguirParaCarrinho(nome, quantidade);
              seguirParaCompra();
            });
        
        });

});
  

});
