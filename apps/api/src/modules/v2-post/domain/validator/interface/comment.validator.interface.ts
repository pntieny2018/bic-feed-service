import { UserDto } from '../../../../v2-user/application';
import { GroupDto } from '../../../../v2-group/application/group.dto';
import { PostAllow } from '../../../data-type/post-allow.enum';
import { ImageMetadataDto } from '../../../driving-apdater/dto/shared/media/image-metadata.dto';
import { UserMentionDto } from '../../../application/dto';
import { ContentEntity } from '../../model/content/content.entity';

export interface ICommentValidator {
  checkCanReadPost(post: ContentEntity, user: UserDto, requireGroups?: GroupDto[]): void;

  allowAction(post: ContentEntity, action: PostAllow): void;

  checkValidMentionsAndReturnUsers(groupIds: string[], userIds: string[]): Promise<UserDto[]>;

  validateImagesMedia(images: ImageMetadataDto[], actor: UserDto): void;

  mapMentionWithUserInfo(mentions: string[], users: UserDto[]): UserMentionDto;
}

export const COMMENT_VALIDATOR_TOKEN = 'COMMENT_VALIDATOR_TOKEN';
