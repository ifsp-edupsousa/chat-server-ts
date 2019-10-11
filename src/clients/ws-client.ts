import Chat from '../chat';
import ChatClient from './chat-client';
import { connection, IMessage } from 'websocket';

export default class WSClient implements ChatClient {
  private conn: connection;
  private chat: Chat;

  constructor(conn: connection, chat: Chat) {
    this.chat = chat;
    this.conn = conn;
    this.conn.on('close', this.onEnd);
    this.conn.on('message', this.onMessage);

    this.log('cliente conectado');
  }
  disconnect() {
    this.conn.close();
  }
  sendMessage(message: string) {
    this.conn.sendUTF(message + '\r\n');
  }
  log(...params: Array<any>) {
    console.log('ws: ' + this.conn.remoteAddress, ...params);
  }
  private onMessage = (data: IMessage) => {
    data.utf8Data.split('\n').forEach(line => {
      if (line.trim().length === 0) return;
      const params = line.trim().split(':');
      const command = params.shift();
      this.chat.processCommand(this, command, params);
    });
  };
  private onEnd = () => {
    this.chat.removeClient(this);
    this.log('cliente desconectado');
  };
}
