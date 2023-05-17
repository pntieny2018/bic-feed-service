import { UserDto } from '../../../../v2-user/application';
import { GroupDto } from '../../../../v2-group/application';
import { UserMentionDto } from '../../../application/dto/user-mention.dto';

export interface IMentionValidator {
  checkValidMentionsAndReturnUsers(groupIds: string[], userIds: string[]): Promise<UserDto[]>;

  mapMentionWithUserInfo(users: UserDto[]): UserMentionDto;
  
  validateMentionUsers(users: UserDto[], groups: GroupDto[]): Promise<void>;
}

export const MENTION_VALIDATOR_TOKEN = 'MENTION_VALIDATOR_TOKEN';
