import { IQuery } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';

type Props = {
  seriesIds: string[];
  authUser: UserDto;
};
export class FindItemsBySeriesQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
