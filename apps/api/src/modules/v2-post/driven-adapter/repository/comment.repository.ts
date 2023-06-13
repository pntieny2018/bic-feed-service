import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { CommentEntity } from '../../domain/model/comment';
import { CommentModel, IComment } from '../../../../database/models/comment.model';
import { CommentReactionModel } from '../../../../database/models/comment-reaction.model';
import { ICommentRepository } from '../../domain/repositoty-interface';
import { COMMENT_FACTORY_TOKEN, ICommentFactory } from '../../domain/factory/interface';
import { Sequelize, WhereOptions } from 'sequelize';
import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';

@Injectable()
export class CommentRepository implements ICommentRepository {
  public constructor(
    @Inject(COMMENT_FACTORY_TOKEN)
    private readonly _commentFactory: ICommentFactory,
    @InjectModel(CommentModel)
    private readonly _commentModel: typeof CommentModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel,
    @InjectConnection() private readonly _sequelizeConnection: Sequelize
  ) {}

  public async createComment(data: CommentEntity): Promise<CommentEntity> {
    const comment = await this._commentModel.create({
      id: data.get('id'),
      content: data.get('content'),
      postId: data.get('postId'),
      parentId: data.get('parentId'),
      isHidden: data.get('isHidden'),
      updatedBy: data.get('updatedBy'),
      createdBy: data.get('createdBy'),
      giphyId: data.get('giphyId'),
      mediaJson: {
        files: data.get('media').files.map((file) => file.toObject()),
        images: data.get('media').images.map((image) => image.toObject()),
        videos: data.get('media').videos.map((video) => video.toObject()),
      },
      mentions: data.get('mentions'),
    });
    return this._modelToEntity(comment);
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
      mentions: comment.mentions,
      media: {
        images: comment.mediaJson?.images.map((image) => new ImageEntity(image)),
        files: comment.mediaJson?.files.map((file) => new FileEntity(file)),
        videos: comment.mediaJson?.videos.map((video) => new VideoEntity(video)),
      },
    });
  }

  public async findOne(options: WhereOptions<IComment>): Promise<CommentEntity> {
    const comment = await this._commentModel.findOne({
      where: options,
    });

    return this._modelToEntity(comment);
  }

  public async update(commentEntity: CommentEntity): Promise<void> {
    try {
      const attributes = this._getUpdatedAttributes(commentEntity);
      await this._commentModel.update(attributes, {
        where: {
          id: commentEntity.get('id'),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  public async destroyComment(id: string): Promise<void> {
    const comment = await this._commentModel.findOne({ where: { id } });
    const childComments = await this._commentModel.findAll({
      attributes: ['id'],
      where: {
        parentId: id,
      },
    });
    const childCommentIds = childComments.map((child) => child.id);
    const transaction = await this._sequelizeConnection.transaction();
    try {
      await this._commentReactionModel.destroy({
        where: {
          commentId: [id, ...childCommentIds],
        },
        transaction: transaction,
      });
      await this._commentModel.destroy({
        where: {
          parentId: id,
        },
        individualHooks: true,
        transaction: transaction,
      });
      await comment.destroy({ transaction });
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  private _getUpdatedAttributes(commentEntity: CommentEntity): Partial<IComment> {
    return {
      content: commentEntity.get('content'),
      updatedBy: commentEntity.get('updatedBy'),
      edited: commentEntity.get('edited'),
      giphyId: commentEntity.get('giphyId'),
      mediaJson: {
        files: commentEntity.get('media').files.map((file) => file.toObject()),
        images: commentEntity.get('media').images.map((image) => image.toObject()),
        videos: commentEntity.get('media').videos.map((video) => video.toObject()),
      },
      mentions: commentEntity.get('mentions'),
    };
  }
}
