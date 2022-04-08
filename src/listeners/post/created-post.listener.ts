import { NotificationService } from '../../notification';
import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { OnEvent } from '@nestjs/event-emitter';
import { ElasticsearchHelper } from '../../common/helpers';
import { CreatedPostEvent } from '../../events/post';

@Injectable()
export class CreatedPostListener {
  private _logger = new Logger(CreatedPostListener.name);
  public constructor(
    private readonly _notificationService: NotificationService,
    private readonly _elasticsearchService: ElasticsearchService
  ) {}

  @OnEvent(CreatedPostEvent.event)
  public async onPostCreated(createdPostEvent: CreatedPostEvent): Promise<boolean> {
    return;
  }
}
