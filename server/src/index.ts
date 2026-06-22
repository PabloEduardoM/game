import express from 'express';
import http from 'http';
import { Server } from 'colyseus';
import dotenv from 'dotenv';
import { RPGRoom } from './rooms/RPGRoom';

dotenv.config();

const app = express();
const server = http.createServer(app);
const gameServer = new Server({ server });

app.get('/', (_req, res) => {
  res.send('RPG 2D Online Server is running');
});

gameServer.register('rpg', RPGRoom);

const port = Number(process.env.PORT) || 2567;
server.listen(port, () => {
  console.log(`Servidor Colyseus rodando em http://localhost:${port}`);
});
