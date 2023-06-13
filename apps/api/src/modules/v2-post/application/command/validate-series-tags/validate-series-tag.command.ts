import { ICommand } from '@nestjs/cqrs';

export type ValidateSeriesTagsCommandPayload = {
  groupIds: string[];
  seriesIds: string[];
  tagIds: string[];
};
export class ValidateSeriesTagsCommand implements ICommand {
  public constructor(public readonly payload: ValidateSeriesTagsCommandPayload) {}
}
