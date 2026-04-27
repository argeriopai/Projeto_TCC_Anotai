# 🚗 ANOTAÍ — Aplicativo de Registro de Manutenções Veiculares

> **TCC — Sistemas para Internet | Centro Universitário META | 2026**
> Equipe: "SEMPRE CABE MAIS UM" — Sheina Lima, Germano Balieiro e Argério Queiroz

---

## 🏗️ Estrutura do Monorepo

```
anotai/
├── apps/
│   ├── api/                  ← Backend (Node.js + Fastify + Prisma)
│   │   ├── prisma/
│   │   │   └── schema.prisma ← Modelos do banco de dados
│   │   └── src/
│   │       ├── server.ts     ← Servidor principal
│   │       ├── lib/
│   │       │   └── prisma.ts ← Instância do Prisma (Singleton)
│   │       ├── middlewares/
│   │       │   └── auth.middleware.ts
│   │       └── routes/
│   │           ├── auth.routes.ts        ← Login e Cadastro
│   │           ├── proprietario.routes.ts
│   │           ├── veiculo.routes.ts
│   │           ├── manutencao.routes.ts
│   │           └── anexo.routes.ts       ← Upload de fotos
│   │
│   └── mobile/               ← App React Native (Expo)
│       ├── App.tsx           ← Ponto de entrada
│       └── src/
│           ├── constants/
│           │   └── cores.ts  ← Paleta de cores e tema
│           ├── contexts/
│           │   └── AuthContext.tsx  ← Estado global de autenticação
│           ├── navigation/
│           │   └── Navigation.tsx   ← Rotas do app
│           ├── screens/
│           │   ├── auth/
│           │   │   ├── TelaLogin.tsx
│           │   │   └── TelaCadastro.tsx
│           │   └── app/
│           │       ├── TelaHome.tsx
│           │       └── TelasPlaceholder.tsx
│           └── services/
│               └── api.service.ts  ← Cliente HTTP (Axios)
│
├── docker-compose.yml        ← PostgreSQL + Redis
├── .env.example              ← Modelo de variáveis de ambiente
└── package.json              ← Raiz do monorepo (Yarn Workspaces)
```

---

## ⚡ Como rodar o projeto do zero

### Pré-requisitos

| Ferramenta      | Versão mínima | Download |
|-----------------|---------------|----------|
| Node.js         | v22+          | https://nodejs.org |
| Yarn            | v1.22+        | `npm install -g yarn` |
| Docker Desktop  | v29+          | https://docker.com |
| Expo CLI        | latest        | `npm install -g expo-cli` |
| VS Code         | latest        | https://code.visualstudio.com |

---

### 🚀 Passo a Passo Completo

#### 1. Clonar e instalar dependências

```bash
# Instalar todas as dependências do monorepo (API + Mobile + Shared)
yarn install
```

#### 2. Configurar variáveis de ambiente

```bash
# Copiar o arquivo de exemplo
cp .env.example apps/api/.env

# Gerar uma JWT_SECRET segura (rodar no terminal)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Colar a chave gerada no campo JWT_SECRET dentro de apps/api/.env
```

#### 3. Subir o banco de dados PostgreSQL com Docker

```bash
# Inicia o PostgreSQL e o Redis em background
docker compose up -d

# Verificar se estão rodando (deve aparecer "healthy")
docker compose ps
```

#### 4. Criar as tabelas no banco de dados

```bash
# Gera o cliente Prisma + cria todas as tabelas
yarn db:migrate

# Quando perguntar o nome da migration, digite:
# sprint1_estrutura_inicial
```

#### 5. Iniciar a API (Backend)

```bash
# Terminal 1 — Inicia a API com hot-reload
yarn dev:api

# ✅ Deve aparecer: "ANOTAÍ API rodando em http://0.0.0.0:3333"
```

#### 6. Testar se a API está funcionando

