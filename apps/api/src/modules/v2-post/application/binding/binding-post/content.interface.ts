import { PostEntity } from '../../../domain/model/content';
import { UserDto } from '../../../../v2-user/application';
import { PostDto } from '../../dto';
import { GroupDto } from '../../../../v2-group/application';

export interface IContentBinding {
  postBinding(
    postEntity: PostEntity,
    dataBinding?: {
      actor?: UserDto;
      mentionUsers?: UserDto[];
      groups?: GroupDto[];
    }
  ): Promise<PostDto>;
}
export const CONTENT_BINDING_TOKEN = 'CONTENT_BINDING_TOKEN';
