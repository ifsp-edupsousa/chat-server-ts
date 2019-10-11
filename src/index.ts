import { createServer, Socket } from 'net';

class Chat {
  private clients: Array<Client> = [];

  newClient(socket: Socket): Client {
    const client = new Client(socket, this);
    this.clients.push(client);
    return client;
  }
  writeToAll(message: string, onlyLoggedIn: boolean = false) {
    console.log(message);
    this.clients.forEach(c => {
      if (onlyLoggedIn && !c.isLoggedIn()) return;
      c.writeLine(message);
    });
  }
  writeToAllExcept(message: string, except: Client) {
    console.log(message);
    this.clients.forEach(c => {
      if (c === except) return;
      c.writeLine(message);
    });
  }
  removeClient(client: Client) {
    this.clients = this.clients.filter(v => v != client);
  }
  sendUserList() {
    const userList = this.clients.reduce((list, client) => {
      if (client.isLoggedIn()) list.push(client.getNickname());
      return list;
    }, []);
    if (userList.length === 0) return;
    const message = 'users:' + userList.join(':');
    this.writeToAll(message, true);
  }
}

class Client {
  private socket: Socket;
  private chat: Chat;
  private loggedIn: boolean = false;
  private nickname: string;

  constructor(socket: Socket, chat: Chat) {
    this.chat = chat;
    this.socket = socket;
    this.socket.on('end', this.onEnd);
    this.socket.on('data', this.onData);

    this.log('cliente conectado');
  }
  private login(nickname: string) {
    this.log('login:' + nickname);
    this.loggedIn = true;
    this.nickname = nickname;
    this.chat.sendUserList();
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
    this.chat.removeClient(this);
    this.log('cliente desconectado');
  };
}

const chat = new Chat();

const server = createServer(socket => {
  chat.newClient(socket);
});

server.on('error', e => {
  console.error('erro no servidor: ', e);
});

server.listen(4321, () => {
  console.log('servidor em execução');
});
