import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type DeleteCommentCommandPayload = {
  commentId: string;
  actor: UserDto;
};

export class DeleteCommentCommand implements ICommand {
  public constructor(public readonly payload: DeleteCommentCommandPayload) {}
}
