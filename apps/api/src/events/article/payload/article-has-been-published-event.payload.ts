import { UserDto } from '@libs/service/user';

import { ArticleResponseDto } from '../../../modules/article/dto/responses';

export class ArticleHasBeenPublishedEventPayload {
  public article: ArticleResponseDto;
  public actor: UserDto;
}
