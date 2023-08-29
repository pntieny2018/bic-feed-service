import { GroupDto } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';

import { PostEntity, SeriesEntity, ArticleEntity } from '../../../domain/model/content';
import { ReactionsCount } from '../../../domain/query-interface/reaction.query.interface';
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
