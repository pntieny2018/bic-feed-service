import { UserNewsFeedModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LibUserNewsfeedRepository extends BaseRepository<UserNewsFeedModel> {
  public constructor() {
    super(UserNewsFeedModel);
  }
}
