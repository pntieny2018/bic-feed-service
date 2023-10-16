import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  articleId: string;
  authUser: UserDto;
};
export class FindArticleQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
