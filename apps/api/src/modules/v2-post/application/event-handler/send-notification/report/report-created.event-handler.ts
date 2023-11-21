import { CONTENT_TARGET, CONTENT_TYPE } from '@beincom/constants';
import { StringHelper } from '@libs/common/helpers';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { ReportCreatedEvent } from '../../../../domain/event';
import { ArticleEntity, PostEntity } from '../../../../domain/model/content';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  INotificationAdapter,
  IUserAdapter,
  NOTIFICATION_ADAPTER,
  USER_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { IReportBinding, REPORT_BINDING_TOKEN } from '../../../binding';
import { ReportDetailDto } from '../../../dto';

@EventsHandlerAndLog(ReportCreatedEvent)
export class NotiReportCreatedEventHandler implements IEventHandler<ReportCreatedEvent> {
  public constructor(
    @Inject(REPORT_BINDING_TOKEN)
    private readonly _reportBinding: IReportBinding,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepo: ICommentRepository,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter
  ) {}

  public async handle(event: ReportCreatedEvent): Promise<void> {
    const { report, authUser } = event.payload;

    const reportDto = this._reportBinding.binding(report);

    const groupIds = uniq(reportDto.details.map((detail) => detail.groupId));
    const groupAdminMap = await this._groupAdapter.getGroupAdminMap(groupIds);

    let content = '';
    let targetContent: PostEntity | ArticleEntity;
    switch (reportDto.targetType) {
      case CONTENT_TARGET.COMMENT:
        const comment = await this._commentRepo.findOne({
          id: reportDto.targetId,
        });
        targetContent = (await this._contentRepo.findOne({
          where: {
            id: comment.get('postId'),
          },
          include: {
            mustIncludeGroup: true,
          },
        })) as PostEntity | ArticleEntity;
        content = comment.get('content');
        break;

      case CONTENT_TARGET.ARTICLE:
      case CONTENT_TARGET.POST:
        targetContent = (await this._contentRepo.findOne({
          where: {
            id: reportDto.targetId,
          },
          include: {
            mustIncludeGroup: true,
          },
        })) as PostEntity | ArticleEntity;

        content =
          targetContent.getType() === CONTENT_TYPE.POST
            ? (targetContent as PostEntity).get('content')
            : (targetContent as ArticleEntity).get('title');

        StringHelper.removeMarkdownCharacter(content).slice(0, 200);
        break;

      default:
        break;
    }

    const postGroupIds = targetContent.getGroupIds();

    reportDto.details = postGroupIds.map((groupId) => {
      return new ReportDetailDto({
        groupId,
        targetId: reportDto.targetId,
        targetType: reportDto.targetType,
      });
    });

    const actorsReportedIds = uniq(reportDto.details.map((detail) => detail.createdBy));
    const actorsReported = await this._userAdapter.getUsersByIds(actorsReportedIds);

    await this._notiAdapter.sendReportCreatedNotification({
      report: reportDto,
      actor: authUser,
      adminInfos: groupAdminMap,
      content,
      actorsReported,
    });
  }
}
