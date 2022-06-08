import { ArticleResponseDto } from '../../../modules/article/dto/responses';
import { UserSharedDto } from '../../../shared/user/dto';

export class ArticleHasBeenUpdatedEventPayload {
  public oldArticle: ArticleResponseDto;
  public newArticle: ArticleResponseDto;
  public actor: UserSharedDto;
}
