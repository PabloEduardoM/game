import { Server } from 'colyseus';
import dotenv from 'dotenv';
import { RPGRoom } from './rooms/RPGRoom';

dotenv.config();

const port = Number(process.env.PORT) || 2567;
const gameServer = new Server();

gameServer.define('rpg', RPGRoom);

gameServer.attach({
  express: (app) => {
    app.get('/', (_req, res) => {
      res.send('RPG 2D Online Server is running');
    });
  }
});

async function main() {
  await gameServer.listen(port);
  console.log(`Servidor Colyseus rodando em http://localhost:${port}`);
}

main().catch((error) => {
  console.error('Erro ao iniciar o servidor:', error);
});
