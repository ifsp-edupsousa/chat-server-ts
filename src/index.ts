import { createServer, Socket } from 'net';

class Chat {
  private guests: Array<Client> = [];
  private registered: Map<string, Client> = new Map();

  newClient(socket: Socket): Client {
    const client = new Client(socket, this);
    this.guests.push(client);
    return client;
  }

  processCommand(client: Client, command: string, params: Array<string>) {
    if (command === 'login' && params.length === 1) {
      let nickname = params[0];
      this.doLogin(client, nickname);
    } else if (command === 'mensagem' && params.length >= 2) {
      const destinatarios = params.shift().split(';');
      const mensagem = params.shift();
      this.doMessage(client, destinatarios, mensagem);
    } else if (command === 'sair') {
      client.disconnect();
    }
  }

  removeClient(client: Client) {
    if (!this.removeGuest(client)) this.removeRegisteredClient(client);
  }

  private doLogin(client: Client, nickname: string) {
    if (this.registered.has(nickname)) {
      client.sendMessage('login:false');
    } else {
      this.removeGuest(client);
      this.registered.set(nickname, client);
      client.sendMessage('login:true');
      this.sendUserList();
    }
  }

  private doMessage(
    sender: Client,
    recipients: Array<string>,
    message: string
  ) {
    const senderName = this.getNicknameForClient(sender);
    if (senderName === undefined) return;
    const nicknameList = this.getNicknamesList();
    const broadcast = recipients.indexOf('*') > -1;
    let messageToSend = 'transmitir:' + senderName + ':';
    let recipientList = nicknameList;
    if (broadcast) {
      messageToSend += '*:';
    } else {
      recipientList = recipients.filter(recipient => {
        return nicknameList.indexOf(recipient) > -1;
      });
      messageToSend += recipientList.join(';') + ':';
    }
    messageToSend += message;
    this.sendTo(messageToSend, recipientList);
  }

  private getRegisteredClientList(): Array<Client> {
    return Array.from(this.registered.values());
  }

  private getNicknamesList(): Array<string> {
    return Array.from(this.registered.keys());
  }

  private removeGuest(client: Client): boolean {
    const guestIndex = this.guests.indexOf(client);
    if (guestIndex > -1) {
      this.guests.splice(guestIndex, 1);
      return true;
    }
    return false;
  }

  private removeRegisteredClient(client: Client): boolean {
    for (let pair of this.registered.entries()) {
      if (pair[1] === client) {
        this.registered.delete(pair[0]);
        this.sendUserList();
        return true;
      }
    }
    return false;
  }

  private getNicknameForClient(client: Client): string {
    const entry = Array.from(this.registered.entries()).find(entry => {
      if (client === entry[1]) return true;
    });
    if (entry === undefined) return undefined;
    return entry[0];
  }

  private sendTo(message: string, toList: Array<string>) {
    for (let to of toList) {
      let client = this.registered.get(to);
      if (client === undefined) continue;
      client.sendMessage(message);
    }
  }

  private sendUserList() {
    const userList = this.getNicknamesList().join(';');
    if (userList.length === 0) return;
    const message = 'lista_usuarios:' + userList;
    this.getRegisteredClientList().forEach(client => {
      client.sendMessage(message);
    });
  }
}

class Client {
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
    console.log(this.socket.remoteAddress, ...params);
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
