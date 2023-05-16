import { UserDto } from '../../../../v2-user/application';
import { UserMentionDto } from '../../../application/dto';

export interface IMentionValidator {
  checkValidMentionsAndReturnUsers(groupIds: string[], userIds: string[]): Promise<UserDto[]>;

  mapMentionWithUserInfo(users: UserDto[]): UserMentionDto;
}

export const MENTION_VALIDATOR_TOKEN = 'MENTION_VALIDATOR_TOKEN';
