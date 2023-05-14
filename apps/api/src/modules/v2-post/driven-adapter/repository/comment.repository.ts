import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CommentEntity } from '../../domain/model/comment';
import { CommentModel } from '../../../../database/models/comment.model';
import { ICommentRepository } from '../../domain/repositoty-interface/comment.repository.interface';
import { MentionModel } from 'apps/api/src/database/models/mention.model';
import { MentionableType } from 'apps/api/src/common/constants';
import { v4 } from 'uuid';

@Injectable()
export class CommentRepository implements ICommentRepository {
  public constructor(
    @InjectModel(CommentModel)
    private readonly _commentModel: typeof CommentModel
  ) {}

  public async createComment(data: CommentEntity): Promise<void> {
    await this._commentModel.create(
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
  }

  private _modelToEntity(comment: CommentModel): CommentEntity {
    if (comment === null) return null;
  }
}
