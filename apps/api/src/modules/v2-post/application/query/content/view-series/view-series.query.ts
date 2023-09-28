import { IQuery } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';

type Props = {
  authUser: UserDto;
  contentId: string;
};
export class ViewSeriesQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
