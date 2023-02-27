import { IQueryResult } from '@nestjs/cqrs';
import { GroupDto } from '../../../../v2-group/application';
import { UserDto } from '../../../../v2-user/application';

export class FindReactionsDto implements IQueryResult {
  public readonly rows: {
    id: string;
    reactionName: string;
    createdAt: Date;
    actor: Omit<UserDto, 'permissions'>;
  }[];
  public readonly total: number;
}
