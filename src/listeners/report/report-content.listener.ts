import { Injectable, Logger } from '@nestjs/common';
import { On } from '../../common/decorators';
import { GroupHttpService } from '../../shared/group';
import { CreateReportEvent } from '../../events/report/create-report.event';
import { ApproveReportEvent } from '../../events/report/approve-report.event';
import { NotificationService, TypeActivity, VerbActivity } from '../../notification';
import { ReportActivityService } from '../../notification/activities';
import { NotificationPayloadDto } from '../../notification/dto/requests/notification-payload.dto';
import { NotificationActivity } from '../../notification/dto/requests/notification-activity.dto';
import { PostService } from '../../modules/post/post.service';
import { SearchService } from '../../modules/search/search.service';
import { TargetType } from '../../modules/report-content/contstants';

@Injectable()
export class ReportContentListener {
  private readonly _logger = new Logger(ReportContentListener.name);
  public constructor(
    private readonly _groupService: GroupHttpService,
    private readonly _reportActivityService: ReportActivityService,
    private readonly _notificationService: NotificationService,
    private readonly _postService: PostService,
    private readonly _searchService: SearchService
  ) {}

  @On(CreateReportEvent)
  public async onReportCreated(event: CreateReportEvent): Promise<void> {
    this._logger.debug('[onReportCreated]');
    this._logger.debug(JSON.stringify(event, null, 4));
    const { payload } = event;

    const adminIdsMap = new Map<string, string[]>();

    await Promise.all(
      payload.details.map(async (d) => {
        const adminIds = await this._groupService.getAdminIds(
          {
            username: payload.actor.username,
            email: payload.actor.email,
          },
          d.groupId
        );
        adminIdsMap.set(d.groupId, adminIds);
        return null;
      })
    );

    const adminInfos = {};

    for (const [groupId, adminIds] of adminIdsMap.entries()) {
      adminInfos[groupId] = adminIds;
    }

    const actor = {
      id: payload.actor.id,
      email: payload.actor.email,
      username: payload.actor.username,
      fullname: payload.actor.profile.fullname,
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
            adminInfos: adminInfos,
          },
        },
      },
    };
    this._notificationService.publishReportNotification(notificationPayload);

    if (payload.targetType === TargetType.ARTICLE || payload.targetType === TargetType.POST) {
      this._postService
        .updateData([payload.targetId], {
          isReported: true,
        })
        .catch((ex) => this._logger.error(ex));
    }
  }

  @On(ApproveReportEvent)
  public async onReportApproved(event: ApproveReportEvent): Promise<void> {
    this._logger.debug('[onReportApproved]');
    this._logger.debug(JSON.stringify(event, null, 4));

    const { payload } = event;

    const actor = {
      id: payload.actor.id,
      email: payload.actor.email,
      username: payload.actor.username,
      fullname: payload.actor.profile.fullname,
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
            creatorId: payload.authorId,
          },
        },
      },
    };
    this._notificationService.publishReportNotification(notificationPayload);

    if (payload.targetType === TargetType.ARTICLE || payload.targetType === TargetType.POST) {
      this._postService
        .updateData([payload.targetId], {
          isHidden: true,
        })
        .catch((ex) => this._logger.error(ex));
      const posts = await this._postService.findPostByIds([payload.targetId]);
      this._searchService.deletePostsToSearch(posts).catch((ex) => this._logger.error(ex));
    }
  }
}
