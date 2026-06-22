import { Room, Client } from 'colyseus';
import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';
import { Database } from '../db/Database';

class PlayerState extends Schema {
  @type('string') id = '';
  @type('string') name = '';
  @type('number') x = 64;
  @type('number') y = 64;
  @type('number') level = 1;
  @type('number') xp = 0;
  @type('number') gold = 10;
  @type([ 'string' ]) inventory = new ArraySchema<string>();
}

class ItemState extends Schema {
  @type('string') id = '';
  @type('string') label = '';
  @type('number') x = 0;
  @type('number') y = 0;
}

class MonsterState extends Schema {
  @type('string') id = '';
  @type('number') x = 0;
  @type('number') y = 0;
  @type('boolean') alive = true;
}

class RPGState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: ItemState }) items = new MapSchema<ItemState>();
  @type({ map: MonsterState }) monsters = new MapSchema<MonsterState>();
  @type([ 'string' ]) chat = new ArraySchema<string>();
}

interface MoveMessage {
  dx: number;
  dy: number;
}

export class RPGRoom extends Room<RPGState> {
  private database = new Database();
  private blockedTiles = new Set<string>();

  onCreate() {
    this.setState(new RPGState());
    this.setPatchRate(100);
    this.setupMapCollisions();
    this.spawnItem('gem', 192, 140, 'Gema');
    this.spawnMonster('slime', 220, 110);

    this.onMessage('move', (client, message: MoveMessage) => {
      this.handleMove(client, message);
    });

    this.onMessage('pickup', (client, itemId: string) => {
      this.handlePickup(client, itemId);
    });

    this.onMessage('attack', (client) => {
      this.handleAttack(client);
    });

    this.onMessage('chat', (client, message: string) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const text = `${player.name}: ${message}`;
      this.state.chat.push(text);
      this.broadcast('system', text);
    });
  }

  async onJoin(client: Client, options: any) {
    const username = options.username || `Jogador-${Math.floor(Math.random() * 1000)}`;
    let x = 80;
    let y = 80;

    const saved = await this.database.loadCharacter(username);
    if (saved) {
      x = saved.x;
      y = saved.y;
    }

    const player = new PlayerState();
    player.id = client.sessionId;
    player.name = username;
    player.x = x;
    player.y = y;
    player.level = saved?.level ?? 1;
    player.xp = saved?.xp ?? 0;
    player.gold = saved?.gold ?? 10;
    player.inventory = new ArraySchema<string>();
    if (saved?.inventory) {
      saved.inventory.forEach((item) => player.inventory.push(item));
    }

    this.state.players.set(client.sessionId, player);
    this.broadcast('system', `${player.name} entrou no jogo.`);
    this.database.saveCharacter(username, {
      username,
      level: player.level,
      xp: player.xp,
      gold: player.gold,
      x: player.x,
      y: player.y,
      inventory: Array.from(player.inventory)
    });
  }

  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      this.database.saveCharacter(player.name, {
        username: player.name,
        level: player.level,
        xp: player.xp,
        gold: player.gold,
        x: player.x,
        y: player.y,
        inventory: Array.from(player.inventory)
      });
      this.state.players.delete(client.sessionId);
      this.broadcast('system', `${player.name} saiu do jogo.`);
    }
  }

  private setupMapCollisions() {
    const wallPositions = [
      ...Array.from({ length: 20 }, (_, x) => ({ x, y: 0 })),
      ...Array.from({ length: 20 }, (_, x) => ({ x, y: 14 })),
      ...Array.from({ length: 13 }, (_, y) => ({ x: 0, y: y + 1 })),
      ...Array.from({ length: 13 }, (_, y) => ({ x: 19, y: y + 1 }))
    ];
    wallPositions.forEach((coord) => {
      this.blockedTiles.add(`${coord.x}:${coord.y}`);
    });
  }

  private handleMove(client: Client, message: MoveMessage) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    const nextX = player.x + message.dx;
    const nextY = player.y + message.dy;
    if (this.canMove(nextX, nextY)) {
      player.x = nextX;
      player.y = nextY;
      if (this.isNearNpc(player.x, player.y)) {
        client.send('dialog', 'NPC: "Encontre a gema vermelha e traga para mim."');
      }
    }
  }

  private handlePickup(client: Client, itemId: string) {
    const player = this.state.players.get(client.sessionId);
    const item = this.state.items.get(itemId);
    if (!player || !item) return;
    const dx = Math.abs(player.x - item.x);
    const dy = Math.abs(player.y - item.y);
    if (dx < 24 && dy < 24) {
      player.inventory.push(item.label);
      player.gold += 5;
      this.state.items.delete(itemId);
      client.send('system', `Você coletou ${item.label} e ganhou ouro.`);
    }
  }

  private handleAttack(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    const monster = Array.from(this.state.monsters.values()).find((m) => m.alive && Math.abs(m.x - player.x) < 32 && Math.abs(m.y - player.y) < 32);
    if (!monster) {
      client.send('system', 'Nenhum inimigo por perto.');
      return;
    }

    monster.alive = false;
    player.xp += 15;
    if (player.xp >= player.level * 20) {
      player.xp = 0;
      player.level += 1;
      client.send('system', `Parabéns! Você subiu para o nível ${player.level}.`);
    }

    this.broadcast('system', `${player.name} derrotou um monstro!`);
  }

  private canMove(x: number, y: number) {
    const tileX = Math.floor(x / 16);
    const tileY = Math.floor(y / 16);
    if (tileX < 1 || tileX > 18 || tileY < 1 || tileY > 13) {
      return false;
    }
    return !this.blockedTiles.has(`${tileX}:${tileY}`);
  }

  private isNearNpc(x: number, y: number) {
    return Math.abs(x - 144) < 32 && Math.abs(y - 144) < 32;
  }

  private spawnItem(id: string, x: number, y: number, label: string) {
    const item = new ItemState();
    item.id = id;
    item.label = label;
    item.x = x;
    item.y = y;
    this.state.items.set(id, item);
  }

  private spawnMonster(id: string, x: number, y: number) {
    const monster = new MonsterState();
    monster.id = id;
    monster.x = x;
    monster.y = y;
    monster.alive = true;
    this.state.monsters.set(id, monster);
  }
}
