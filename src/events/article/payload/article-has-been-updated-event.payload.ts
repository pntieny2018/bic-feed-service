import { ArticleResponseDto } from '../../../modules/article/dto/responses';
import { UserDto } from '../../../modules/auth';

export class ArticleHasBeenUpdatedEventPayload {
  public oldArticle: ArticleResponseDto;
  public newArticle: ArticleResponseDto;
  public actor: UserDto;
}
