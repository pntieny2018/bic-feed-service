import { RecentSearchType } from '../../../data-type/recent-search-type.enum';
import { ICommand } from '@nestjs/cqrs';

export type DeleteRecentSearchCommandPayload = {
  id?: string;
  target?: RecentSearchType;
  userId?: string;
};

export class DeleteRecentSearchCommand implements ICommand {
  public constructor(public readonly payload: DeleteRecentSearchCommandPayload) {}
}
