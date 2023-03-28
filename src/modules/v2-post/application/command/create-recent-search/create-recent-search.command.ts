import { ICommand } from '@nestjs/cqrs';
import { RecentSearchType } from '../../../data-type/recent-search-type.enum';

export type CreateRecentSearchCommandPayload = {
  keyword: string;
  target: RecentSearchType;
  userId: string;
};

export class CreateRecentSearchCommand implements ICommand {
  public constructor(public readonly payload: CreateRecentSearchCommandPayload) {}
}
