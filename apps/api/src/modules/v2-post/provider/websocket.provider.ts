import {
  WsCommentCreatedEventHandler,
  WsPostVideoFailedEventHandler,
  WsPostVideoSuccessEventHandler,
  WsQuizGeneratedEventHandler,
  WsReactionCreatedEventHandler,
  WsReactionDeletedEventHandler,
} from '../application/event-handler/websocket';

export const webSocketProvider = [
  /** Application Event Handler */
  WsCommentCreatedEventHandler,
  WsQuizGeneratedEventHandler,
  WsReactionCreatedEventHandler,
  WsReactionDeletedEventHandler,
  WsPostVideoSuccessEventHandler,
  WsPostVideoFailedEventHandler,
];
