import Chat from '../chat';
import ChatClient, { ChatCommandCallback } from './chat-client';
import { Socket } from 'net';

export default class NetClient implements ChatClient {
  private socket: Socket;
  private chat: Chat;
  private commandCb: ChatCommandCallback;

  constructor(socket: Socket, chat: Chat) {
    this.chat = chat;
    this.socket = socket;
    this.socket.on('end', this.onEnd);
    this.socket.on('data', this.onData);

    this.log('cliente conectado');
  }
  disconnect(): void {
    this.socket.end();
  }
  sendMessage(message: string): void {
    this.socket.write(message + '\r\n');
  }
  log(...params: Array<any>): void {
    console.log('net: ' + this.socket.remoteAddress, ...params);
  }
  onCommand(cb: ChatCommandCallback): void {
    this.commandCb = cb;
  }
  private onData = (data: Buffer) => {
    data
      .toString()
      .split('\n')
      .forEach(line => {
        if (line.trim().length === 0) return;
        const params = line.trim().split(':');
        const command = params.shift();
        this.commandCb(this, command, params);
      });
  };
  private onEnd = () => {
    this.chat.removeClient(this);
    this.log('cliente desconectado');
  };
}
