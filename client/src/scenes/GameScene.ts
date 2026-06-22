import Phaser from 'phaser';
import { Client, Room } from 'colyseus.js';
import { LoginData, PlayerData } from '../types';

interface RoomState {
  players: Record<string, PlayerData>;
  chat: string[];
  items: Record<string, { x: number; y: number; label: string }>;
  monsters: Record<string, { x: number; y: number; alive: boolean }>;
  dialog: string;
}

export default class GameScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private pickupKey!: Phaser.Input.Keyboard.Key;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private playerId?: string;
  private playersSprites: Record<string, Phaser.GameObjects.Image> = {};
  private itemSprites: Record<string, Phaser.GameObjects.Image> = {};
  private monsterSprites: Record<string, Phaser.GameObjects.Image> = {};
  private npcSprite?: Phaser.GameObjects.Image;
  private mapLayer!: Phaser.Tilemaps.TilemapLayer;
  private chatContainer?: HTMLElement;
  private chatInput?: HTMLInputElement;
  private chatMessages?: HTMLElement;
  private statusPanel?: HTMLElement;
  private room?: Room<RoomState>;
  private localData?: LoginData;

  constructor() {
    super('GameScene');
  }

  async create(data: LoginData) {
    this.localData = data;
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyA = this.input.keyboard!.addKey('A');
    this.keyW = this.input.keyboard!.addKey('W');
    this.keyS = this.input.keyboard!.addKey('S');
    this.keyD = this.input.keyboard!.addKey('D');
    this.pickupKey = this.input.keyboard!.addKey('E');
    this.attackKey = this.input.keyboard!.addKey('F');
    this.add.text(480, 120, 'Conectando...', { fontSize: '18px', color: '#f3f5f7' }).setDepth(1);
    this.createMap();
    this.createNpc();
    this.createChatUI();
    this.createStatusPanel();
    this.add.text(22, 560, 'E: coletar item | F: atacar monstro | clique no NPC', { fontSize: '14px', color: '#dddddd' }).setDepth(5);
    await this.connectRoom();
  }

  update() {
    if (!this.room || !this.playerId || !this.cursors) {
      return;
    }

    const playerSprite = this.playersSprites[this.playerId];
    if (!playerSprite) {
      return;
    }

    const speed = 90;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left?.isDown || this.keyA?.isDown) {
      vx = -speed;
    } else if (this.cursors.right?.isDown || this.keyD?.isDown) {
      vx = speed;
    }

    if (this.cursors.up?.isDown || this.keyW?.isDown) {
      vy = -speed;
    } else if (this.cursors.down?.isDown || this.keyS?.isDown) {
      vy = speed;
    }

    if (vx !== 0 || vy !== 0) {
      this.room?.send('move', { dx: vx * this.game.loop.delta / 1000, dy: vy * this.game.loop.delta / 1000 });
    }

    if (this.pickupKey && Phaser.Input.Keyboard.JustDown(this.pickupKey)) {
      this.room?.send('pickup', 'gem');
    }

    if (this.attackKey && Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.room?.send('attack');
    }
  }

  private createMap() {
    const map = this.make.tilemap({ key: 'map' });
    const tiles = map.addTilesetImage('tiles', 'tiles');
    if (!tiles) {
      throw new Error('Tileset not found');
    }
    map.createLayer('Ground', tiles, 0, 0);
    this.mapLayer = map.createLayer('Walls', tiles, 0, 0)!;
    this.mapLayer.setCollision([2]);
  }

  private createNpc() {
    this.npcSprite = this.add.image(144, 144, 'npc');
    this.npcSprite.setDepth(2);
    this.npcSprite.setDisplaySize(20, 20);
    this.npcSprite.setInteractive();
    this.npcSprite.on('pointerdown', () => {
      this.showDialog('NPC: "Preciso de sua ajuda para recuperar a gema perdida."');
    });
  }

  private createChatUI() {
    const container = document.createElement('div');
    container.className = 'chat-panel';
    container.innerHTML = `
      <h3>Chat</h3>
      <div class="chat-messages"></div>
      <input id="chatInput" placeholder="Digite sua mensagem..." />
      <button id="chatSend">Enviar</button>
    `;
    this.game.canvas.parentElement?.appendChild(container);
    this.chatContainer = container;
    this.chatMessages = container.querySelector('.chat-messages') as HTMLElement;
    this.chatInput = container.querySelector('#chatInput') as HTMLInputElement;
    const button = container.querySelector('#chatSend') as HTMLButtonElement;
    button.addEventListener('click', () => this.sendChat());
    this.chatInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.sendChat();
      }
    });
  }

  private createStatusPanel() {
    const status = document.createElement('div');
    status.className = 'status-panel';
    status.innerHTML = `
      <h3>Status</h3>
      <div id="statusContent">Carregando personagem...</div>
    `;
    this.game.canvas.parentElement?.appendChild(status);
    this.statusPanel = status;
  }

  private async connectRoom() {
    const serverUrl = window.location.hostname === 'localhost'
      ? 'ws://localhost:2567'
      : 'wss://game-r145.onrender.com';
    const client = new Client(serverUrl);

    try {
      this.room = await client.joinOrCreate<RoomState>('rpg', {
        username: this.localData?.username || 'Aventureiro'
      });

      this.playerId = this.room.sessionId;
      this.room.onMessage('system', (message) => {
        this.addChatMessage(`[sistema] ${message}`);
      });
      this.room.onMessage('dialog', (message) => {
        this.showDialog(message);
      });

      this.room.state.players && this.setupPlayers();
      this.room.state.chat && this.room.state.chat.forEach((message) => this.addChatMessage(message));
      this.room.onStateChange((state) => {
        this.syncPlayers(state.players);
        this.syncItems(state.items);
        this.syncMonsters(state.monsters);
      });
    } catch (error) {
      console.error('Connection error:', error);
      const errorText = error instanceof Error 
        ? error.message 
        : typeof error === 'object' ? JSON.stringify(error) : String(error);
      this.add.text(16, 48, `Erro ao conectar: ${errorText}`, { color: '#ff6666' });
    }
  }

  private setupPlayers() {
    if (!this.room) return;
    Object.entries(this.room.state.players).forEach(([id, player]) => {
      this.createOrUpdatePlayerSprite(id, player);
    });
    this.updateStatus();
  }

  private syncPlayers(players: Record<string, PlayerData>) {
    Object.entries(players).forEach(([id, player]) => {
      this.createOrUpdatePlayerSprite(id, player);
    });
    Object.keys(this.playersSprites).forEach((id) => {
      if (!players[id]) {
        this.playersSprites[id].destroy();
        delete this.playersSprites[id];
      }
    });
    this.updateStatus();
  }

  private syncItems(items: Record<string, { x: number; y: number; label: string }>) {
    Object.entries(items).forEach(([id, item]) => {
      if (!this.itemSprites[id]) {
        const sprite = this.add.image(item.x, item.y, 'item').setDepth(1).setDisplaySize(18, 18);
        this.itemSprites[id] = sprite;
      }
    });
    Object.keys(this.itemSprites).forEach((id) => {
      if (!items[id]) {
        this.itemSprites[id].destroy();
        delete this.itemSprites[id];
      }
    });
  }

  private syncMonsters(monsters: Record<string, { x: number; y: number; alive: boolean }>) {
    Object.entries(monsters).forEach(([id, monster]) => {
      if (monster.alive) {
        if (!this.monsterSprites[id]) {
          const sprite = this.add.image(monster.x, monster.y, 'monster').setDisplaySize(20, 20).setDepth(1);
          this.monsterSprites[id] = sprite;
        } else {
          this.monsterSprites[id].setPosition(monster.x, monster.y);
        }
      } else {
        this.monsterSprites[id]?.destroy();
        delete this.monsterSprites[id];
      }
    });
  }

  private createOrUpdatePlayerSprite(id: string, player: PlayerData) {
    const key = id === this.playerId ? 'player' : 'otherPlayer';
    if (!this.playersSprites[id]) {
      const sprite = this.add.image(player.x, player.y, key).setOrigin(0.5).setDepth(1);
      sprite.setDisplaySize(20, 20);
      this.playersSprites[id] = sprite;
    }
    this.playersSprites[id].setPosition(player.x, player.y);

    if (id === this.playerId) {
      this.cameras.main.startFollow(this.playersSprites[id], true, 0.08, 0.08);
      this.cameras.main.setBounds(0, 0, 320, 240);
    }
  }

  private sendChat() {
    const message = this.chatInput?.value.trim();
    if (!message || !this.room) return;
    this.room.send('chat', message);
    this.chatInput!.value = '';
  }

  private addChatMessage(message: string) {
    if (!this.chatMessages) return;
    const line = document.createElement('div');
    line.textContent = message;
    this.chatMessages.appendChild(line);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  private showDialog(message: string) {
    const dialog = this.add.text(24, 520, message, {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: 'rgba(2, 18, 35, 0.9)',
      padding: { x: 10, y: 8 }
    });
    dialog.setDepth(10);
    this.time.delayedCall(4500, () => dialog.destroy());
  }

  private updateStatus() {
    if (!this.statusPanel || !this.room || !this.playerId) return;
    const player = this.room.state.players[this.playerId];
    if (!player) return;
    const content = `
      <strong>${player.name}</strong><br />
      Nível: ${player.level}<br />
      XP: ${player.xp}<br />
      Ouro: ${player.gold}<br />
      Inventário: ${player.inventory.join(', ') || 'Vazio'}
    `;
    this.statusPanel.querySelector('#statusContent')!.innerHTML = content;
  }
}
