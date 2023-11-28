import { CONTENT_REPORT_REASONS, CONTENT_TARGET } from '@beincom/constants';
import { ArrayHelper, StringHelper } from '@libs/common/helpers';
import { REPORT_STATUS } from '@libs/database/postgres/model';
import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { uniq, uniqBy } from 'lodash';

import { ReportReasonCountDto } from '../../application/dto';
import { ReportHiddenEvent, ReportCreatedEvent } from '../event';
import { ContentNotFoundException, ReportNotFoundException } from '../exception';
import { ArticleEntity, PostEntity } from '../model/content';
import { ReportDetailAttributes, ReportEntity } from '../model/report';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IContentRepository,
  IReportRepository,
  REPORT_REPOSITORY_TOKEN,
} from '../repositoty-interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  IUserAdapter,
  USER_ADAPTER,
} from '../service-adapter-interface';
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
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepo: ICommentRepository,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,

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

  public async countReportReasons(
    reportDetails: ReportDetailAttributes[],
    reporters?: UserDto[]
  ): Promise<ReportReasonCountDto[]> {
    const reasonTypes = uniq(reportDetails.map((detail) => detail.reasonType));

    let reporterMap: Record<string, UserDto> = {};
    if (reporters) {
      reporterMap = ArrayHelper.convertArrayToObject(reporters, 'id');
    }

    return reasonTypes.map((reasonType) => {
      const reasonTypeDetails = reportDetails.filter((detail) => detail.reasonType === reasonType);
      const totalReasonWithUniqueReporter = uniqBy(
        reasonTypeDetails,
        (detail) => detail.createdBy
      ).length;

      const reason = CONTENT_REPORT_REASONS.find((reason) => reason.id === reasonType);

      const reporterIds = uniq(reasonTypeDetails.map((detail) => detail.createdBy));
      const reasonReporters = reporterIds.map((id) => reporterMap[id]);

      return {
        reasonType,
        description: reason?.description,
        total: totalReasonWithUniqueReporter,
        reporters: reporters ? reasonReporters : undefined,
      };
    });
  }

  public async getContentOfTargetReported(report: ReportEntity): Promise<string> {
    const targetType = report.get('targetType');
    const targetId = report.get('targetId');

    let content = '';

    switch (targetType) {
      case CONTENT_TARGET.COMMENT: {
        const comment = await this._commentRepo.findOne({ id: targetId });
        content = comment?.get('content') || '';
      }

      case CONTENT_TARGET.POST: {
        const post = (await this._contentRepo.findContentById(targetId)) as PostEntity;
        return post?.get('content') || '';
      }

      case CONTENT_TARGET.ARTICLE: {
        const article = (await this._contentRepo.findContentById(targetId)) as ArticleEntity;
        content = article?.get('title') || '';
      }

      default: {
        break;
      }
    }

    return StringHelper.removeMarkdownCharacter(content).slice(0, 200);
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

  public async hideReport(input: ProcessReportProps): Promise<void> {
    const { authUser, reportId, groupId } = input;

    const reportEntity = await this._reportRepo.findOne({
      where: { id: reportId, status: REPORT_STATUS.CREATED },
      include: { details: true },
    });

    this._reportValidator.validateReportInGroup(reportEntity, groupId);

    reportEntity.updateStatus(REPORT_STATUS.HIDDEN);

    if (reportEntity.isChanged()) {
      await this._reportRepo.update(reportEntity);
    }

    this._event.publish(new ReportHiddenEvent({ report: reportEntity, authUser }));
  }

  public async getReportById(id: string): Promise<ReportEntity> {
    const report = await this._reportRepo.findOne({
      where: { id },
    });

    if (!report) {
      throw new ReportNotFoundException();
    }

    return report;
  }
}
