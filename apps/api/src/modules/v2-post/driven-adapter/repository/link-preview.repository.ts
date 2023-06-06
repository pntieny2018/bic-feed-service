import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { ILinkPreviewRepository } from '../../domain/repositoty-interface';
import { LinkPreviewModel } from '../../../../database/models/link-preview.model';
import { LinkPreviewEntity } from '../../domain/model/link-preview';
import {
  ILinkPreviewFactory,
  LINK_PREVIEW_FACTORY_TOKEN,
} from '../../domain/factory/interface/link-preview.factory.interface';
import { Inject } from '@nestjs/common';

export class LinkPreviewRepository implements ILinkPreviewRepository {
  @Inject(LINK_PREVIEW_FACTORY_TOKEN)
  private readonly _linkPreviewFactory: ILinkPreviewFactory;
  @InjectModel(LinkPreviewModel)
  private readonly _linkPreviewModel: typeof LinkPreviewModel;

  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {}

  public async create(linkPreviewEntity: LinkPreviewEntity): Promise<void> {
    await this._linkPreviewModel.create({
      id: linkPreviewEntity.get('id'),
      url: linkPreviewEntity.get('url'),
      title: linkPreviewEntity.get('title'),
      description: linkPreviewEntity.get('description'),
      domain: linkPreviewEntity.get('domain'),
      image: linkPreviewEntity.get('image'),
      createdAt: linkPreviewEntity.get('createdAt'),
      updatedAt: linkPreviewEntity.get('updatedAt'),
    });
  }

  public async update(linkPreviewEntity: LinkPreviewEntity): Promise<void> {
    await this._linkPreviewModel.update(
      {
        id: linkPreviewEntity.get('id'),
        url: linkPreviewEntity.get('url'),
        title: linkPreviewEntity.get('title'),
        description: linkPreviewEntity.get('description'),
        domain: linkPreviewEntity.get('domain'),
        image: linkPreviewEntity.get('image'),
        createdAt: linkPreviewEntity.get('createdAt'),
        updatedAt: linkPreviewEntity.get('updatedAt'),
      },
      {
        where: {
          id: linkPreviewEntity.get('id'),
        },
      }
    );
  }

  public async findByUrl(url: string): Promise<LinkPreviewEntity> {
    const linkPreview = await this._linkPreviewModel.findOne({
      where: {
        url,
      },
    });

    return this._modelToEntity(linkPreview);
  }

  private _modelToEntity(model: LinkPreviewModel): LinkPreviewEntity {
    if (model === null) return null;
    return this._linkPreviewFactory.reconstitute(model.toJSON());
  }
}
