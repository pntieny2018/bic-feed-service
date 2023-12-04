import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type GetCommentReportedQueryPayload = {
  commentId: string;
  authUser: UserDto;
};

export class GetMyReportedCommentQuery implements IQuery {
  public constructor(public readonly payload: GetCommentReportedQueryPayload) {}
}
