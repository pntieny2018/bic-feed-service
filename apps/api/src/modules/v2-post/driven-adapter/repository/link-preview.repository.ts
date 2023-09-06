import {
  ILibLinkPreviewRepository,
  LIB_LINK_PREVIEW_REPOSITORY_TOKEN,
} from '@libs/database/postgres/repository/interface';
import { Inject } from '@nestjs/common';

import { LinkPreviewEntity } from '../../domain/model/link-preview';
import { ILinkPreviewRepository } from '../../domain/repositoty-interface';
import { LinkPreviewMapper } from '../mapper/link-preview.mapper';

export class LinkPreviewRepository implements ILinkPreviewRepository {
  public constructor(
    @Inject(LIB_LINK_PREVIEW_REPOSITORY_TOKEN)
    private readonly _libLinkPreviewRepository: ILibLinkPreviewRepository,
    private readonly _linkPreviewMapper: LinkPreviewMapper
  ) {}

  public async create(linkPreviewEntity: LinkPreviewEntity): Promise<void> {
    return this._libLinkPreviewRepository.create(
      this._linkPreviewMapper.toPersistence(linkPreviewEntity)
    );
  }

  public async update(linkPreviewEntity: LinkPreviewEntity): Promise<void> {
    return this._libLinkPreviewRepository.update(
      linkPreviewEntity.get('id'),
      this._linkPreviewMapper.toPersistence(linkPreviewEntity)
    );
  }

  public async findByUrl(url: string): Promise<LinkPreviewEntity> {
    const linkPreviewModel = await this._libLinkPreviewRepository.findByUrl(url);
    return this._linkPreviewMapper.toDomain(linkPreviewModel);
  }
}
