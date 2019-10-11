import Chat from '../chat';
import ChatClient from './chat-client';
import { Socket } from 'net';

export default class NetClient implements ChatClient {
  private socket: Socket;
  private chat: Chat;

  constructor(socket: Socket, chat: Chat) {
    this.chat = chat;
    this.socket = socket;
    this.socket.on('end', this.onEnd);
    this.socket.on('data', this.onData);

    this.log('cliente conectado');
  }
  disconnect() {
    this.socket.end();
  }
  sendMessage(message: string) {
    this.socket.write(message + '\r\n');
  }
  log(...params: Array<any>) {
    console.log('net: ' + this.socket.remoteAddress, ...params);
  }
  private onData = (data: Buffer) => {
    data
      .toString()
      .split('\n')
      .forEach(line => {
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
