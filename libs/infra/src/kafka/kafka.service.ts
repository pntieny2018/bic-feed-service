import { HEADER_REQ_ID } from '@libs/common/constants';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Producer } from '@nestjs/microservices/external/kafka.interface';
import { ClsService } from 'nestjs-cls';
import { Observable, from } from 'rxjs';
import { v4 } from 'uuid';

import { KAFKA_TOKEN } from './kafka.constant';
import { IKafkaProducerMessage } from './kafka.interface';
import { IKafkaService } from './kafka.service.interface';

@Injectable()
export class KafkaService implements IKafkaService {
  private readonly _logger = new Logger(KafkaService.name);
  private readonly _producerOb: Observable<Producer>;

  public constructor(
    @Inject(KAFKA_TOKEN) private readonly _kafkaClient: ClientKafka,
    private readonly _clsService: ClsService
  ) {
    this._producerOb = from(this._kafkaClient.connect());
  }

  public emit(topic: string, payload: IKafkaProducerMessage): void {
    const topicName = `${process.env.KAFKA_ENV}.${topic}`;
    const headers = {
      [HEADER_REQ_ID]: this._clsService.getId() ?? v4(),
    };
    const message = {
      key: payload['key'],
      value: JSON.stringify(payload['value']),
      headers,
    };

    const record = {
      topic: topicName,
      messages: [message],
    };

    const sub = this._producerOb.subscribe({
      next: (producer) => producer.send(record),
      error: (e) => this._logger.error(`Producing msg to ${topicName} failed: ${e.message}`),
      complete: () => {
        this._logger.debug(
          `Produced msg to ${topicName}: ${JSON.stringify({
            ...message,
            value: JSON.parse(message.value),
          })}`
        );
        sub.unsubscribe();
      },
    });
  }

  public sendMessages(topic: string, messages: IKafkaProducerMessage[]): void {
    const topicName = `${process.env.KAFKA_ENV}.${topic}`;
    const headers = {
      [HEADER_REQ_ID]: this._clsService.getId() ?? v4(),
    };

    const record = {
      topic: topicName,
      messages: messages.map((item) => ({
        key: item['key'] || null,
        value: JSON.stringify(item['value']),
        headers,
      })),
    };

    const sub = this._producerOb.subscribe({
      next: (producer) => producer.send(record),
      error: (e) => this._logger.error(`Producing msg to ${topicName} failed: ${e.message}`),
      complete: () => {
        this._logger.debug(
          `Produced msg to ${topicName}: ${JSON.stringify({
            ...record.messages,
          })}`
        );
        sub.unsubscribe();
      },
    });
  }

  public async commitOffsets(topic: string, partition: number, offset: string): Promise<void> {
    try {
      await this._kafkaClient.commitOffsets([{ topic, partition, offset }]);
      this._logger.debug(
        `Commited offset successful: ${JSON.stringify({ topic, partition, offset })}`
      );
    } catch (err) {
      this._logger.error(err);
      throw new Error(
        `Error while committing offsets: ${JSON.stringify({ topic, partition, offset })}`
      );
    }
  }
}
