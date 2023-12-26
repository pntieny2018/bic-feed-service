import { IKafkaProducerMessage } from '@libs/infra/kafka';

import { IEventData } from './interface';

export class BaseEvent<T extends IEventData> implements IKafkaProducerMessage {
  public key: string;
  public value: {
    rooms: string[];
    data: T;
  };

  public constructor(payload: BaseEvent<T>) {
    Object.assign(this, payload);
  }
}
