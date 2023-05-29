import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { FindCommentsPaginationQuery } from './find-comments-pagination.query';
import { COMMENT_QUERY_TOKEN, ICommentQuery } from '../../../domain/query-interface';
import { FindCommentsPaginationDto } from './find-comments-pagination.dto';
import { CommentDto } from '../../dto/comment.dto';
import { createUrlFromId } from '../../../../v2-giphy/giphy.util';
import { FileDto, ImageDto, VideoDto } from '../../dto';

@QueryHandler(FindCommentsPaginationQuery)
export class FindCommentsPaginationHandler
  implements IQueryHandler<FindCommentsPaginationQuery, FindCommentsPaginationDto>
{
  public constructor(@Inject(COMMENT_QUERY_TOKEN) private readonly _commentQuery: ICommentQuery) {}

  public async execute(query: FindCommentsPaginationQuery): Promise<FindCommentsPaginationDto> {
    const { rows, meta } = await this._commentQuery.getPagination(query.payload);

    const instances = rows.map((row) => {
      return new CommentDto({
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
        media: {
          files: (row.get('media')?.files || []).map((item) => new FileDto(item.toObject())),
          images: (row.get('media')?.images || []).map((item) => new ImageDto(item.toObject())),
          videos: (row.get('media')?.videos || []).map((item) => new VideoDto(item.toObject())),
        },
      });
    });

    // TODO: Binding data to comments

    return new FindCommentsPaginationDto(instances, meta);
  }
}
