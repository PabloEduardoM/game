import { Pool } from 'pg';

export interface CharacterRecord {
  username: string;
  level: number;
  xp: number;
  gold: number;
  x: number;
  y: number;
  inventory: string[];
}

export class Database {
  private pool: Pool | null = null;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      this.pool = new Pool({ connectionString });
    }
  }

  public async loadCharacter(username: string): Promise<CharacterRecord | null> {
    if (!this.pool) return null;
    const result = await this.pool.query(
      `SELECT username, level, xp, gold, x, y, inventory FROM characters WHERE username = $1 LIMIT 1`,
      [username]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return {
      username: result.rows[0].username,
      level: result.rows[0].level,
      xp: result.rows[0].xp,
      gold: result.rows[0].gold,
      x: result.rows[0].x,
      y: result.rows[0].y,
      inventory: result.rows[0].inventory || []
    };
  }

  public async saveCharacter(username: string, data: CharacterRecord) {
    if (!this.pool) return;
    await this.pool.query(
      `INSERT INTO characters (username, level, xp, gold, x, y, inventory)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (username) DO UPDATE SET level = $2, xp = $3, gold = $4, x = $5, y = $6, inventory = $7, updated_at = now()`,
      [username, data.level, data.xp, data.gold, data.x, data.y, JSON.stringify(data.inventory)]
    );
  }
}
