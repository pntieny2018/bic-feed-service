import { IPost, PostModel } from '../../../../../database/models/post.model';
import { UserDto } from '../../../../v2-user/application';
import { SeriesResponseDto } from '../../../../series/dto/responses';
import { PostResponseDto } from '../../../../post/dto/responses';

export interface IContentValidator {
  checkCanCRUDContent(user: UserDto, groupAudienceIds: string[]): Promise<void>;

  checkCanEditContentSetting(user: UserDto, groupAudienceIds: string[]): Promise<void>;

  checkPostOwner(
    post: PostResponseDto | SeriesResponseDto | PostModel | IPost,
    authUserId: string
  ): Promise<void>;

  checkUserInSomeGroups(user: UserDto, groupAudienceIds: string[]): void;
}

export const CONTENT_VALIDATOR_TOKEN = 'CONTENT_VALIDATOR_TOKEN';
