# Foody Delivery — Front-end

Aplicação React de um marketplace de delivery estilo iFood, com uma área para **clientes** e um **painel para
restaurantes**.

> Backend (API Java + Spring Boot): https://github.com/denis1198/foody-delivery-backend

**Stack:** React 19, TypeScript, Vite, React Router, Tailwind CSS v4, Recharts e lucide-react.

## Como rodar

Pré-requisitos: **Node.js 20+** e a [API](https://github.com/denis1198/foody-delivery-backend) em
http://localhost:8080.

```bash
npm install
npm run dev
```

Acesse http://localhost:5173 e use os atalhos **Cliente** ou **Restaurante** da tela de login
(`cliente@foody.com` / `vendedor@foody.com`, senha `demo123`).
Para outra URL da API, copie `.env.example` para `.env` e ajuste `VITE_API_URL`.

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos e build de produção |
| `npm run lint` | oxlint |

## Área do cliente

- **Vitrine**: busca, categorias e restaurantes fechados sinalizados.
- **Cardápio** por categoria, com modal de item (quantidade e observação).
- **Carrinho** de um restaurante por vez, salvo no navegador; painel lateral no desktop e barra fixa no celular.
- **Checkout** com endereço (lembra o último), Pix, cartão ou dinheiro.
- **Meus pedidos** e acompanhamento com linha do tempo atualizada a cada 10s; cancelamento enquanto o
  restaurante não aceitou.

## Painel do restaurante (`/painel`)

O vendedor é redirecionado para cá ao entrar. Layout com sidebar recolhível (tab bar no celular) e botão para
abrir/fechar a loja.

- **Dashboard**, no padrão do Marketplace Manager: filtro de período; cards de faturamento, líquido, lucro bruto,
  margem, vendas, itens, ticket médio e cancelamentos com variação contra o período anterior e popover
  "Como calculamos"; resumo de receitas (com visão em tabela), picos de movimentação por hora, desempenho por dia
  da semana, dias mais fracos com leitura automática, top 15 produtos com lucro/margem e pedidos por status.
- **Pedidos**: quadro por status atualizado a cada 10s, com destaque para pedidos novos e alerta de espera.
- **Cardápio**: categorias e produtos, disponibilidade em um clique e **simulação de margem ao vivo**
  (comissão, taxa de pagamento, imposto e custo) com alerta de margem baixa.
- **Configurações**: perfil, entrega e percentuais usados nas métricas.

Tema claro/escuro em todas as telas. A paleta dos gráficos foi validada para daltonismo nos dois temas, e a
dashboard é carregada sob demanda (clientes não baixam o Recharts).

## Estrutura

```
src/
├── api/          # cliente HTTP, tipos e chamadas (cliente e vendedor)
├── auth/         # sessão, rotas protegidas por papel
├── cart/         # carrinho
├── components/   # UI compartilhada e componentes da dashboard
├── layouts/      # layout do cliente e do painel
├── pages/        # auth/, customer/, seller/
├── theme/        # tema claro/escuro
└── utils/        # períodos e cálculo de margem
```
