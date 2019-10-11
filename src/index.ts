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
      this.sendMessage(client, destinatarios, mensagem);
    }
  }

  removeClient(client: Client) {
    if (!this.removeGuest(client)) this.removeRegisteredClient(client);
  }

  private doLogin(client: Client, nickname: string) {
    if (this.registered.has(nickname)) {
      client.writeLine('login:false');
    } else {
      this.removeGuest(client);
      this.registered.set(nickname, client);
      client.writeLine('login:true');
      this.sendUserList();
    }
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

  private sendMessage(
    sender: Client,
    recipients: Array<string>,
    message: string
  ) {
    const senderName = Array.from(this.registered.entries()).find(
      ([nickname, client]) => {
        if (client === sender) return true;
      }
    );
    if (senderName === undefined) return;
    const userList = Array.from(this.registered.keys());
    const broadcast = recipients.indexOf('*') > -1;
    let messageToSend = 'transmitir:' + senderName[0] + ':';
    let recipientList = userList;
    if (broadcast) {
      messageToSend += '*:';
    } else {
      recipientList = recipients.filter(recipient => {
        return userList.indexOf(recipient) > -1;
      });
      messageToSend += recipientList.join(';') + ':';
    }
    messageToSend += message;
    for (let recipient of recipientList) {
      let client = this.registered.get(recipient);
      client.writeLine(messageToSend);
    }
  }

  private sendUserList() {
    const userList = Array.from(this.registered.keys()).join(';');
    if (userList.length === 0) return;
    const message = 'lista_usuarios:' + userList;
    Array.from(this.registered.values()).forEach(client => {
      client.writeLine(message);
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
  writeLine(line: string) {
    this.socket.write(line + '\r\n');
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
