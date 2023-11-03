import { FollowModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LibFollowRepository extends BaseRepository<FollowModel> {
  public constructor() {
    super(FollowModel);
  }
}
