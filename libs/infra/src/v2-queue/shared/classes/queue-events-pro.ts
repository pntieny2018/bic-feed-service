import { QueueEvents, QueueEventsOptions, QueueEventsListener, QueueBase } from 'bullmq';

import { RedisConnectionPro } from './redis-connection-pro';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface QueueEventsListenerPro extends QueueEventsListener {
  /**
   * Listen to 'groups:paused' event.
   *
   * This event is triggered when a group is paused.
   */
  ['groups:paused']: (
    args: {
      groupId: string;
    },
    id: string
  ) => void;
  /**
   * Listen to 'groups:resumed' event.
   *
   * This event is triggered when a group is resumed.
   */
  ['groups:resumed']: (
    args: {
      groupId: string;
    },
    id: string
  ) => void;
}
export class QueueEventsPro extends QueueEvents {
  public constructor(name: string, opts?: QueueEventsOptions) {
    super(name, opts ?? {}, RedisConnectionPro);
  }

  public emit<U extends keyof QueueEventsListenerPro>(event: U, ...args: any[]): boolean {
    return QueueBase.prototype.emit.call(this, event, ...args);
  }

  public off<U extends keyof QueueEventsListenerPro>(
    eventName: U,
    listener: QueueEventsListenerPro[U]
  ): this {
    QueueBase.prototype.off.call(this, eventName, listener);
    return this;
  }

  public on<U extends keyof QueueEventsListenerPro>(
    event: U,
    listener: QueueEventsListenerPro[U]
  ): this {
    QueueBase.prototype.on.call(this, event, listener);
    return this;
  }

  public once<U extends keyof QueueEventsListenerPro>(
    event: U,
    listener: QueueEventsListenerPro[U]
  ): this {
    QueueBase.prototype.once.call(this, event, listener);
    return this;
  }
}
