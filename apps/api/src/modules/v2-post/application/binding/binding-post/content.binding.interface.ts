import { GroupDto } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';

import {
  PostEntity,
  SeriesEntity,
  ArticleEntity,
  PostAttributes,
  ArticleAttributes,
} from '../../../domain/model/content';
import {
  SeriesDto,
  ArticleDto,
  PostDto,
  UserMentionDto,
  ArticleCacheDto,
  PostCacheDto,
  SeriesCacheDto,
} from '../../dto';

export interface IContentBinding {
  postBinding(
    postEntity: PostEntity,
    dataBinding: {
      actor?: UserDto;
      mentionUsers?: UserDto[];
      groups?: GroupDto[];
      authUser: UserDto;
    }
  ): Promise<PostDto>;
  postAttributesBinding(
    postAttributes: PostAttributes,
    dataBinding: {
      actor?: UserDto;
      mentionUsers?: UserDto[];
      groups?: GroupDto[];
      authUser: UserDto;
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
  articleAttributesBinding(
    articleAttributes: ArticleAttributes,
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

  contentsCacheBinding(
    contentEntities: (PostEntity | SeriesEntity | ArticleEntity)[]
  ): Promise<(ArticleCacheDto | PostCacheDto | SeriesCacheDto)[]>;

  mapMentionWithUserInfo(users: UserDto[]): UserMentionDto;
}
export const CONTENT_BINDING_TOKEN = 'CONTENT_BINDING_TOKEN';
