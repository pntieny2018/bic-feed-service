import { CONTENT_TARGET } from '@beincom/constants';
import { ArrayHelper } from '@libs/common/helpers';
import { BaseUserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { uniq } from 'lodash';

import { EntityHelper } from '../../../../../common/helpers';
import {
  IReportDomainService,
  REPORT_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { CommentEntity } from '../../../domain/model/comment';
import { ArticleEntity, PostEntity } from '../../../domain/model/content';
import { ReportEntity } from '../../../domain/model/report';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IContentRepository,
} from '../../../domain/repositoty-interface';
import { IUserAdapter, USER_ADAPTER } from '../../../domain/service-adapter-interface';
import { ReportDto, ReportForManagerDto } from '../../dto';

import { IReportBinding } from './report.interface';

export class ReportBinding implements IReportBinding {
  public constructor(
    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomain: IReportDomainService,
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
      targetId: entity.get('targetId'),
      targetType: entity.get('targetType'),
      targetActorId: entity.get('targetActorId'),
      status: entity.get('status'),
      updatedBy: entity.get('updatedBy'),
      createdAt: entity.get('createdAt'),
      updatedAt: entity.get('updatedAt'),
      details: entity.getDetails(),
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

      const targetActor = new BaseUserDto(actorMap[entity.get('targetActorId')]);
      const reasonCounts = await this._reportDomain.countReportReasons(entity.getDetails());

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
        targetId: entity.get('targetId'),
        targetType: entity.get('targetType'),
        targetActorId: entity.get('targetActorId'),
        status: entity.get('status'),
        updatedBy: entity.get('updatedBy'),
        createdAt: entity.get('createdAt'),
        updatedAt: entity.get('updatedAt'),
        content,
        targetActor,
        reasonCounts,
      });
    }

    return reports;
  }
}
