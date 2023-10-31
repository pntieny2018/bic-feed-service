import {
  WsCommentCreatedEventHandler,
  WsQuizGeneratedEventHandler,
  WsReactionEventHandler,
} from '../application/event-handler/websocket';

export const webSocketProvider = [
  /** Application Event Handler */
  WsCommentCreatedEventHandler,
  WsQuizGeneratedEventHandler,
  WsReactionEventHandler,
];
