import { IPost, PostModel } from '../../../../../database/models/post.model';
import { UserDto } from '../../../../v2-user/application';
import { SeriesResponseDto } from '../../../../series/dto/responses';
import { PostResponseDto } from '../../../../post/dto/responses';

export interface IPostValidator {
  checkIsPublicPost(post: IPost): Promise<void>;

  checkCanReadPost(user: UserDto, post: IPost): Promise<void>;

  checkCanUpdatePost(
    user: UserDto,
    groupAudienceIds: string[],
    needEnableSetting: boolean
  ): Promise<void>;

  checkCanCreatePost(
    user: UserDto,
    groupAudienceIds: string[],
    needEnableSetting: boolean
  ): Promise<void>;

  checkCanDeletePost(user: UserDto, groupAudienceIds: string[]): Promise<void>;

  checkPostOwner(
    post: PostResponseDto | SeriesResponseDto | PostModel | IPost,
    authUserId: string
  ): Promise<void>;

  checkUserInSomeGroups(user: UserDto, groupAudienceIds: string[]): void;
}

export const POST_VALIDATOR_TOKEN = 'POST_VALIDATOR_TOKEN';
