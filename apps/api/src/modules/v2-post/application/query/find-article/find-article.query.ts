import { IQuery } from '@nestjs/cqrs';

import { UserDto } from '../../../../v2-user/application';

type Props = {
  articleId: string;
  authUser: UserDto;
};
export class FindArticleQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
