import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isBoolean } from 'class-validator';

import { IPaginatedInfo, OrderEnum } from '../../../../../../common/dto';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
} from '../../../../../v2-user/application';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  GetScheduledContentProps,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import { ArticleDto } from '../../../dto';
import { PublishArticleCommand } from '../publish-article';

import { ProcessArticleScheduledCommand } from './process-article-scheduled.command';

@CommandHandler(ProcessArticleScheduledCommand)
export class ProcessArticleScheduledHandler
  implements ICommandHandler<ProcessArticleScheduledCommand, void>
{
  private readonly LIMIT_DEFAULT = 100;

  public constructor(
    private readonly _commandBus: CommandBus,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService
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

    for (const row of rows) {
      try {
        const actor = await this._userApplicationService.findOne(row.getCreatedBy(), {
          withPermission: true,
          withGroupJoined: true,
        });
        await this._commandBus.execute<PublishArticleCommand, ArticleDto>(
          new PublishArticleCommand({
            id: row.getId(),
            actor,
          })
        );
      } catch (e) {
        row.setScheduleFailed();
        row.setErrorLog({
          message: e?.message,
          code: e?.code,
          stack: JSON.stringify(e?.stack),
        });
        await this._contentRepository.update(row);
      }
    }

    await this._recursivelyHandleScheduledContent(payload, meta);
  }
}
