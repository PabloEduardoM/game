import Phaser from 'phaser';
import { LoginData } from '../types';

export default class LoginScene extends Phaser.Scene {
  private usernameInput?: HTMLInputElement;

  constructor() {
    super('LoginScene');
  }

  create() {
    this.add.text(480, 120, 'RPG Online MVP', { fontSize: '28px', color: '#f3f5f7' }).setOrigin(0.5);
    this.createLoginPanel();
  }

  private createLoginPanel() {
    const panel = document.createElement('div');
    panel.className = 'login-panel';
    panel.innerHTML = `
      <h2>Login</h2>
      <label>Nome do personagem</label>
      <input id="username" placeholder="Heroi" />
      <button id="loginButton">Entrar</button>
      <p style="margin-top:10px;font-size:12px;color:#b9d6ed">Preparado para Supabase Auth (env compatível).</p>
    `;
    this.game.canvas.parentElement?.appendChild(panel);

    const loginButton = panel.querySelector('#loginButton') as HTMLButtonElement;
    this.usernameInput = panel.querySelector('#username') as HTMLInputElement;

    loginButton?.addEventListener('click', () => this.handleLogin(panel));
    this.usernameInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.handleLogin(panel);
      }
    });
  }

  private handleLogin(panel: HTMLElement) {
    const username = this.usernameInput?.value.trim() || 'Aventureiro';
    const loginData: LoginData = { username };
    panel.remove();
    this.scene.start('GameScene', loginData);
  }
}
