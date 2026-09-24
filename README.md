# 🏋️ Sistema de Gestão — Treinamento de Funcional

Sistema web completo para gerenciamento de alunos, turmas, chamadas, frequência e relatórios.

## ✅ Credenciais de demonstração

| Usuário | E-mail | Senha | Papel |
|---|---|---|---|
| Administrador | admin@funcional.com | admin123 | Admin (acesso total) |
| Instrutor | instrutor@funcional.com | instru123 | Instrutor (chamada e consulta) |

---

## 🚀 Executar localmente

### Pré-requisitos

- [Node.js 18+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para PostgreSQL local)

### 1. Subir o banco de dados

```bash
# Na pasta raiz do projeto
docker-compose up -d
```

Isso cria um PostgreSQL local na porta 5432 com:
- Usuário: `funcional`
- Senha: `funcional123`
- Banco: `funcional_db`

### 2. Configurar o backend

```bash
cd backend

# Copiar .env (já configurado para Docker local)
copy .env.example .env     # Windows
# ou
cp .env.example .env       # Linux/Mac

# Instalar dependências (já feito)
npm install

# Criar as tabelas no banco
npm run db:push

# Popular com dados de demonstração
npm run db:seed
```

### 3. Iniciar o backend

```bash
# Na pasta backend
npm run dev
```

Servidor rodará em: **http://localhost:3001**

Teste com: http://localhost:3001/health → deve retornar `{"status":"ok"}`

### 4. Configurar o frontend

```bash
cd frontend

# .env.local já está configurado para localhost
# Instalar dependências (já feito)
npm install
```

### 5. Iniciar o frontend

```bash
# Na pasta frontend
npm run dev
```

Abrirá em: **http://localhost:5173**

---

## 🌐 Deploy na internet

### Frontend → Vercel

1. Crie conta em [vercel.com](https://vercel.com)
2. Conecte ao repositório GitHub
3. Configure a variável de ambiente:
   ```
   VITE_API_URL = https://sua-api.railway.app
   ```
4. Clique em Deploy

### Backend + Banco → Railway

1. Crie conta em [railway.app](https://railway.app)
2. Crie um novo projeto
3. Adicione um serviço **PostgreSQL** → copie a `DATABASE_URL`
4. Adicione um serviço **Node.js** e conecte ao repositório (pasta `backend`)
5. Configure as variáveis de ambiente:
   ```
   DATABASE_URL = (copiada do PostgreSQL Railway)
   JWT_SECRET   = (chave aleatória longa e segura)
   NODE_ENV     = production
   FRONTEND_URL = https://seu-app.vercel.app
   PORT         = 3001
   ```
6. Na pasta `backend`, adicione o arquivo `railway.json`:
   ```json
   {
     "build": { "builder": "NIXPACKS" },
     "deploy": {
       "startCommand": "npm run db:push && node dist/server.js",
       "restartPolicyType": "ON_FAILURE"
     }
   }
   ```

---

## 📁 Estrutura do projeto

```
funcional/
├── frontend/           # React + Vite + Tailwind + shadcn/ui
│   ├── src/
│   │   ├── components/ # Layout, UI reutilizável
│   │   ├── contexts/   # AuthContext
│   │   ├── lib/        # API, QueryClient, utils
│   │   ├── pages/      # Dashboard, Alunos, Chamada, etc.
│   │   ├── router/     # Rotas protegidas
│   │   └── types/      # Tipos TypeScript
│   └── dist/           # Build de produção
│
├── backend/            # Node.js + Fastify + Prisma
│   ├── src/
│   │   ├── routes/     # auth, students, classes, attendance...
│   │   ├── utils/      # audit, alerts, jwt
│   │   ├── middlewares/# auth, roles
│   │   └── lib/        # Prisma client
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
│
└── docker-compose.yml  # PostgreSQL local
```

---

## 📋 Funcionalidades

| Módulo | Status |
|---|---|
| Login / Autenticação JWT | ✅ |
| Dashboard com cards e gráficos | ✅ |
| Cadastro e gestão de alunos | ✅ |
| Turmas e horários | ✅ |
| **Lista de Chamada (mobile-first)** | ✅ |
| Cálculo automático de faltas | ✅ |
| Alertas automáticos (2/3/4 faltas) | ✅ |
| Relatórios de frequência | ✅ |
| Exportação CSV e PDF | ✅ |
| Histórico de auditoria | ✅ |
| Configurações do sistema | ✅ |
| Controle de usuários e permissões | ✅ |

---

## 🔐 Regras de negócio

- Alunos **inativos** não aparecem em novas chamadas
- Faltas são contadas **por mês** (zeram no mês seguinte)
- **2 faltas** → Alerta de Atenção 🟡
- **3 faltas** → Alerta Crítico 🔴
- **4+ faltas** → Frequência Crítica 🚨
- Impossível registrar presença e falta na mesma data/turma
- Histórico nunca é apagado automaticamente
- Todas as ações são registradas em log de auditoria

---

## 🗄️ Banco de dados — Tabelas

| Tabela | Descrição |
|---|---|
| `users` | Usuários do sistema (admin / instrutor) |
| `students` | Cadastro de alunos |
| `classes` | Turmas e horários |
| `student_classes` | Relacionamento aluno ↔ turma |
| `attendance` | Registros de presença/falta |
| `alerts` | Alertas automáticos de frequência |
| `settings` | Configurações da empresa |
| `audit_logs` | Log de todas as ações |

---

## 🛠️ Tecnologias

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router, Recharts, jsPDF, xlsx

**Backend:** Node.js, TypeScript, Fastify, Prisma ORM, JWT, bcryptjs, Zod

**Banco:** PostgreSQL 16

**Deploy:** Vercel (frontend) + Railway (backend + banco)

