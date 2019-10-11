import { createServer, Socket } from 'net';

class Client {
  private static clients: Array<Client> = [];
  private socket: Socket;
  private loggedIn: boolean = false;
  private nickname: string;

  constructor(socket: Socket) {
    Client.clients.push(this);
    this.socket = socket;
    this.socket.on('end', this.onEnd);
    this.socket.on('data', this.onData);

    this.log('cliente conectado');
  }
  static sendUserList() {
    const userList = Client.clients.reduce((list, client) => {
      if (client.isLoggedIn()) list.push(client.getNickname());
      return list;
    }, []);
    if (userList.length === 0) return;
    const message = 'users:' + userList.join(':');
    this.writeToAll(message, true);
  }
  static writeToAll(message: string, onlyLoggedIn: boolean = false) {
    console.log(message);
    Client.clients.forEach(c => {
      if (onlyLoggedIn && !c.isLoggedIn()) return;
      c.writeLine(message);
    });
  }
  static writeToAllExcept(message: string, except: Client) {
    console.log(message);
    Client.clients.forEach(c => {
      if (c === except) return;
      c.writeLine(message);
    });
  }
  private login(nickname: string) {
    this.log('login:' + nickname);
    this.loggedIn = true;
    this.nickname = nickname;
    Client.sendUserList();
  }
  getNickname(): string {
    return this.nickname;
  }
  isLoggedIn(): boolean {
    return this.loggedIn;
  }
  writeLine(line: string) {
    this.socket.write(line + '\r\n');
  }
  getRemoteAddress() {
    return this.socket.remoteAddress;
  }
  private log(...params: Array<any>) {
    console.log(this.getRemoteAddress(), ...params);
  }
  private onData = (data: Buffer) => {
    data
      .toString()
      .split('\n')
      .forEach(line => {
        if (line.trim().length === 0) return;
        const params = line.trim().split(':');
        const command = params.shift();
        if (command === 'login' && params.length === 1) {
          this.login(params[0]);
        } else {
          this.log('comando inválido', line);
        }
      });
  };
  private onEnd = () => {
    Client.clients = Client.clients.filter(v => v != this);
    this.log('cliente desconectado');
  };
}

const server = createServer(socket => {
  const client = new Client(socket);
});

server.on('error', e => {
  console.error('erro no servidor: ', e);
});

server.listen(4321, () => {
  console.log('servidor em execução');
});
