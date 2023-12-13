import { CONTENT_REPORT_REASON_TYPE, CONTENT_TARGET, CONTENT_TYPE } from '@beincom/constants';
import { ArrayHelper, StringHelper } from '@libs/common/helpers';
import { REPORT_STATUS } from '@libs/database/postgres/model';
import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { uniq, sumBy } from 'lodash';

import { EntityHelper } from '../../../../common/helpers';
import { ReportHiddenEvent, ReportCreatedEvent } from '../event';
import { ContentNotFoundException, ReportNotFoundException } from '../exception';
import { ArticleEntity, PostEntity } from '../model/content';
import { ReasonCount, ReportEntity } from '../model/report';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IContentRepository,
  IReportRepository,
  REPORT_REPOSITORY_TOKEN,
} from '../repositoty-interface';
import { GROUP_ADAPTER, IGroupAdapter } from '../service-adapter-interface';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../validator/interface';

import {
  CreateReportCommentProps,
  CreateReportContentProps,
  IReportDomainService,
  ProcessReportProps,
} from './interface';

export class ReportDomainService implements IReportDomainService {
  public constructor(
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(REPORT_REPOSITORY_TOKEN)
    private readonly _reportRepo: IReportRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepo: ICommentRepository,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,

    private readonly _event: EventBus
  ) {}

  public async reportContent(input: CreateReportContentProps): Promise<void> {
    const { authUser, content, reasonType, reason } = input;

    const groups = await this._groupAdapter.getGroupsByIds(content.getGroupIds());
    const rootGroupIds = uniq(groups.map((group) => group.rootGroupId));

    const reportEntities = await Promise.all(
      rootGroupIds.map((rootGroupId) =>
        this._reportToCommunity({
          rootGroupId,
          targetId: content.getId(),
          targetType: content instanceof PostEntity ? CONTENT_TARGET.POST : CONTENT_TARGET.ARTICLE,
          targetActorId: content.getCreatedBy(),
          reporterId: authUser.id,
          reasonType,
          reason,
        })
      )
    );

    this._event.publish(new ReportCreatedEvent({ reportEntities, authUser: authUser }));
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

    const groups = await this._groupAdapter.getGroupsByIds(contentEntity.getGroupIds());
    const rootGroupIds = uniq(groups.map((group) => group.rootGroupId));

    const reportEntities = await Promise.all(
      rootGroupIds.map((rootGroupId) =>
        this._reportToCommunity({
          rootGroupId,
          targetId: comment.get('id'),
          targetType: CONTENT_TARGET.COMMENT,
          targetActorId: comment.get('createdBy'),
          reporterId: authUser.id,
          reasonType,
          reason,
        })
      )
    );

    this._event.publish(new ReportCreatedEvent({ reportEntities, authUser: authUser }));
  }

  private async _reportToCommunity(data: {
    rootGroupId: string;
    targetId: string;
    targetType: CONTENT_TARGET;
    targetActorId: string;
    reporterId: string;
    reasonType: CONTENT_REPORT_REASON_TYPE;
    reason?: string;
  }): Promise<ReportEntity> {
    const { rootGroupId, targetId, targetType, targetActorId, reporterId, reasonType, reason } =
      data;

    let reportEntity = await this._reportRepo.findOne({
      groupId: rootGroupId,
      targetId,
      status: REPORT_STATUS.CREATED,
    });

    const reportDetail = { targetId, reporterId, reasonType, reason };

    if (reportEntity) {
      reportEntity.increaseReasonsCount(reasonType, reporterId);
      reportEntity.addReportDetail(reportDetail);

      await this._reportRepo.update(reportEntity);
    } else {
      reportEntity = ReportEntity.create(
        { groupId: rootGroupId, targetId, targetType, targetActorId },
        reportDetail
      );

      await this._reportRepo.create(reportEntity);
    }

    return reportEntity;
  }

  public async countReportReasonsByTargetId(
    targetId: string,
    groupId?: string
  ): Promise<ReasonCount[]> {
    const reportEntities = await this._reportRepo.findAll({ targetIds: [targetId] });

    if (!reportEntities.length) {
      return [];
    }

    groupId = groupId || reportEntities[0].get('groupId');
    return this._countReportReasonsPerGroup(reportEntities, groupId);
  }

  public async getReportReasonsMapByTargetIds(
    targetIds: string[]
  ): Promise<Record<string, ReasonCount[]>> {
    const reportEntities = await this._reportRepo.findAll({ targetIds });

    if (!reportEntities.length) {
      return {};
    }

    const reportEntityMapByTargetId = EntityHelper.entityArrayToArrayRecord<ReportEntity>(
      reportEntities,
      'targetId'
    );

    const reasonsCountMap: Record<string, ReasonCount[]> = {};

    for (const targetId of targetIds) {
      const reportEntities = reportEntityMapByTargetId[targetId] || [];
      const groupId = reportEntities[0].get('groupId');
      reasonsCountMap[targetId] = this._countReportReasonsPerGroup(reportEntities, groupId);
    }

    return reasonsCountMap;
  }

