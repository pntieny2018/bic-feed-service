import { ReactionsCount } from '../../../../../common/types';
import { GroupDto } from '../../../../v2-group/application';
import { UserDto } from '../../../../v2-user/application';
import { PostEntity, SeriesEntity } from '../../../domain/model/content';
import { ArticleEntity } from '../../../domain/model/content/article.entity';
import { SeriesDto, ArticleDto, PostDto, UserMentionDto } from '../../dto';
export interface IContentBinding {
  postBinding(
    postEntity: PostEntity,
    dataBinding: {
      actor?: UserDto;
      mentionUsers?: UserDto[];
      groups?: GroupDto[];
      series?: SeriesEntity[];
      authUser: UserDto;
      reactionsCount?: ReactionsCount;
    }
  ): Promise<PostDto>;

  seriesBinding(
    seriesEntity: SeriesEntity,
    dataBinding: {
      actor?: UserDto;
      groups?: GroupDto[];
      authUser: UserDto;
    }
  ): Promise<SeriesDto>;

  articleBinding(
    articleEntity: ArticleEntity,
    dataBinding: {
      actor?: UserDto;
      groups?: GroupDto[];
      authUser: UserDto;
    }
  ): Promise<ArticleDto>;

  contentsBinding(
    contentEntities: (PostEntity | SeriesEntity | ArticleEntity)[],
    authUser: UserDto
  ): Promise<(ArticleDto | PostDto | SeriesDto)[]>;

  mapMentionWithUserInfo(users: UserDto[]): UserMentionDto;
}
export const CONTENT_BINDING_TOKEN = 'CONTENT_BINDING_TOKEN';
