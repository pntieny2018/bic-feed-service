import { SearchArticlesDto } from '@api/modules/v2-post/driving-apdater/dto/request';
import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type SearchArticlesPayload = {
  user: UserDto;
  searchDto: SearchArticlesDto;
};

export class SearchArticlesQuery implements IQuery {
  public constructor(public readonly payload: SearchArticlesPayload) {}
}
