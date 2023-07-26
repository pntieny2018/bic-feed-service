import { UserDto } from '../../../../v2-user/application';

export interface IQuizValidator {
  checkCanCUDQuizInContent(contentId: string, authUser: UserDto): Promise<void>;
}

export const QUIZ_VALIDATOR_TOKEN = 'QUIZ_VALIDATOR_TOKEN';
