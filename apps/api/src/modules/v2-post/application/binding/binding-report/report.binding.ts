import { CONTENT_TARGET } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { uniq } from 'lodash';

import { ArticleEntity, PostEntity } from '../../../domain/model/content';
import { ReportEntity } from '../../../domain/model/report';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IContentRepository,
} from '../../../domain/repositoty-interface';
import { IUserAdapter, USER_ADAPTER } from '../../../domain/service-adapter-interface';
import {
  ContentReportDetailDto,
  ReportContentForAdminDto,
  ReportDto,
  TargetActorDto,
} from '../../dto';

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

  public async bindingList(entities: ReportEntity[]): Promise<ReportDto[]> {
    const reports = [];
    const targetActorIds = uniq(entities.map((entity) => entity.get('targetActorId')));

    const authors = await this._userAdapter.getUsersByIds(targetActorIds);

    for (const entity of entities) {
      const author = authors.find((author) => author.id === entity.get('targetActorId'));
      const targetActor = new TargetActorDto({
        id: author?.id,
        avatar: author?.avatar,
        username: author?.username,
        fullname: author?.fullname,
      });

      let content = '';

      if (entity.get('targetType') === CONTENT_TARGET.COMMENT) {
        const comment = await this._commentRepository.findOne({
          id: entity.get('targetId'),
        });
        if (comment) {
          content = comment.get('content');
        }
      } else {
        const post = await this._contentRepository.findOne({
          where: {
            id: entity.get('targetId'),
          },
        });
        if (post) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          content = (post as PostEntity | ArticleEntity).get('content');
        }
      }

      const contentReportDetail = new ContentReportDetailDto({
        content,
      });

      reports.push(
        new ReportContentForAdminDto({
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
          contentReportDetail,
        })
      );
    }

    return reports;
  }
}
