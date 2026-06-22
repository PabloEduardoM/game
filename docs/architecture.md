# Arquitetura do Projeto

## Visão geral
O projeto é dividido em três camadas principais:

- `client` - aplicação de jogo em Phaser 3 com TypeScript executando no navegador
- `server` - servidor autoritativo de multiplayer usando Colyseus e Node.js
- `database` - scripts de schema e seed para PostgreSQL

## Separação de responsabilidades

### Client
- Renderiza o mapa e sprites
- Envia comandos do jogador ao servidor
- Exibe estado sincronizado recebido do servidor
- Não contém lógica de validação de jogo crítica

### Server
- Autoriza e valida movimento, combate, coleta e missões
- Mantém o estado no `RPGRoom`
- Sincroniza posições e inventário entre jogadores em tempo real
- Salva o progresso no banco de dados

### Database
- Guarda usuários, personagens, inventário e itens
- Permite migração para Supabase Free com PostgreSQL

## Fluxo de dados
1. O usuário faz login localmente e entra na sala do Colyseus
2. O servidor cria ou carrega um personagem
3. O cliente envia eventos de `move`, `attack`, `pickup` e `chat`
4. O servidor atualiza o estado e envia patches para todos os clientes
5. O servidor persiste mudanças importantes em PostgreSQL
