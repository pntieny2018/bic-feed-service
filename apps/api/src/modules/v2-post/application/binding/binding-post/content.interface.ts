import { PostEntity } from '../../../domain/model/content';
import { UserDto } from '../../../../v2-user/application';
import { ArticleDto, PostDto, UserMentionDto } from '../../dto';
import { GroupDto } from '../../../../v2-group/application';
import { ArticleEntity } from '../../../domain/model/content/article.entity';
import { SeriesEntity } from '../../../domain/model/content/series.entity';
import { ReactionsCount } from '../../../domain/query-interface/reaction.query.interface';

export interface IContentBinding {
  postBinding(
    postEntity: PostEntity,
    dataBinding?: {
      actor?: UserDto;
      mentionUsers?: UserDto[];
      groups?: GroupDto[];
      series?: SeriesEntity[];
      authUser?: UserDto;
      reactionsCount?: ReactionsCount;
    }
  ): Promise<PostDto>;

  articleBinding(
    articleEntity: ArticleEntity,
    dataBinding?: {
      actor?: UserDto;
      groups?: GroupDto[];
      series?: SeriesEntity[];
      authUser?: UserDto;
      reactionsCount?: ReactionsCount;
    }
  ): Promise<ArticleDto>;

  mapMentionWithUserInfo(users: UserDto[]): UserMentionDto;
}
export const CONTENT_BINDING_TOKEN = 'CONTENT_BINDING_TOKEN';
