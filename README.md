# RPG 2D Online Browser MVP

Projeto MVP de RPG 2D online em pixel art, feito com tecnologias gratuitas e open-source.

## Estrutura do projeto
- `/client` - jogo no navegador com Phaser 3 + TypeScript + Vite
- `/server` - servidor autoritativo com Node.js + Colyseus + PostgreSQL
- `/database` - scripts SQL para schema e dados de teste
- `/docs` - documentação de arquitetura e game design

## Requisitos satisfeitos
- Tela inicial
- Login simples com preparação para Supabase Auth
- Criação de personagem
- Mapa top-down em pixel art carregado a partir do Tiled Map Editor
- Movimento com WASD e setas
- Colisão por tile
- Câmera seguindo o jogador
- Multiplayer básico com Colyseus
- Outros jogadores visíveis no mapa
- Sincronização de posição em tempo real
- Chat simples
- NPC com diálogo
- Primeira missão simples
- Inventário básico
- Item coletável
- Monstro simples
- Sistema inicial de XP e nível
- Salvamento de personagem e progresso

## Como testar localmente

### 1. Instalar dependências

No terminal, execute:

```powershell
cd client
npm install
cd ../server
npm install
```

### 2. Configurar o banco

Crie um banco PostgreSQL local e execute:

```powershell
psql -d postgres -f database/schema.sql
psql -d postgres -f database/seed.sql
```

Atualize a variável `DATABASE_URL` em `server/.env` ou use `DATABASE_URL` no ambiente.

### 3. Rodar o servidor

```powershell
cd server
npm run dev
```

### 4. Rodar o client

```powershell
cd ../client
npm run dev
```

Abra o navegador em `http://localhost:5173`.

## Deploy gratuito

### Deploy do client no GitHub Pages
1. O projeto agora faz deploy automático ao `gh-pages` sempre que houver push na branch `main`.
2. O workflow está em `.github/workflows/deploy-client.yml` e executa:
   - `npm ci` em `/client`
   - `npm run build`
   - publica `client/dist` em `gh-pages`
3. Se quiser validar manualmente, você ainda pode gerar o build localmente:
   ```powershell
   cd client
   npm install
   npm run build
   ```
4. No GitHub, configure Pages para usar a branch `gh-pages`.

> O `vite.config.ts` já inclui `base: './'` para garantir que os assets sejam carregados corretamente.

### Deploy do servidor no Render Free
1. Crie uma conta gratuita no Render.
2. Crie um novo serviço do tipo **Web Service**.
3. Aponte o repositório para este projeto e use as configurações:
   - Build Command: `cd server && npm install && npm run build`
   - Start Command: `cd server && npm run start`
4. Configure variáveis de ambiente no Render:
   - `DATABASE_URL` = URL do PostgreSQL local ou Supabase Free
   - `PORT` = 2567 (opcional, Render também fornece automaticamente)
5. Se estiver usando Supabase Free, copie o `DATABASE_URL` do projeto Supabase e adicione no Render.

### Atualizar o client para produção
1. No arquivo `client/src/scenes/GameScene.ts`, o cliente agora usa `wss://game-r145.onrender.com` quando não estiver em `localhost`.
2. Gere o build do client novamente:
   ```powershell
   cd client
   npm install
   npm run build
   ```
3. Publique o conteúdo de `client/dist` no branch `gh-pages` de novo:
   ```powershell
   git checkout --orphan gh-pages
   git --work-tree dist add --all
   git --work-tree dist commit -m "Atualiza client para servidor Render"
   git push origin HEAD:gh-pages --force
   git checkout -
   ```

### Banco online preparado para Supabase Free
- O servidor usa PostgreSQL padrão e pode ser conectado ao Supabase.
- Basta definir `DATABASE_URL` com a string de conexão do Supabase.

## Alternativas gratuitas recomendadas
- Arte: Piskel, OpenGameArt, Kenney assets gratuitos
- Som: Freesound, FreeSoundEffects
- Banco: PostgreSQL local e Supabase Free
- Hospedagem: GitHub Pages / Vercel para client + Render / Railway para server

## Documentação
- `/docs/architecture.md`
- `/docs/game-design.md`
