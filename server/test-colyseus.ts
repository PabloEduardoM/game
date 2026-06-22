import { Server, Room, Client } from 'colyseus';
import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';

class MinimalState extends Schema {
  @type('string') message = '';
}

class TestRoom extends Room<MinimalState> {
  onCreate() {
    console.log('[TestRoom] Room created');
    this.setState(new MinimalState());
    this.state.message = 'ready';
  }

  async onJoin(client: Client) {
    console.log('[TestRoom] onJoin called!', client.sessionId);
  }

  onLeave(client: Client) {
    console.log('[TestRoom] onLeave called!', client.sessionId);
  }
}

async function test() {
  const gameServer = new Server();
  gameServer.define('test', TestRoom);

  await gameServer.attach({
    express: (app) => {
      app.get('/', (_req, res) => {
        res.send('Test server running');
      });
    }
  });

  await gameServer.listen(2568);
  console.log('Test server listening on port 2568');
}

test();
