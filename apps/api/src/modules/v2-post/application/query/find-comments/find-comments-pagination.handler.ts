import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { FindCommentsPaginationQuery } from './find-comments-pagination.query';
import { COMMENT_QUERY_TOKEN, ICommentQuery } from '../../../domain/query-interface';
import { FindCommentsPaginationDto } from './find-comments-pagination.dto';
import { CommentResponseDto } from '../../../driving-apdater/dto/response';
import { createUrlFromId } from '../../../../v2-giphy/giphy.util';
import { FileDto, ImageDto, ReactionDto, VideoDto } from '../../dto';
import {
  IReactionQuery,
  REACTION_QUERY_TOKEN,
} from '../../../domain/query-interface/reaction.query.interface';
import {
  CONTENT_REPOSITORY_TOKEN,
  FindOnePostOptions,
  IContentRepository,
} from '../../../domain/repositoty-interface';
import {
  UserDto,
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
} from '../../../../v2-user/application';
import { uniq } from 'lodash';

@QueryHandler(FindCommentsPaginationQuery)
export class FindCommentsPaginationHandler
  implements IQueryHandler<FindCommentsPaginationQuery, FindCommentsPaginationDto>
{
  public constructor(
    @Inject(COMMENT_QUERY_TOKEN)
    private readonly _commentQuery: ICommentQuery,
    @Inject(REACTION_QUERY_TOKEN)
    private readonly _reactionQuery: IReactionQuery,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async execute(query: FindCommentsPaginationQuery): Promise<FindCommentsPaginationDto> {
    const { postId, authUser } = query.payload;
    const findOneOptions: FindOnePostOptions = {
      where: {
        id: postId,
        groupArchived: false,
        isHidden: false,
      },
    };

    if (authUser) findOneOptions.where.excludeReportedByUserId = authUser.id;

    const postEntity = await this._contentRepository.findOne(findOneOptions);

    if (!postEntity || (!postEntity.isOpen() && !authUser))
      return new FindCommentsPaginationDto([]);

    const { rows, meta } = await this._commentQuery.getPagination(query.payload);

    if (!rows || rows.length === 0) return new FindCommentsPaginationDto([], meta);

    const userIdsNeedToFind = uniq([
      ...rows.map((item) => item.get('createdBy')),
      ...rows.map((item) => item.get('mentions')).flat(),
    ]);

    const users = await this._userApplicationService.findAllByIds(userIdsNeedToFind, {
      withGroupJoined: false,
    });

    const usersMapper = new Map<string, UserDto>(
      users.map((user) => {
        return [user.id, user];
      })
    );

    const reactionsCount = await this._reactionQuery.getAndCountReactionByComments(
      rows.map((item) => item.get('id'))
    );

    const instances = rows.map((row) => {
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
        reactionsCount,
        mentions: row.get('mentions').reduce((returnValue, current) => {
          return {
            ...returnValue,
            [usersMapper.get(current).username]: usersMapper.get(current),
          };
        }, {}),
      });
    });

    return new FindCommentsPaginationDto(instances, meta);
  }
}
