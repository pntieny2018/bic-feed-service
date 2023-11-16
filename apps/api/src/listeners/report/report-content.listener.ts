import { Inject, Injectable, Logger } from '@nestjs/common';

import { On } from '../../common/decorators';
import { ApproveReportEvent } from '../../events/report/approve-report.event';
import { CreateReportEvent } from '../../events/report/create-report.event';
import { CommentService } from '../../modules/comment';
import { PostService } from '../../modules/post/post.service';
import { TargetType } from '../../modules/report-content/contstants';
import { SearchService } from '../../modules/search/search.service';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../modules/v2-group/application';
import { NotificationService, TypeActivity, VerbActivity } from '../../notification';
import { ReportActivityService } from '../../notification/activities';
import { NotificationActivity } from '../../notification/dto/requests/notification-activity.dto';
import { NotificationPayloadDto } from '../../notification/dto/requests/notification-payload.dto';

@Injectable()
export class ReportContentListener {
  private readonly _logger = new Logger(ReportContentListener.name);
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    private readonly _reportActivityService: ReportActivityService,
    private readonly _notificationService: NotificationService,
    private readonly _postService: PostService,
    private readonly _searchService: SearchService,
    private readonly _commentService: CommentService
  ) {}

  @On(CreateReportEvent)
  public async onReportCreated(event: CreateReportEvent): Promise<void> {
    this._logger.debug('[onReportCreated]');
    const { payload } = event;

    if (payload.targetType === TargetType.ARTICLE || payload.targetType === TargetType.POST) {
      this._postService
        .updateData([payload.targetId], {
          isReported: true,
        })
        .catch((ex) => this._logger.error(JSON.stringify(ex?.stack)));
      payload.details.forEach((dt) => {
        this._postService
          .unSavePostToUserCollection(dt.targetId, dt.createdBy)
          .catch((ex) => this._logger.error(JSON.stringify(ex?.stack)));
      });
    }

    const adminInfos = await this._groupAppService.getAdminIds(payload.groupIds);

    const actor = {
      id: payload.actor.id,
      email: payload.actor.email,
      username: payload.actor.username,
      fullname: payload.actor.fullname,
      avatar: payload.actor.avatar,
    };

    const activity = this._reportActivityService.createCreatedReportPayload({
      id: payload.id,
      actor: actor,
      targetId: payload.targetId,
      targetType: payload.targetType,
      status: payload.status,
      details: payload.details.map((rc) => {
        delete rc.createdBy;
        return rc;
      }),
      verb: VerbActivity.REPORT,
      target: TypeActivity.REPORT_CONTENT,
      createdAt: payload.details[0].createdAt,
    });

    const filterAdminInfo = {};

    for (const [key, value] of Object.entries(adminInfos.admins)) {
      filterAdminInfo[key] = value.filter((id) => actor.id !== id);
    }

    const notificationPayload: NotificationPayloadDto<NotificationActivity> = {
      key: payload.id,
      value: {
        actor: actor,
        event: event.getEventName(),
        data: activity,
        meta: {
          report: {
            adminInfos: filterAdminInfo,
            content: payload.content,
          },
        },
      },
    };
    this._notificationService.publishReportNotification(notificationPayload);
  }

  @On(ApproveReportEvent)
  public async onReportApproved(event: ApproveReportEvent): Promise<void> {
    this._logger.debug('[onReportApproved]');
    const { payload } = event;
    try {
      const adminInfos = await this._groupAppService.getAdminIds(payload.groupIds);

      const actor = {
        id: payload.actor.id,
        email: payload.actor.email,
        username: payload.actor.username,
        fullname: payload.actor.fullname,
        avatar: payload.actor.avatar,
      };

      const activity = this._reportActivityService.createCreatedReportPayload({
        id: payload.id,
        actor: actor,
        targetId: payload.targetId,
        targetType: payload.targetType,
        status: payload.status,
        details: payload.details.map((rc) => {
          delete rc.createdBy;
          return rc;
        }),
        verb: VerbActivity.APPROVE_REPORT_CONTENT,
        target: TypeActivity.REPORT_CONTENT,
        createdAt: payload.details[0].createdAt,
      });

      const notificationPayload: NotificationPayloadDto<NotificationActivity> = {
        key: payload.id,
        value: {
          actor: actor,
          event: event.getEventName(),
          data: activity,
          meta: {
            report: {
              adminInfos: adminInfos.admins,
              creatorId: payload.authorId,
            },
          },
        },
      };
      this._notificationService.publishReportNotification(notificationPayload);
    } catch (ex) {
      this._logger.debug(ex);
    }

    if (payload.targetType === TargetType.ARTICLE || payload.targetType === TargetType.POST) {
      this._postService
        .updateData([payload.targetId], {
          isHidden: true,
        })
        .catch((ex) => this._logger.error(JSON.stringify(ex)));
      const posts = await this._postService.findPostByIds([payload.targetId]);
      this._searchService
        .deletePostsToSearch(posts)
        .catch((ex) => this._logger.error(JSON.stringify(ex?.stack)));
    }

    if (payload.targetType === TargetType.COMMENT) {
      this._commentService
        .updateData([payload.targetId], {
          isHidden: true,
        })
        .catch((ex) => this._logger.error(JSON.stringify(ex)));
    }
  }
}
