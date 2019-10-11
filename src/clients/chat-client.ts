export type ChatCommandCallback = (
  client: ChatClient,
  command: string,
  params: Array<string>
) => void;

export type ChatDisconnectCallback = (client: ChatClient) => void;

export default interface ChatClient {
  disconnect(): void;
  sendMessage(message: string): void;
  log(...params: Array<any>): void;
  onCommand(cb: ChatCommandCallback): void;
  onDisconnect(cb: ChatDisconnectCallback): void;
}
