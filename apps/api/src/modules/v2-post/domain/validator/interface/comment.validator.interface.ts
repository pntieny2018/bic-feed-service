import { UserDto } from '../../../../v2-user/application';
import { PostAllow } from '../../../data-type/post-allow.enum';
import { UserMentionDto } from '../../../application/dto';
import { ContentEntity } from '../../model/content/content.entity';

export interface ICommentValidator {
  allowAction(post: ContentEntity, action: PostAllow): void;

  checkValidMentionsAndReturnUsers(groupIds: string[], userIds: string[]): Promise<UserDto[]>;

  mapMentionWithUserInfo(mentions: string[], users: UserDto[]): UserMentionDto;
}

export const COMMENT_VALIDATOR_TOKEN = 'COMMENT_VALIDATOR_TOKEN';
