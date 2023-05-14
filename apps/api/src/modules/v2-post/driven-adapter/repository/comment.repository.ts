import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CommentEntity } from '../../domain/model/comment';
import { CommentModel } from '../../../../database/models/comment.model';
import { ICommentRepository } from '../../domain/repositoty-interface/comment.repository.interface';
import { MentionModel } from 'apps/api/src/database/models/mention.model';
import { MentionableType } from 'apps/api/src/common/constants';
import { v4 } from 'uuid';
import { COMMENT_FACTORY_TOKEN, ICommentFactory } from '../../domain/factory/interface';

@Injectable()
export class CommentRepository implements ICommentRepository {
  public constructor(
    @Inject(COMMENT_FACTORY_TOKEN)
    private readonly _commentFactory: ICommentFactory,
    @InjectModel(CommentModel)
    private readonly _commentModel: typeof CommentModel
  ) {}

  public async createComment(data: CommentEntity): Promise<CommentEntity> {
    const post = await this._commentModel.create(
      {
        id: data.get('id'),
        content: data.get('content'),
        postId: data.get('postId'),
        parentId: data.get('parentId'),
        isHidden: data.get('isHidden'),
        updatedBy: data.get('updatedBy'),
        createdBy: data.get('createdBy'),
        giphyId: data.get('giphyId'),
        mediaJson: data.get('media'),
        mentions: data.get('mentions').map((id) => {
          return {
            id: v4(),
            userId: id,
            mentionableType: MentionableType.COMMENT,
          } as MentionModel;
        }),
      },
      {
        include: [MentionModel],
      }
    );
    return this._modelToEntity(post.toJSON());
  }

  private _modelToEntity(comment: CommentModel): CommentEntity {
    if (comment === null) return null;
    return this._commentFactory.reconstitute({
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId,
      edited: comment.edited,
      isHidden: comment.isHidden,
      giphyId: comment.giphyId,
      totalReply: comment.totalReply,
      createdBy: comment.createdBy,
      updatedBy: comment.updatedBy,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      content: comment.content,
      childs: comment.child?.map((item) => this._modelToEntity(item)) || [],
      mentions: comment.mentions?.map((mention) => mention.userId) || [],
      media: comment.mediaJson,
    });
  }
}
