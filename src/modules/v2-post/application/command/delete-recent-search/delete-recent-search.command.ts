import { RecentSearchType } from '../../../data-type/recent-search-type.enum';
import { ICommand } from '@nestjs/cqrs';

export type DeleteRecentSearchCommandPayload = {
  id?: string;
  target?: RecentSearchType;
};

export class DeleteRecentSearchCommand implements ICommand {
  public constructor(public readonly payload: DeleteRecentSearchCommandPayload) {}
}
