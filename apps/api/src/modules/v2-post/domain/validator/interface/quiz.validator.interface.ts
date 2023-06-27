import { UserDto } from '../../../../v2-user/application';
import { GroupDto } from '../../../../v2-group/application/group.dto';

export interface IQuizValidator {
  checkCanCUDQuizInGroups(user: UserDto, groups: GroupDto[]): Promise<void>;
}

export const QUIZ_VALIDATOR_TOKEN = 'QUIZ_VALIDATOR_TOKEN';
