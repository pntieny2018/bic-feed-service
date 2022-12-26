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
    if (post.type === PostType.POST) {
      const nPost = post as PostResponseDto;
      mentions = nPost.mentions;
      media = nPost.media;
      content = nPost.content;
    } else {
      const article = post as ArticleResponseDto;
      title = article.title;
      targetType = post.type === PostType.ARTICLE ? TypeActivity.ARTICLE : TypeActivity.SERIES;
    }

    return { title, mentions, content, media, targetType };
  }
}
