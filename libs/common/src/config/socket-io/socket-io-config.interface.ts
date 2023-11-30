export interface ISocketIoConfig {
  path: string;
  transports: string[];
  pingInterval: number;
  pingTimeout: number;
  customMsgPack: boolean;
  cookie: boolean;
}
