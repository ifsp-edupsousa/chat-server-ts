import { createServer } from 'net';
import Chat from './chat';
import NetClient from './clients/net-client';

const chat = new Chat();

const server = createServer(socket => {
  const client = new NetClient(socket, chat);
  chat.addGuest(client);
});

server.on('error', e => {
  console.error('erro no servidor: ', e);
});

server.listen(4321, () => {
  console.log('servidor em execução');
});
