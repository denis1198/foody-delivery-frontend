# Foody Delivery — Front-end

Aplicação React para gestão de pedidos de delivery: login e cadastro, listagem de pedidos com o status
atual, criação de pedidos e atualização de status.

> Backend (API Java + Spring Boot): https://github.com/denis1198/foody-delivery-backend

**Stack:** React 19, TypeScript, Vite, React Router. Estilos em CSS próprio, sem biblioteca de UI.

## Como rodar

Pré-requisitos: **Node.js 20+** e a [API](https://github.com/denis1198/foody-delivery-backend) rodando
em http://localhost:8080.

```bash
npm install
npm run dev
```

Acesse http://localhost:5173 e crie uma conta em **Cadastre-se**.

Se a API estiver em outro endereço, copie `.env.example` para `.env` e ajuste `VITE_API_URL`.

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos e build de produção em `dist/` |
| `npm run lint` | Lint com oxlint |

## Funcionalidades

- Cadastro e login. O token JWT fica no `localStorage`, e a sessão é restaurada ao recarregar a página.
- Rotas protegidas: sem login, o usuário é levado para `/login` e, depois de entrar, volta para a página
  que tentou abrir.
- Lista de pedidos com o status atual, filtro por status com contadores, busca por ID e atualização
  automática a cada 15 segundos.
- Avanço e cancelamento de status. Só aparecem os botões das transições que a API informa em `nextStatuses`.
- Novo pedido com cliente, endereço e itens dinâmicos. O total é calculado enquanto se digita, e os erros
  de validação da API aparecem em cada campo.
- Página de detalhe do pedido (`/pedidos/:id`).
- Layout responsivo.

## Estrutura

```
src/
├── api/        # cliente HTTP, tipos e chamadas da API
├── auth/       # contexto de autenticação e rotas protegidas
├── components/ # layout, badge e ações de status
└── pages/      # login, cadastro, lista, novo pedido e detalhe
```
