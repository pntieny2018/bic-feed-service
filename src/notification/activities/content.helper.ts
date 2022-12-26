import { ArticleResponseDto } from '../../modules/article/dto/responses';
import { SeriesResponseDto } from '../../modules/series/dto/responses';
import { PostResponseDto } from '../../modules/post/dto/responses';
import { UserMentionDto } from '../../modules/mention/dto';
import { MediaFilterResponseDto } from '../../modules/media/dto/response';
import { TypeActivity } from '../notification.constants';
import { PostType } from '../../database/models/post.model';

export class ContentHelper {
  public static getInfo(post: ArticleResponseDto | SeriesResponseDto | PostResponseDto): {
    title: string;
    mentions: UserMentionDto;
    content: string;
    media: MediaFilterResponseDto;
    targetType: TypeActivity;
  } {
    let title = '';
    let targetType = TypeActivity.POST;
    let mentions = {};
    let content = '';
    let media = {
      videos: [],
      images: [],
      files: [],
    };
    if (post instanceof PostResponseDto) {
      mentions = post.mentions;
      media = post.media;
      content = post.content;
    } else {
      title = post.title;
      targetType = post.type === PostType.ARTICLE ? TypeActivity.ARTICLE : TypeActivity.SERIES;
    }

    return { title, mentions, content, media, targetType };
  }
}
