import { PaginatedResponse } from '@libs/database/postgres/common';
import { Inject, Injectable } from '@nestjs/common';
import { uniq } from 'lodash';

import { createUrlFromId } from '../../../../giphy/giphy.util';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../../v2-user/application';
import { CommentEntity } from '../../../domain/model/comment';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  ICommentReactionRepository,
} from '../../../domain/repositoty-interface';
import { CommentResponseDto } from '../../../driving-apdater/dto/response';
import { CommentDto, FileDto, ImageDto, ReactionDto, VideoDto } from '../../dto';

import { ICommentBinding } from './comment.interface';

@Injectable()
export class CommentBinding implements ICommentBinding {
  public constructor(
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService,
    @Inject(COMMENT_REACTION_REPOSITORY_TOKEN)
    private readonly _commentReactionRepo: ICommentReactionRepository
  ) {}
  public async commentsBinding(
    rows: CommentEntity[],
    authUser?: UserDto
  ): Promise<CommentResponseDto[]> {
    const userIdsNeedToFind = uniq([
      ...rows.map((item) => item.get('createdBy')),
      ...rows.map((item) => item.get('mentions')).flat(),
    ]);

    const users = await this._userApplicationService.findAllAndFilterByPersonalVisibility(
      userIdsNeedToFind,
      authUser?.id
    );

    const usersMapper = new Map<string, UserDto>(
      users.map((user) => {
        return [user.id, user];
      })
    );

    const reactionsCount = await this._commentReactionRepo.getAndCountReactionByComments(
      rows.map((item) => item.get('id'))
    );

    const result = rows.map(async (row) => {
      return new CommentResponseDto({
        id: row.get('id'),
        edited: row.get('edited'),
        parentId: row.get('parentId'),
        postId: row.get('postId'),
        totalReply: row.get('totalReply'),
        content: row.get('content'),
        giphyId: row.get('giphyId'),
        giphyUrl: createUrlFromId(row.get('giphyId')),
        createdAt: row.get('createdAt'),
        createdBy: row.get('createdBy'),
        updatedAt: row.get('updatedAt'),
        actor: usersMapper.get(row.get('createdBy')),
        media: {
          files: row.get('media').files.map((item) => new FileDto(item.toObject())),
          images: row.get('media').images.map((item) => new ImageDto(item.toObject())),
          videos: row.get('media').videos.map((item) => new VideoDto(item.toObject())),
        },
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
        mentions: row
          .get('mentions')
          .filter((mention) => usersMapper.has(mention))
          .reduce((returnValue, current) => {
            return {
              ...returnValue,
              [usersMapper.get(current).username]: usersMapper.get(current),
            };
          }, {}),
      });
    });

    return Promise.all(result);
  }

  public async commentBinding(
    commentEntity: CommentEntity,
    dataBinding?: {
      actor?: UserDto;
    }
  ): Promise<CommentDto> {
    const userIdsNeedToFind = commentEntity.get('mentions');

    if (!dataBinding?.actor) {
      userIdsNeedToFind.push(commentEntity.get('createdBy'));
    }

    const users = await this._userApplicationService.findAllByIds(userIdsNeedToFind, {
      withGroupJoined: false,
    });

    const usersMapper = new Map<string, UserDto>(
      users.map((user) => {
        return [user.id, user];
      })
    );

    return new CommentDto({
      id: commentEntity.get('id'),
      edited: commentEntity.get('edited'),
      parentId: commentEntity.get('parentId'),
      postId: commentEntity.get('postId'),
      totalReply: commentEntity.get('totalReply'),
      content: commentEntity.get('content'),
      giphyId: commentEntity.get('giphyId'),
      giphyUrl: createUrlFromId(commentEntity.get('giphyId')),
      createdAt: commentEntity.get('createdAt'),
      createdBy: commentEntity.get('createdBy'),
      actor: dataBinding?.actor
        ? dataBinding.actor
        : usersMapper.get(commentEntity.get('createdBy')),
      media: {
        files: commentEntity.get('media').files.map((item) => new FileDto(item.toObject())),
        images: commentEntity.get('media').images.map((item) => new ImageDto(item.toObject())),
        videos: commentEntity.get('media').videos.map((item) => new VideoDto(item.toObject())),
      },
      mentions: commentEntity
        .get('mentions')
        .filter((mention) => usersMapper.has(mention))
        .reduce((returnValue, current) => {
          return {
            ...returnValue,
            [usersMapper.get(current).username]: usersMapper.get(current),
          };
        }, {}),
    });
  }
}
