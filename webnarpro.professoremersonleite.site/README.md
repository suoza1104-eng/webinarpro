# WebnarPRO

Plataforma de webinário automático (estilo Hotwebinar) para Professor Emerson Leite / 4E Treinamentos.

## Estrutura

```
public/          Frontend (index.html, css/, js/) — servido estaticamente pelo Express
server/          Backend Node.js + Express (API REST)
  src/
    app.js        Configuração do Express (middlewares, rotas, segurança)
    server.js     Ponto de entrada
    db.js         Pool de conexões MySQL
    logger.js     Logger (pino)
    routes/       Rotas da API
    middlewares/  Middlewares (autenticação JWT, etc.)
database/
  schema.sql      Schema MySQL completo (15 tabelas, multi-tenant por account_id)
```

## Rodando localmente

```bash
cd server
npm install
cp .env.example .env   # preencher DATABASE_URL, JWT_SECRET, credenciais Bunny, etc.
npm run dev
```

A API sobe em `http://localhost:3000`, servindo também o frontend estático em `/`.

## Deploy (cPanel — Setup Node.js App)

Esta pasta é o Document Root do subdomínio `webnarpro.professoremersonleite.site`.
Configure o app Node no cPanel apontando para `server/src/server.js` como arquivo de
inicialização, e preencha as variáveis de ambiente do `.env.example` na interface do
"Setup Node.js App".

## Estado do projeto

Implementado até agora:
- Schema completo do banco (15 tabelas)
- Autenticação (login com JWT + refresh token em cookie httpOnly)
- CRUD de Webinars (etapas 1, 2 e 8 do wizard) + publicação (etapa 12)
- Endpoint público de leitura da sala (etapa 7a)

Pendente (ver especificação técnica completa nas conversas do projeto):
- Login-config, Offer-config, Chat, Vendas, Chatbot (etapas 3, 5, 6, 7, 10)
- Integração com Bunny Stream (upload e reprodução de vídeo — etapa 4)
- Registro de leads, sala pública completa, chat por palavra-chave, heartbeat
- Telas de Vídeos, Salas de Atendimento, Histórico, Usuários, Configurações, Meu Plano
