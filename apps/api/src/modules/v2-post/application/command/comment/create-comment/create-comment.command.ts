import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

import { BasedCommentPayload } from '../../../../domain/domain-service/interface';

export type CreateCommentCommandPayload = {
  actor: UserDto;
} & Omit<BasedCommentPayload, 'userId'>;

export class CreateCommentCommand implements ICommand {
  public constructor(public readonly payload: CreateCommentCommandPayload) {}
}
