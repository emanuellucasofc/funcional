# Guia Rápido — Como Rodar o Sistema

## Opção A: Com Docker (recomendado para desenvolvimento)

1. Instale o [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Na pasta raiz do projeto, execute:
   ```
   docker-compose up -d
   ```
3. Vá para a pasta `backend`:
   ```
   cd backend
   npm run db:push
   npm run db:seed
   npm run dev
   ```
4. Em outro terminal, vá para a pasta `frontend`:
   ```
   cd frontend
   npm run dev
   ```
5. Acesse: **http://localhost:5173**

---

## Opção B: Usando Supabase (sem Docker, 100% online e grátis)

1. Crie conta grátis em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Settings → Database → Connection string → URI**
4. Copie a string de conexão
5. No arquivo `backend/.env`, substitua a `DATABASE_URL`:
   ```
   DATABASE_URL="postgresql://postgres:[SUA-SENHA]@db.[SEU-ID].supabase.co:5432/postgres"
   ```
6. Execute:
   ```
   cd backend
   npm run db:push
   npm run db:seed
   npm run dev
   ```
7. Em outro terminal:
   ```
   cd frontend
   npm run dev
   ```

---

## Login

Após rodar o seed, acesse com:

- **Admin:** admin@funcional.com / admin123
- **Instrutor:** instrutor@funcional.com / instru123

