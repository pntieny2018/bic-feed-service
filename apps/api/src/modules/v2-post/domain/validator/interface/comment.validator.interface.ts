import { UserDto } from '../../../../v2-user/application';
import { GroupDto } from '../../../../v2-group/application/group.dto';
import { PostEntity } from '../../model/post/post.entity';
import { PostAllow } from '../../../data-type/post-allow.enum';
import { ImageMetadataDto } from '../../../driving-apdater/dto/shared/media/image-metadata.dto';

export interface ICommentValidator {
  checkCanReadPost(post: PostEntity, user: UserDto, requireGroups?: GroupDto[]): void;

  allow(post: PostEntity, action: PostAllow): void;

  checkValidMentions(groupIds: string[], userIds: string[]): Promise<void>;

  validateImagesMedia(images: ImageMetadataDto[], actor: UserDto): void;
}

export const COMMENT_VALIDATOR_TOKEN = 'COMMENT_VALIDATOR_TOKEN';
