import {
  LinkPreviewAttributes,
  LinkPreviewModel,
} from '@app/database/postgres/model/link-preview.model';
import { ILibLinkPreviewRepository } from '@app/database/postgres/repository/interface';
import { InjectModel } from '@nestjs/sequelize';

export class LibLinkPreviewRepository implements ILibLinkPreviewRepository {
  public constructor(
    @InjectModel(LinkPreviewModel)
    private readonly _linkPreviewModel: typeof LinkPreviewModel
  ) {}

  public async create(data: LinkPreviewAttributes): Promise<void> {
    await this._linkPreviewModel.create(data);
  }

  public async update(linkPreviewId: string, data: Partial<LinkPreviewAttributes>): Promise<void> {
    await this._linkPreviewModel.update(data, {
      where: {
        id: linkPreviewId,
      },
    });
  }

  public async findByUrl(url: string): Promise<LinkPreviewModel> {
    return this._linkPreviewModel.findOne({
      where: {
        url,
      },
    });
  }
}
