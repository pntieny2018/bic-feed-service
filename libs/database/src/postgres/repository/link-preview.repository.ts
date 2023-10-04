import { LinkPreviewModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';

export class LibLinkPreviewRepository extends BaseRepository<LinkPreviewModel> {
  public constructor() {
    super(LinkPreviewModel);
  }
}
