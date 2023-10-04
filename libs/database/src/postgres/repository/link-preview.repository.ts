import { LinkPreviewModel } from '@libs/database/postgres/model/link-preview.model';
import { BaseRepository } from '@libs/database/postgres/repository/base.repository';

export class LibLinkPreviewRepository extends BaseRepository<LinkPreviewModel> {
  public constructor() {
    super(LinkPreviewModel);
  }
}