  private _countReportReasonsPerGroup(
    reportEntities: ReportEntity[],
    groupId: string
  ): ReasonCount[] {
    const reasonsCounts = reportEntities
      .filter((reportEntity) => reportEntity.get('groupId') === groupId)
      .map((reportEntity) => reportEntity.getReasonsCount())
      .flat();

    const reasonsCountMapByReasonType = ArrayHelper.convertArrayToArrayRecord<ReasonCount>(
      reasonsCounts,
      'reasonType'
    );

    return Object.keys(reasonsCountMapByReasonType).map((reasonType) => ({
      reasonType: reasonType as CONTENT_REPORT_REASON_TYPE,
      total: sumBy(reasonsCountMapByReasonType[reasonType], 'total'),
      reporterIds: uniq(
        reasonsCountMapByReasonType[reasonType].map((reasonCount) => reasonCount.reporterIds).flat()
      ),
    }));
  }

  public async getContentOfTargetReported(report: ReportEntity): Promise<{
    content: string;
    contentId: string;
    contentType: CONTENT_TYPE;
    parentCommentId: string;
  }> {
    const targetType = report.get('targetType');
    const targetId = report.get('targetId');

    let content;
    let contentId;
    let parentCommentId;
    let contentType;

    switch (targetType) {
      case CONTENT_TARGET.COMMENT: {
        const comment = await this._commentRepo.findOne({ id: targetId });
        const contentEntity = await this._contentRepo.findContentById(comment?.get('postId'));

        content = comment?.get('content') || '';
        contentId = comment?.get('postId') || '';
        parentCommentId = comment?.get('parentId') || '';
        contentType = contentEntity?.getType();
        break;
      }

      case CONTENT_TARGET.POST: {
        const post = (await this._contentRepo.findContentById(targetId)) as PostEntity;
        content = post?.getContent();
        contentId = post?.getId();
        contentType = post?.getType();
        break;
      }

      case CONTENT_TARGET.ARTICLE: {
        const article = (await this._contentRepo.findContentById(targetId)) as ArticleEntity;
        content = article?.getTitle();
        contentId = article?.getId();
        contentType = article?.getType();
        break;
      }

      default: {
        break;
      }
    }

    return {
      content: StringHelper.removeMarkdownCharacter(content).slice(0, 200),
      contentId,
      contentType,
      parentCommentId,
    };
  }

  public async ignoreReport(input: ProcessReportProps): Promise<void> {
    const { authUser, reportId, groupId } = input;

    const reportEntity = await this._reportRepo.findOne({
      id: reportId,
      groupId,
      status: REPORT_STATUS.CREATED,
    });

    if (!reportEntity) {
      throw new ReportNotFoundException();
    }

    await this._ignoreReportInMultipleCommunities(reportEntity.get('targetId'), authUser);
  }

  private async _ignoreReportInMultipleCommunities(
    targetId: string,
    authUser: UserDto
  ): Promise<ReportEntity[]> {
    const reportEntities = await this._reportRepo.findAll({
      targetIds: [targetId],
      status: REPORT_STATUS.CREATED,
    });

    for (const reportEntity of reportEntities) {
      reportEntity.updateStatus(REPORT_STATUS.IGNORED, authUser.id);
      await this._reportRepo.update(reportEntity);
    }

    return reportEntities;
  }

  public async hideReport(input: ProcessReportProps): Promise<void> {
    const { authUser, reportId, groupId } = input;

    const reportEntity = await this._reportRepo.findOne({
      id: reportId,
      groupId,
      status: REPORT_STATUS.CREATED,
    });

    if (!reportEntity) {
      throw new ReportNotFoundException();
    }

    const reportEntities = await this._hideReportInMultipleCommunities(
      reportEntity.get('targetId'),
      authUser
    );

    this._event.publish(new ReportHiddenEvent({ reportEntities, authUser }));
  }

  private async _hideReportInMultipleCommunities(
    targetId: string,
    authUser: UserDto
  ): Promise<ReportEntity[]> {
    const reportEntities = await this._reportRepo.findAll({
      targetIds: [targetId],
      status: REPORT_STATUS.CREATED,
    });

    for (const reportEntity of reportEntities) {
      reportEntity.updateStatus(REPORT_STATUS.HIDDEN, authUser.id);
      await this._reportRepo.update(reportEntity);
    }

    return reportEntities;
  }
}
