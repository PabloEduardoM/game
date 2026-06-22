import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.tilemapTiledJSON('map', 'assets/map.json');
  }

  create() {
    this.createTilesTexture();
    this.createSpriteTexture('player', 0x31a2ff);
    this.createSpriteTexture('otherPlayer', 0x84d2ff);
    this.createSpriteTexture('npc', 0xf5d142);
    this.createSpriteTexture('item', 0xd5464a);
    this.createSpriteTexture('monster', 0x9534eb);

    this.scene.start('LoginScene');
  }

  private createTilesTexture() {
    const tileSize = 16;
    const textureWidth = tileSize * 4;
    const rt = this.add.renderTexture(0, 0, textureWidth, tileSize).setVisible(false);
    const tileColors = [0x3c7a34, 0x6c5f45, 0x2e5d7a, 0x8a8a8a];

    tileColors.forEach((color, index) => {
      const gfx = this.add.graphics();
      gfx.fillStyle(color, 1);
      gfx.fillRect(0, 0, tileSize, tileSize);
      rt.draw(gfx, index * tileSize, 0);
      gfx.destroy();
    });

    rt.saveTexture('tiles');
    rt.destroy();
  }

  private createSpriteTexture(key: string, color: number) {
    const tileSize = 20;
    const rt = this.add.renderTexture(0, 0, tileSize, tileSize).setVisible(false);
    const gfx = this.add.graphics();
    gfx.fillStyle(color, 1);
    gfx.fillRect(0, 0, tileSize, tileSize);
    gfx.lineStyle(2, 0x000000, 1);
    gfx.strokeRect(0, 0, tileSize, tileSize);
    rt.draw(gfx, 0, 0);
    rt.saveTexture(key);
    gfx.destroy();
    rt.destroy();
  }
}
