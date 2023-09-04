import { IQuery } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';

type Props = {
  seriesId: string;
  authUser: UserDto;
};
export class FindSeriesQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
