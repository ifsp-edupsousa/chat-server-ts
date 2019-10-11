export default interface ChatClient {
  disconnect(): void;
  sendMessage(message: string): void;
  log(...params: Array<any>): void;
}
