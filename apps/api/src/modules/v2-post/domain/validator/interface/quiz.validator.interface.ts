import { UserDto } from '@libs/service/user';

export interface IQuizValidator {
  checkCanCUDQuizInContent(contentId: string, authUser: UserDto): Promise<void>;
}

export const QUIZ_VALIDATOR_TOKEN = 'QUIZ_VALIDATOR_TOKEN';
