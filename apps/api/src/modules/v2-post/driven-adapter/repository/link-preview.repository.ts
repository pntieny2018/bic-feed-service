import { LinkPreviewEntity } from '../../domain/model/link-preview';
import { ILinkPreviewRepository } from '../../domain/repositoty-interface';
import { LinkPreviewMapper } from '../mapper/link-preview.mapper';
import { LibLinkPreviewRepository } from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LinkPreviewRepository implements ILinkPreviewRepository {
  public constructor(
    private readonly _libLinkPreviewRepo: LibLinkPreviewRepository,
    private readonly _linkPreviewMapper: LinkPreviewMapper
  ) {}

  public async create(linkPreviewEntity: LinkPreviewEntity): Promise<void> {
    await this._libLinkPreviewRepo.create(this._linkPreviewMapper.toPersistence(linkPreviewEntity));
  }

  public async update(linkPreviewEntity: LinkPreviewEntity): Promise<void> {
    const data = this._linkPreviewMapper.toPersistence(linkPreviewEntity);
    await this._libLinkPreviewRepo.update(data, {
      where: {
        id: linkPreviewEntity.get('id'),
      },
    });
  }

  public async findByUrl(url: string): Promise<LinkPreviewEntity> {
    const linkPreviewModel = await this._libLinkPreviewRepo.first({
      where: { url },
    });
    return this._linkPreviewMapper.toDomain(linkPreviewModel);
  }
}
