import { ICommand } from '@nestjs/cqrs';

export type CreateRecentSearchCommandPayload = {
  keyword: string;
  target: string;
  userId: string;
};

export class CreateRecentSearchCommand implements ICommand {
  public constructor(public readonly payload: CreateRecentSearchCommandPayload) {}
}
