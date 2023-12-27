import { UserDto } from '@libs/service/user';

import { ArticleResponseDto } from '../../../modules/article/dto/responses';

export class ArticleHasBeenUpdatedEventPayload {
  public oldArticle: ArticleResponseDto;
  public newArticle: ArticleResponseDto;
  public actor: UserDto;
}
