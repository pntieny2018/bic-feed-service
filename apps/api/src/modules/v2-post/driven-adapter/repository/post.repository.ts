import { Inject, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { IPostFactory, POST_FACTORY_TOKEN } from '../../domain/factory/interface';
import { IPostRepository } from '../../domain/repositoty-interface/post.repository.interface';
import { PostEntity } from '../../domain/model/post';
import { PostModel } from '../../../../database/models/post.model';

export class PostRepository implements IPostRepository {
  @Inject(POST_FACTORY_TOKEN) private readonly _factory: IPostFactory;
  private _logger = new Logger(PostRepository.name);
  @InjectModel(PostModel)
  private readonly _postModel: typeof PostModel;

  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {}

  public async createDraftPost(data: PostEntity): Promise<void> {
    await this._postModel.create({
      id: data.get('id'),
      content: data.get('content'),
      privacy: data.get('privacy'),
      isHidden: data.get('isHidden'),
      type: data.get('type'),
      status: data.get('status'),
      updatedBy: data.get('updatedBy'),
      createdBy: data.get('createdBy'),
      isImportant: data.get('setting').isImportant,
      importantExpiredAt: data.get('setting').importantExpiredAt,
      canShare: data.get('setting').canShare,
      canComment: data.get('setting').canComment,
      canReact: data.get('setting').canReact,
      mediaJson: data.get('media'),
    });
  }

  public async delete(id: string): Promise<void> {
    await this._postModel.destroy({ where: { id } });
  }

  public async findOne(id: string): Promise<PostEntity> {
    const entity = await this._postModel.findByPk(id);
    return this._modelToEntity(entity);
  }

  private _modelToEntity(post: PostModel): PostEntity {
    if (post === null) return null;
    return this._factory.reconstitute({
      id: post.id,
      media: post.mediaJson,
      isReported: post.isReported,
      isHidden: post.isHidden,
      createdBy: post.createdBy,
      updatedBy: post.updatedBy,
      privacy: post.privacy,
      status: post.status,
      type: post.type,
      setting: {
        isImportant: post.isImportant,
        importantExpiredAt: post.importantExpiredAt,
        canShare: post.canShare,
        canComment: post.canComment,
        canReact: post.canReact,
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      errorLog: post.errorLog,
      publishedAt: post.publishedAt,
      content: post.content,
    });
  }
}
