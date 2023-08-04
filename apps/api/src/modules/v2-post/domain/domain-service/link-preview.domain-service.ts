import { Inject, Logger } from '@nestjs/common';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { ILinkPreviewRepository, LINK_PREVIEW_REPOSITORY_TOKEN } from '../repositoty-interface';
import {
  ILinkPreviewDomainService,
  LinkPreviewProps,
} from './interface/link-preview.domain-service.interface';
import {
  ILinkPreviewFactory,
  LINK_PREVIEW_FACTORY_TOKEN,
} from '../factory/interface/link-preview.factory.interface';
import { LinkPreviewEntity } from '../model/link-preview';

export class LinkPreviewDomainService implements ILinkPreviewDomainService {
  private readonly _logger = new Logger(LinkPreviewDomainService.name);

  public constructor(
    @Inject(LINK_PREVIEW_REPOSITORY_TOKEN)
    private readonly _linkPreviewRepo: ILinkPreviewRepository,
    @Inject(LINK_PREVIEW_FACTORY_TOKEN)
    private readonly _linkPreviewFactory: ILinkPreviewFactory
  ) {}

  public async findOrUpsert(input: LinkPreviewProps): Promise<LinkPreviewEntity> {
    if (!input?.url) return null;
    try {
      let linkPreviewEntity = await this._linkPreviewRepo.findByUrl(input.url);
      if (!linkPreviewEntity) {
        linkPreviewEntity = this._linkPreviewFactory.createLinkPreview(input);
        await this._linkPreviewRepo.create(linkPreviewEntity);
      } else {
        linkPreviewEntity.update(input);
        await this._linkPreviewRepo.update(linkPreviewEntity);
      }
      linkPreviewEntity.commit();
      return linkPreviewEntity;
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }
}
