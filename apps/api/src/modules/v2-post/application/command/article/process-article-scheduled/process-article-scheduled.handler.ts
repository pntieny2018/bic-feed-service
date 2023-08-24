import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isBoolean } from 'class-validator';

import { IPaginatedInfo, OrderEnum } from '../../../../../../common/dto';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  GetScheduledContentProps,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { IQueueAdapter, QUEUE_ADAPTER } from '../../../../domain/infra-adapter-interface';
import { IUserAdapter, USER_ADAPTER } from '../../../../domain/service-adapter-interface ';

import { ProcessArticleScheduledCommand } from './process-article-scheduled.command';

@CommandHandler(ProcessArticleScheduledCommand)
export class ProcessArticleScheduledHandler
  implements ICommandHandler<ProcessArticleScheduledCommand, void>
{
  private readonly LIMIT_DEFAULT = 100;

  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,
    @Inject(QUEUE_ADAPTER)
    private readonly _queueAdapter: IQueueAdapter
  ) {}

  public async execute(command: ProcessArticleScheduledCommand): Promise<void> {
    const beforeDate = command.payload.beforeDate;
    const payload: GetScheduledContentProps = {
      limit: this.LIMIT_DEFAULT,
      order: OrderEnum.DESC,
      beforeDate,
    };
    return this._recursivelyHandleScheduledContent(payload);
  }

  private async _recursivelyHandleScheduledContent(
    payload: GetScheduledContentProps,
    metadata?: IPaginatedInfo
  ): Promise<void> {
    const { hasNextPage, endCursor } = metadata || {};

    if (isBoolean(hasNextPage) && hasNextPage === false) {
      return;
    }

    const { rows, meta } = await this._contentDomainService.getScheduledContent({
      ...payload,
      after: endCursor,
    });

    if (!rows || rows.length === 0) {
      return;
    }

    const contentOwnerIds = rows.map((row) => row.getCreatedBy());
    const contentOwners = await this._userAdapter.getUsersByIds(contentOwnerIds, {
      withPermission: true,
      withGroupJoined: true,
    });

    const contentScheduledJobPayloads = rows.map((row) => ({
      articleId: row.getId(),
      articleOwner: contentOwners.find((owner) => owner.id === row.getCreatedBy()),
    }));

    await this._queueAdapter.addArticleScheduledJob(contentScheduledJobPayloads);

    await this._recursivelyHandleScheduledContent(payload, meta);
  }
}
