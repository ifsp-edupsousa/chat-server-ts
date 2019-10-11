import { createServer } from 'net';
import { createServer as createHttpServer } from 'http';
import { server as WebSocketServer } from 'websocket';

import Chat from './chat';
import NetClient from './clients/net-client';
import WSClient from './clients/ws-client';

const chat = new Chat();
startTCPServer(chat);
startWSServer(chat);

function startTCPServer(chat: Chat) {
  const server = createServer(socket => {
    const client = new NetClient(socket);
    chat.addGuest(client);
  });

  server.on('error', e => {
    console.error('erro no servidor tcp: ', e);
  });

  server.listen(4321, () => {
    console.log('servidor tcp em execução');
  });
}

function startWSServer(chat: Chat) {
  const server = createHttpServer((req, res) => {});
  const wsServer = new WebSocketServer({
    httpServer: server
  });

  wsServer.on('request', req => {
    const connection = req.accept(null, req.origin);
    const client = new WSClient(connection);
    chat.addGuest(client);
  });

  server.listen(4322, () => {
    console.log('servidor websocket em execução');
  });
}
