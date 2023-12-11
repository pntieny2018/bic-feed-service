import { CursorPaginationResult } from '@libs/database/postgres/common';
import { PostAttributes } from '@libs/database/postgres/model';
import { LibContentRepository } from '@libs/database/postgres/repository';
import { GetPaginationContentsProps } from '@libs/database/postgres/repository/interface';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';

import { IContentRepository } from '../../domain/repositoty-interface';

@Injectable()
export class ContentRepository implements IContentRepository {
  public constructor(
    @InjectConnection()
    private readonly _libContentRepo: LibContentRepository
  ) {}

  public async getCursorPagination(
    getPaginationContentsProps: GetPaginationContentsProps
  ): Promise<CursorPaginationResult<PostAttributes>> {
    return await this._libContentRepo.getPagination(getPaginationContentsProps);
  }
}
