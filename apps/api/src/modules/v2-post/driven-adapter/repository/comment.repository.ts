import { Inject } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { ICommentFactory, COMMENT_FACTORY_TOKEN } from '../../domain/factory/interface';
import { CommentEntity } from '../../domain/model/comment';
import { CommentModel } from '../../../../database/models/comment.model';
import { ICommentRepository } from '../../domain/repositoty-interface/comment.repository.interface';
import { MentionModel } from 'apps/api/src/database/models/mention.model';

export class CommentRepository implements ICommentRepository {
  public constructor(
    @Inject(COMMENT_FACTORY_TOKEN)
    private readonly _factory: ICommentFactory,
    @InjectModel(CommentModel)
    private readonly _commentModel: typeof CommentModel,
    @InjectModel(MentionModel)
    private readonly _mentionModel: typeof MentionModel,
    @InjectConnection() private readonly _sequelizeConnection: Sequelize
  ) {}

  public async createComment(data: CommentEntity): Promise<void> {
    await this._commentModel.create({
      id: data.get('id'),
      content: data.get('content'),
      isHidden: data.get('isHidden'),
      updatedBy: data.get('updatedBy'),
      createdBy: data.get('createdBy'),
      mediaJson: data.get('media'),
    });
  }

  private _modelToEntity(comment: CommentModel): CommentEntity {
    if (comment === null) return null;
  }
}
