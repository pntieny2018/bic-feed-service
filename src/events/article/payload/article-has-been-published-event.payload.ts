import { ArticleResponseDto } from '../../../modules/article/dto/responses';
import { UserDto } from '../../../modules/auth';

export class ArticleHasBeenPublishedEventPayload {
  public article: ArticleResponseDto;
  public actor: UserDto;
}