```bash
# Em outro terminal — deve retornar {"status":"ok","app":"ANOTAÍ API"}
curl http://localhost:3333/health
```

#### 7. Iniciar o App Mobile

```bash
# Terminal 2
yarn dev:mobile

# Ou entre na pasta e rode:
cd apps/mobile && npx expo start

# Opções:
# [a] → Abrir no emulador Android
# [i] → Abrir no simulador iOS
# [w] → Abrir no navegador (web)
# Escaneie o QR Code com o app Expo Go no seu celular
```

---

## 🛠️ Comandos úteis do dia a dia

```bash
# Ver o banco de dados visualmente (Prisma Studio)
yarn db:studio
# Abre em http://localhost:5555

# Recriar as tabelas do zero (apaga tudo!)
yarn workspace @anotai/api prisma migrate reset

# Parar os containers Docker
yarn docker:down

# Ver logs da API em tempo real
docker compose logs -f

# Verificar se o banco está saudável
docker exec anotai_postgres pg_isready -U anotai_user
```

---

## 📋 Sprint 1 — Checklist de entregáveis

- [x] Estrutura do monorepo configurada
- [x] `docker-compose.yml` com PostgreSQL e Redis
- [x] `schema.prisma` com todos os modelos:
  - [x] `Proprietario` (usuário/dono do veículo)
  - [x] `Veiculo` (múltiplos veículos por usuário)
  - [x] `Manutencao` (registro central)
  - [x] `Servico` (RF07)
  - [x] `Peca` (RF08)
  - [x] `Anexo` (RF15, RF16 — fotos e documentos)
  - [x] `Notificacao` (RF14 — lembretes)
  - [x] `Sessao` (segurança - RNF12)
- [x] Backend — Autenticação JWT (Login + Cadastro)
- [x] Backend — CRUD de Veículos com Vínculo Identificador (Placa + Proprietário)
- [x] Backend — Registro de Manutenções (serviços + peças em transação)
- [x] Backend — Upload de fotos/documentos (Anexos)
- [x] Mobile — Contexto global de autenticação (AuthContext)
- [x] Mobile — Tela de Login com validação e acessibilidade
- [x] Mobile — Tela de Cadastro com indicador de força de senha
- [x] Mobile — Navegação autenticada/não-autenticada
- [x] Mobile — Tab bar seguindo protótipo de baixa fidelidade
- [x] Identidade visual aplicada (cores #100050 e #33CC33)
- [x] Todos os arquivos comentados em português (para defesa)

---

## 🗓️ Próximas Sprints (planejamento)

| Sprint | Foco principal |
|--------|---------------|
| **Sprint 2** | Tela Home com dashboard, CRUD completo de veículos no mobile |
| **Sprint 3** | Registro de manutenção com Speech-to-Text (voz), galeria de fotos |
| **Sprint 4** | Notificações/lembretes, histórico com filtros, exportação PDF |
| **Sprint 5** | Testes, ajustes de acessibilidade, polimento final, preparação da defesa |

---

## 🔌 Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | `/health` | Status da API |
| POST | `/api/auth/cadastro` | Criar conta |
| POST | `/api/auth/login` | Fazer login |
| GET  | `/api/proprietario/perfil` | Dados do usuário logado |
| PUT  | `/api/proprietario/perfil` | Editar perfil |
| GET  | `/api/veiculos` | Listar veículos |
| POST | `/api/veiculos` | Cadastrar veículo |
| GET  | `/api/veiculos/:id` | Detalhe do veículo |
| PUT  | `/api/veiculos/:id` | Editar veículo |
| DELETE | `/api/veiculos/:id` | Remover veículo |
| GET  | `/api/manutencoes` | Listar manutenções (com filtros) |
| POST | `/api/manutencoes` | Registrar manutenção |
| POST | `/api/anexos/upload/:manutencaoId` | Fazer upload de foto |
| GET  | `/api/anexos/:manutencaoId` | Listar fotos de uma manutenção |
