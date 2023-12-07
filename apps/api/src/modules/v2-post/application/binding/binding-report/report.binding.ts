import { CONTENT_REPORT_REASONS, CONTENT_TARGET } from '@beincom/constants';
import { ArrayHelper } from '@libs/common/helpers';
import { Inject } from '@nestjs/common';
import { uniq } from 'lodash';

import { EntityHelper } from '../../../../../common/helpers';
import { CommentEntity } from '../../../domain/model/comment';
import { ArticleEntity, PostEntity } from '../../../domain/model/content';
import { ReasonCount, ReportEntity } from '../../../domain/model/report';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IContentRepository,
} from '../../../domain/repositoty-interface';
import { IUserAdapter, USER_ADAPTER } from '../../../domain/service-adapter-interface';
import { ReportDto, ReportForManagerDto, ReportReasonCountDto } from '../../dto';

import { IReportBinding } from './report.interface';

export class ReportBinding implements IReportBinding {
  public constructor(
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepo: ICommentRepository
  ) {}

  public binding(entity: ReportEntity): ReportDto {
    return new ReportDto({
      id: entity.get('id'),
      groupId: entity.get('groupId'),
      reportTo: entity.get('reportTo'),
      targetId: entity.get('targetId'),
      targetType: entity.get('targetType'),
      targetActorId: entity.get('targetActorId'),
      reasonsCount: this.bindingReportReasonsCount(entity.getReasonsCount()),
      status: entity.get('status'),
      processedBy: entity.get('processedBy'),
      processedAt: entity.get('processedAt'),
      createdAt: entity.get('createdAt'),
      updatedAt: entity.get('updatedAt'),
    });
  }

  public async bindingReportsWithReportersInReasonsCount(
    entities: ReportEntity[]
  ): Promise<ReportDto[]> {
    const reporterIds = uniq(
      entities
        .map((entity) =>
          entity
            .getReasonsCount()
            .map((reasonCount) => reasonCount.reporterIds)
            .flat()
        )
        .flat()
    );
    const reporters = await this._userAdapter.getUsersByIds(reporterIds);

    return entities.map((entity) => {
      const reasonsCountWithReporters = entity.getReasonsCount().map((reasonCount) => {
        const reason = CONTENT_REPORT_REASONS.find(
          (reason) => reason.id === reasonCount.reasonType
        );
        return {
          reasonType: reasonCount.reasonType,
          description: reason?.description,
          total: reasonCount.total,
          reporters: reporters.filter((reporter) => reasonCount.reporterIds.includes(reporter.id)),
        };
      });

      return new ReportDto({
        id: entity.get('id'),
        groupId: entity.get('groupId'),
        reportTo: entity.get('reportTo'),
        targetId: entity.get('targetId'),
        targetType: entity.get('targetType'),
        targetActorId: entity.get('targetActorId'),
        reasonsCount: reasonsCountWithReporters,
        status: entity.get('status'),
        processedBy: entity.get('processedBy'),
        processedAt: entity.get('processedAt'),
        createdAt: entity.get('createdAt'),
        updatedAt: entity.get('updatedAt'),
      });
    });
  }

  public async bindingReportsForManager(entities: ReportEntity[]): Promise<ReportForManagerDto[]> {
    let commentMap: Record<string, CommentEntity>;
    let contentMap: Record<string, PostEntity | ArticleEntity>;

    const targetActorIds = uniq(entities.map((entity) => entity.get('targetActorId')));
    const actors = await this._userAdapter.getUsersByIds(targetActorIds);
    const actorMap = ArrayHelper.convertArrayToObject(actors, 'id');

    const commentIds = entities
      .filter((entity) => entity.get('targetType') === CONTENT_TARGET.COMMENT)
      .map((entity) => entity.get('targetId'));
    if (commentIds.length) {
      const comments = await this._commentRepo.findAll({ id: commentIds });
      commentMap = EntityHelper.entityArrayToRecord(comments, 'id');
    }

    const contentIds = entities
      .filter((entity) => entity.get('targetType') !== CONTENT_TARGET.COMMENT)
      .map((entity) => entity.get('targetId'));
    if (contentIds.length) {
      const contents = (await this._contentRepo.findAll({ where: { ids: contentIds } })) as (
        | PostEntity
        | ArticleEntity
      )[];
      contentMap = EntityHelper.entityArrayToRecord(contents, 'id');
    }

    const reports: ReportForManagerDto[] = [];

    for (const entity of entities) {
      const targetId = entity.get('targetId');
      const targetType = entity.get('targetType');

      const targetActor = actorMap[entity.get('targetActorId')];
      const reasonsCount = this.bindingReportReasonsCount(entity.getReasonsCount());

      let content;
      switch (targetType) {
        case CONTENT_TARGET.COMMENT:
          content = commentMap[targetId].get('content');
          break;

        case CONTENT_TARGET.POST:
          content = contentMap[targetId].getContent();
          break;

        case CONTENT_TARGET.ARTICLE:
          content = contentMap[targetId].getTitle();
          break;

        default:
          break;
      }

      reports.push({
        id: entity.get('id'),
        groupId: entity.get('groupId'),
        reportTo: entity.get('reportTo'),
        targetId: entity.get('targetId'),
        targetType: entity.get('targetType'),
        targetActorId: entity.get('targetActorId'),
        reasonsCount,
        status: entity.get('status'),
        processedBy: entity.get('processedBy'),
        processedAt: entity.get('processedAt'),
        createdAt: entity.get('createdAt'),
        updatedAt: entity.get('updatedAt'),
        content,
        targetActor,
      });
    }

    return reports;
  }

  public bindingReportReasonsCount(reasonsCount: ReasonCount[]): ReportReasonCountDto[] {
    if (!reasonsCount?.length) {
      return [];
    }

    return reasonsCount.map((reasonCount) => {
      const reason = CONTENT_REPORT_REASONS.find((reason) => reason.id === reasonCount.reasonType);
      return {
        reasonType: reasonCount.reasonType,
        description: reason?.description,
        total: reasonCount.total,
      };
    });
  }

  public async bindingReportReasonsCountWithReporters(
    reasonsCount: ReasonCount[]
  ): Promise<ReportReasonCountDto[]> {
    if (!reasonsCount?.length) {
      return [];
    }

    const reporterIds = uniq(reasonsCount.map((reasonCount) => reasonCount.reporterIds).flat());
    const reporters = await this._userAdapter.getUsersByIds(reporterIds);

    return reasonsCount.map((reasonCount) => {
      const reason = CONTENT_REPORT_REASONS.find((reason) => reason.id === reasonCount.reasonType);
      return {
        reasonType: reasonCount.reasonType,
        description: reason?.description,
        total: reasonCount.total,
        reporters: reporters.filter((reporter) => reasonCount.reporterIds.includes(reporter.id)),
      };
    });
  }
}
