import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { QueueName } from '../data-type';
import { IPublisher } from '../domain/infra-interface';
import { queueNameToToken } from '../utils';

@Injectable()
export class PublisherFactoryService {
  public constructor(protected readonly moduleRef: ModuleRef) {}

  public async send(
    payloads: ({ channelType: QueueName; data: Record<any, any> } & Record<any, any>)[]
  ): Promise<void> {
    await Promise.all(
      payloads.map(async (payload) => {
        const { channelType, ...data } = payload;
        const sender = this.moduleRef.get<IPublisher>(queueNameToToken(channelType), {
          strict: false,
        });
        if (sender && data?.data) {
          return sender.add();
        }
      })
    );
  }
}
