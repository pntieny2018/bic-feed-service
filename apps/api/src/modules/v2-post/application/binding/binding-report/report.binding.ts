import { CONTENT_TARGET } from '@beincom/constants';
import { ArrayHelper } from '@libs/common/helpers';
import { BaseUserDto, UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { uniq } from 'lodash';

import { EntityHelper } from '../../../../../common/helpers';
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
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepository: ICommentRepository
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
    const reports = [];
    let commentMap = new Map<string, CommentEntity>();
    let contentMap = new Map<string, PostEntity | ArticleEntity>();
    const targetActorIds = uniq(entities.map((entity) => entity.get('targetActorId')));

    const actors = await this._userAdapter.getUsersByIds(targetActorIds);

    const actorsMap = ArrayHelper.convertArrayToObject(actors, 'id');

    const commentIds = entities
      .filter((entity) => entity.get('targetType') === CONTENT_TARGET.COMMENT)
      .map((entity) => entity.get('targetId'));

    if (commentIds.length) {
      const comments = await this._commentRepository.findMany({ id: commentIds });
      commentMap = EntityHelper.entityArrayToMap(comments, 'id');
    }

    const contentIds = entities
      .filter((entity) => entity.get('targetType') !== CONTENT_TARGET.COMMENT)
      .map((entity) => entity.get('targetId'));

    if (contentIds.length) {
      const contents = await this._contentRepository.findAll({
        where: {
          ids: contentIds,
        },
      });

      contentMap = EntityHelper.entityArrayToMap(contents as (PostEntity | ArticleEntity)[], 'id');
    }

    for (const entity of entities) {
      const actor = actorsMap[entity.get('targetActorId')] as UserDto;
      const targetActor = new BaseUserDto(actor);

      let content = '';

      switch (entity.get('targetType')) {
        case CONTENT_TARGET.COMMENT:
          const comment = commentMap.get(entity.get('targetId'));
          content = comment?.get('content');
          break;
        case CONTENT_TARGET.POST:
        case CONTENT_TARGET.ARTICLE:
          const post = contentMap.get(entity.get('targetId'));
          content = post.getContent();
          break;
        default:
          break;
      }

      reports.push(
        new ReportForManagerDto({
          id: entity.get('id'),
          targetId: entity.get('targetId'),
          targetType: entity.get('targetType'),
          targetActorId: entity.get('targetActorId'),
          status: entity.get('status'),
          updatedBy: entity.get('updatedBy'),
          createdAt: entity.get('createdAt'),
          updatedAt: entity.get('updatedAt'),
          details: entity.getDetails(),
          targetActor,
          content,
        })
      );
    }

    return reports;
  }
}
