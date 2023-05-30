import { PostEntity, SeriesEntity } from '../../../domain/model/content';
import { UserDto } from '../../../../v2-user/application';
import { PostDto, UserMentionDto } from '../../dto';
import { GroupDto } from '../../../../v2-group/application';
import { SeriesDto } from '../../dto/series.dto';

export interface IContentBinding {
  postBinding(
    postEntity: PostEntity,
    dataBinding?: {
      actor?: UserDto;
      mentionUsers?: UserDto[];
      groups?: GroupDto[];
      authUser?: UserDto;
    }
  ): Promise<PostDto>;

  seriesBinding(
    seriesEntity: SeriesEntity,
    dataBinding?: {
      actor?: UserDto;
      groups?: GroupDto[];
    }
  ): Promise<SeriesDto>;

  mapMentionWithUserInfo(users: UserDto[]): UserMentionDto;
}
export const CONTENT_BINDING_TOKEN = 'CONTENT_BINDING_TOKEN';
