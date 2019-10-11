import ChatClient, {
  ChatCommandCallback,
  ChatDisconnectCallback
} from './chat-client';
import { connection, IMessage } from 'websocket';

export default class WSClient implements ChatClient {
  private conn: connection;
  private commandCb: ChatCommandCallback;
  private disconnectCb: ChatDisconnectCallback;

  constructor(conn: connection) {
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
  onCommand(cb: ChatCommandCallback): void {
    this.commandCb = cb;
  }
  onDisconnect(cb: ChatDisconnectCallback): void {
    this.disconnectCb = cb;
  }
  private onMessage = (data: IMessage) => {
    data.utf8Data.split('\n').forEach(line => {
      if (line.trim().length === 0) return;
      const params = line.trim().split(':');
      const command = params.shift();
      this.commandCb(this, command, params);
    });
  };
  private onEnd = () => {
    this.disconnectCb(this);
    this.log('cliente desconectado');
  };
}
