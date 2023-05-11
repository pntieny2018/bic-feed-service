import { ISocketIoConfig } from './socket-io-config.interface';

export const getSocketIoConfig = (): ISocketIoConfig => ({
  path: process.env.WS_PATH,
  transports: (process.env.WS_TRANSPORTS ?? '').split(','),
  pingInterval: parseInt(process.env.WS_PING_INTERVAL) || 30000,
  pingTimeout: parseInt(process.env.WS_PING_TIMEOUT) || 30000,
  cookie: true,
  customMsgPack: process.env.WS_CUSTOM_MSGPACK === 'true',
});
