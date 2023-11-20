import { CONTENT_REPORT_REASONS, CONTENT_TARGET } from '@beincom/constants';
import { REPORT_STATUS } from '@libs/database/postgres/model';
import { Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { ReportReasonCountDto } from '../../application/dto';
import { ReportCreatedEvent } from '../event';
import { ContentNotFoundException } from '../exception';
import { PostEntity } from '../model/content';
import { ReportDetailAttributes, ReportEntity } from '../model/report';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IReportRepository,
  REPORT_REPOSITORY_TOKEN,
} from '../repositoty-interface';
import { GROUP_ADAPTER, IGroupAdapter } from '../service-adapter-interface';
import {
  CONTENT_VALIDATOR_TOKEN,
  IContentValidator,
  IReportValidator,
  REPORT_VALIDATOR_TOKEN,
} from '../validator/interface';

import {
  CreateReportCommentProps,
  CreateReportContentProps,
  CreateReportProps,
  IReportDomainService,
  ProcessReportProps,
} from './interface';

export class ReportDomainService implements IReportDomainService {
  public constructor(
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(REPORT_VALIDATOR_TOKEN)
    private readonly _reportValidator: IReportValidator,
    @Inject(REPORT_REPOSITORY_TOKEN)
    private readonly _reportRepo: IReportRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,

    private readonly _event: EventBus
  ) {}

  public async reportContent(input: CreateReportContentProps): Promise<void> {
    const { authUser, content, reasonType, reason } = input;

    await this._createReport({
      targetId: content.getId(),
      targetType: content instanceof PostEntity ? CONTENT_TARGET.POST : CONTENT_TARGET.ARTICLE,
      targetActorId: content.getCreatedBy(),
      groupIds: content.getGroupIds(),
      authUser,
      reasonType,
      reason,
    });
  }

  public async reportComment(input: CreateReportCommentProps): Promise<void> {
    const { authUser, comment, reasonType, reason } = input;

    const contentEntity = await this._contentRepo.findContentById(comment.get('postId'), {
      mustIncludeGroup: true,
    });
    if (!contentEntity || !contentEntity.isVisible()) {
      throw new ContentNotFoundException();
    }

    await this._contentValidator.checkCanReadContent(contentEntity, authUser);

    await this._createReport({
      targetId: comment.get('id'),
      targetType: CONTENT_TARGET.COMMENT,
      targetActorId: comment.get('createdBy'),
      groupIds: contentEntity.getGroupIds(),
      authUser,
      reasonType,
      reason,
    });
  }

  private async _createReport(
    data: CreateReportProps & {
      targetId: string;
      targetType: CONTENT_TARGET;
      targetActorId: string;
      groupIds: string[];
    }
  ): Promise<void> {
    const { targetId, targetType, targetActorId, groupIds, authUser, reasonType, reason } = data;

    let reportEntity = await this._reportRepo.findOne({
      where: { targetId },
      include: { details: true },
    });

    const groups = await this._groupAdapter.getGroupsByIds(groupIds);
    const rootGroupIds = groups.map((group) => group.rootGroupId);

    const reportDetails = rootGroupIds.map((groupId) => ({
      groupId,
      createdBy: authUser.id,
      reasonType,
      reason,
    }));

    if (reportEntity) {
      if (reportEntity.isIgnored()) {
        reportEntity.updateStatus(REPORT_STATUS.CREATED);
      }
      reportEntity.addDetails(reportDetails);

      await this._reportRepo.update(reportEntity);
    } else {
      const report = {
        targetId,
        targetType,
        targetActorId,
        status: REPORT_STATUS.CREATED,
      };
      reportEntity = ReportEntity.create(report, reportDetails);

      await this._reportRepo.create(reportEntity);
    }

    this._event.publish(new ReportCreatedEvent({ report: reportEntity, authUser: authUser }));
  }

  public countReportReasons(reportDetails: ReportDetailAttributes[]): ReportReasonCountDto[] {
    const reasonTypes = uniq(reportDetails.map((detail) => detail.reasonType));

    return reasonTypes.map((reasonType) => {
      const reasonTypeDetails = reportDetails.filter((detail) => detail.reasonType === reasonType);
      const reason = CONTENT_REPORT_REASONS.find((reason) => reason.id === reasonType);

      return {
        reasonType,
        description: reason?.description,
        total: reasonTypeDetails.length,
      };
    });
  }

  public async ignoreReport(input: ProcessReportProps): Promise<void> {
    const { reportId, groupId } = input;

    const reportEntity = await this._reportRepo.findOne({
      where: { id: reportId, status: REPORT_STATUS.CREATED },
      include: { details: true },
    });

    this._reportValidator.validateReportInGroup(reportEntity, groupId);

    reportEntity.updateStatus(REPORT_STATUS.IGNORED);

    if (reportEntity.isChanged()) {
      await this._reportRepo.update(reportEntity);
    }
  }
}
