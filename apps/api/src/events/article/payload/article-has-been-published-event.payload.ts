import { ArticleResponseDto } from '../../../modules/article/dto/responses';
import { UserDto } from '../../../modules/v2-user/application';

export class ArticleHasBeenPublishedEventPayload {
  public article: ArticleResponseDto;
  public actor: UserDto;
}
