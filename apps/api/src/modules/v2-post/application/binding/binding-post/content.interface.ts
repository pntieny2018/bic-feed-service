import { PostEntity } from '../../../domain/model/content';
import { UserDto } from '../../../../v2-user/application';
import { PostDto, UserMentionDto } from '../../dto';
import { GroupDto } from '../../../../v2-group/application';

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

  mapMentionWithUserInfo(users: UserDto[]): UserMentionDto;
}
export const CONTENT_BINDING_TOKEN = 'CONTENT_BINDING_TOKEN';
