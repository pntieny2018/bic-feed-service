import { UserDto } from '@libs/service/user';

import { PostEntity } from '../../model/content';

import { IContentValidator } from './content.validator.interface';

export interface IPostValidator extends IContentValidator {
  validatePublishContent(
    postEntity: PostEntity,
    userAuth: UserDto,
    groupIds: string[]
  ): Promise<void>;
}
export const POST_VALIDATOR_TOKEN = 'POST_VALIDATOR_TOKEN';
