import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../../v2-user/application';
import { Inject, Injectable } from '@nestjs/common';
import { FileDto, ImageDto, ReactionDto, VideoDto } from '../../dto';
import {
  IReactionQuery,
  REACTION_QUERY_TOKEN,
} from '../../../domain/query-interface/reaction.query.interface';
import { ICommentBinding } from './comment.interface';
import { CommentEntity } from '../../../domain/model/comment';
import { uniq } from 'lodash';
import { CommentResponseDto } from '../../../driving-apdater/dto/response';
import { createUrlFromId } from 'apps/api/src/modules/giphy/giphy.util';

@Injectable()
export class CommentBinding implements ICommentBinding {
  public constructor(
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService,
    @Inject(REACTION_QUERY_TOKEN)
    private readonly _reactionQuery: IReactionQuery
  ) {}
  public async commentBinding(
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

    const reactionsCount = await this._reactionQuery.getAndCountReactionByComments(
      rows.map((item) => item.get('id'))
    );
    return rows.map((row) => {
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
  }
}
