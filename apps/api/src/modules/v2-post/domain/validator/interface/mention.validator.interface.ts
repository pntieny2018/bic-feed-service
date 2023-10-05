import { GroupDto } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';

export interface IMentionValidator {
  validateMentionUsers(users: UserDto[], groups: GroupDto[]): Promise<void>;
}

export const MENTION_VALIDATOR_TOKEN = 'MENTION_VALIDATOR_TOKEN';
