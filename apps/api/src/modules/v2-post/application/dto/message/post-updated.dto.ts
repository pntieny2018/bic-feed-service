import { PostPublishedMessageDto } from './post-published.dto';

export class PostUpdatedMessageDto {
  public before: Omit<PostPublishedMessageDto, 'tags' | 'media' | 'seriesIds' | 'communities'>;
  public after: PostPublishedMessageDto;
}
