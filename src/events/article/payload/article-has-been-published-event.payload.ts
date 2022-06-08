import { ArticleResponseDto } from '../../../modules/article/dto/responses';
import { UserSharedDto } from '../../../shared/user/dto';

export class ArticleHasBeenPublishedEventPayload {
  public article: ArticleResponseDto;
  public actor: UserSharedDto;
}
