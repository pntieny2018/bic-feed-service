import { UserDto } from '../../../../v2-user/application';
import { GroupDto } from '../../../../v2-group/application';

export interface IMentionValidator {
  validateMentionUsers(users: UserDto[], groups: GroupDto[]): Promise<void>;
}

export const MENTION_VALIDATOR_TOKEN = 'MENTION_VALIDATOR_TOKEN';
