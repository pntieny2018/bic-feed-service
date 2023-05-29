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

@QueryHandler(FindCommentsPaginationQuery)
export class FindCommentsPaginationHandler
  implements IQueryHandler<FindCommentsPaginationQuery, FindCommentsPaginationDto>
{
  public constructor(
    @Inject(COMMENT_QUERY_TOKEN)
    private readonly _commentQuery: ICommentQuery,
    @Inject(REACTION_QUERY_TOKEN)
    private readonly _reactionQuery: IReactionQuery
  ) {}

  public async execute(query: FindCommentsPaginationQuery): Promise<FindCommentsPaginationDto> {
    const { rows, meta } = await this._commentQuery.getPagination(query.payload);

    if (!rows || rows.length === 0) return new FindCommentsPaginationDto([], meta);

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
      });
    });

    return new FindCommentsPaginationDto(instances, meta);
  }
}
