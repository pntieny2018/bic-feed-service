import { PaginatedResponse } from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';
import { Inject, Injectable } from '@nestjs/common';
import { uniq } from 'lodash';

import { createUrlFromId } from '../../../../giphy/giphy.util';
import {
  IReportDomainService,
  REPORT_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { CommentEntity } from '../../../domain/model/comment';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  ICommentReactionRepository,
} from '../../../domain/repositoty-interface';
import { IUserAdapter, USER_ADAPTER } from '../../../domain/service-adapter-interface';
import {
  CommentBaseDto,
  CommentExtendedDto,
  ReactionDto,
  ReportReasonCountDto,
  UserMentionDto,
} from '../../dto';
import { IMediaBinding, MEDIA_BINDING_TOKEN } from '../binding-media';
import { IReportBinding, REPORT_BINDING_TOKEN } from '../binding-report';

import { ICommentBinding } from './comment.interface';

@Injectable()
export class CommentBinding implements ICommentBinding {
  public constructor(
    @Inject(MEDIA_BINDING_TOKEN)
    private readonly _mediaBinding: IMediaBinding,
    @Inject(REPORT_BINDING_TOKEN)
    private readonly _reportBinding: IReportBinding,

    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomain: IReportDomainService,

    @Inject(COMMENT_REACTION_REPOSITORY_TOKEN)
    private readonly _commentReactionRepo: ICommentReactionRepository,

    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter
  ) {}
  public async commentsBinding(
    rows: CommentEntity[],
    dataBinding?: {
      authUser?: UserDto;
      includeReportReasonsCount?: boolean;
    }
  ): Promise<CommentExtendedDto[]> {
    const userData = await this._getUsersBindingInComment(rows, dataBinding?.authUser);

    const reactionsCount = await this._commentReactionRepo.getAndCountReactionByComments(
      rows.map((item) => item.get('id'))
    );

    const result = rows.map(async (row) => {
      const { actor, mentionUsers } = userData[row.get('id')];

      let reportReasonsCount: ReportReasonCountDto[] = [];
      if (dataBinding?.includeReportReasonsCount) {
        const reasonsCount = await this._reportDomain.countAllReportReasons(row.get('id'));
        reportReasonsCount = this._reportBinding.bindingReportReasonsCount(reasonsCount);
      }

      return new CommentExtendedDto({
        id: row.get('id'),
        postId: row.get('postId'),
        parentId: row.get('parentId'),
        content: row.get('content'),
        media: this._mediaBinding.binding(row.get('media')),
        mentions: mentionUsers,
        giphyId: row.get('giphyId'),
        giphyUrl: createUrlFromId(row.get('giphyId')),
        edited: row.get('edited'),
        createdBy: row.get('createdBy'),
        createdAt: row.get('createdAt'),
        updatedAt: row.get('updatedAt'),
        totalReply: row.get('totalReply'),
        actor,
        child: row.get('childs')
          ? new PaginatedResponse(
              await this.commentsBinding(row.get('childs').rows),
              row.get('childs').meta
            )
          : undefined,
        ownerReactions: row.get('ownerReactions').map(
          (item) =>
            new ReactionDto({
              id: item.get('id'),
              reactionName: item.get('reactionName'),
              createdAt: item.get('createdAt'),
            })
        ),
        reactionsCount: reactionsCount.get(row.get('id')) || [],
        ...(dataBinding?.includeReportReasonsCount && { reportReasonsCount }),
      });
    });

    return Promise.all(result);
  }

  public async commentBinding(
    commentEntity: CommentEntity,
    dataBinding?: {
      actor?: UserDto;
    }
  ): Promise<CommentBaseDto> {
    const userData = await this._getUsersBindingInComment([commentEntity], dataBinding?.actor);

    const { actor, mentionUsers } = userData[commentEntity.get('id')];

    return new CommentBaseDto({
      id: commentEntity.get('id'),
      postId: commentEntity.get('postId'),
      parentId: commentEntity.get('parentId'),
      content: commentEntity.get('content'),
      media: this._mediaBinding.binding(commentEntity.get('media')),
      giphyId: commentEntity.get('giphyId'),
      giphyUrl: createUrlFromId(commentEntity.get('giphyId')),
      mentions: mentionUsers,
      edited: commentEntity.get('edited'),
      createdBy: commentEntity.get('createdBy'),
      createdAt: commentEntity.get('createdAt'),
      updatedAt: commentEntity.get('updatedAt'),
      totalReply: commentEntity.get('totalReply'),
      actor,
    });
  }

  private async _getUsersBindingInComment(
    commentEntities: CommentEntity[],
    authUser?: UserDto
  ): Promise<{ [commentId: string]: { actor: UserDto; mentionUsers: UserMentionDto } }> {
    const userIdsNeedToFind = uniq([
      ...commentEntities.map((item) => item.get('createdBy')),
      ...commentEntities.map((item) => item.get('mentions') || []).flat(),
    ]);

    const users = await this._userAdapter.findAllAndFilterByPersonalVisibility(
      uniq(userIdsNeedToFind),
      authUser?.id
    );

    return commentEntities.reduce((returnValue, current) => {
      const actor = users.find((user) => user.id === current.get('createdBy'));
      const mentionUsers = this._mapMentionWithUserInfo(
        users.filter((user) => current.get('mentions')?.includes(user.id))
      );
      return {
        ...returnValue,
        [current.get('id')]: {
          actor,
          mentionUsers,
        },
      };
    }, {});
  }

  private _mapMentionWithUserInfo(users: UserDto[]): UserMentionDto {
    if (!users || !users?.length) {
      return {};
    }
    return users
      .filter((user) => user)
      .reduce((returnValue, current) => {
        return {
          ...returnValue,
          [current.username]: current,
        };
      }, {});
  }
}
