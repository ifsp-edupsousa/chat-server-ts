import ChatClient from './clients/chat-client';

export default class Chat {
  private guests: Array<ChatClient> = [];
  private registered: Map<string, ChatClient> = new Map();

  addGuest(client: ChatClient): void {
    client.onCommand(this.processCommand.bind(this));
    this.guests.push(client);
  }

  processCommand(
    client: ChatClient,
    command: string,
    params: Array<string>
  ): void {
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

  removeClient(client: ChatClient) {
    if (!this.removeGuest(client)) this.removeRegisteredClient(client);
  }

  private doLogin(client: ChatClient, nickname: string) {
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
    sender: ChatClient,
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

  private getRegisteredClientList(): Array<ChatClient> {
    return Array.from(this.registered.values());
  }

  private getNicknamesList(): Array<string> {
    return Array.from(this.registered.keys());
  }

  private removeGuest(client: ChatClient): boolean {
    const guestIndex = this.guests.indexOf(client);
    if (guestIndex > -1) {
      this.guests.splice(guestIndex, 1);
      return true;
    }
    return false;
  }

  private removeRegisteredClient(client: ChatClient): boolean {
    for (let pair of this.registered.entries()) {
      if (pair[1] === client) {
        this.registered.delete(pair[0]);
        this.sendUserList();
        return true;
      }
    }
    return false;
  }

  private getNicknameForClient(client: ChatClient): string {
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
