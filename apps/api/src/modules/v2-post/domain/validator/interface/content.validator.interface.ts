import { IPost, PostModel } from '../../../../../database/models/post.model';
import { UserDto } from '../../../../v2-user/application';
import { SeriesResponseDto } from '../../../../series/dto/responses';
import { PostResponseDto } from '../../../../post/dto/responses';
import { GroupDto } from '../../../../v2-group/application/group.dto';
import { PostEntity } from '../../model/post/post.entity';
import { PostAllow } from '../../../data-type/post-allow.enum';
import { ImageMetadataDto } from '../../../driving-apdater/dto/shared/media/image-metadata.dto';

export interface IContentValidator {
  checkCanCRUDContent(user: UserDto, groupAudienceIds: string[]): Promise<void>;

  checkCanEditContentSetting(user: UserDto, groupAudienceIds: string[]): Promise<void>;

  checkPostOwner(
    post: PostResponseDto | SeriesResponseDto | PostModel | IPost,
    authUserId: string
  ): Promise<void>;

  checkUserInSomeGroups(user: UserDto, groupAudienceIds: string[]): void;

  checkCanReadPost(post: PostEntity, user: UserDto, requireGroups?: GroupDto[]): void;

  allow(post: PostEntity, action: PostAllow): void;

  checkValidMentions(groupIds: string[], userIds: string[]): Promise<void>;

  validateImagesMedia(images: ImageMetadataDto[], actor: UserDto): void;
}

export const CONTENT_VALIDATOR_TOKEN = 'CONTENT_VALIDATOR_TOKEN';
