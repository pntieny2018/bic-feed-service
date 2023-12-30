import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  authUser: UserDto;
  contentId: string;
};

export class FindQuizSummaryQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
