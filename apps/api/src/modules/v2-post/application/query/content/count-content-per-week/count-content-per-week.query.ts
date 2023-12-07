import { IQuery } from '@nestjs/cqrs';

type CountContentPerWeekQueryPayload = {
  rootGroupIds: string[];
};
export class CountContentPerWeekQuery implements IQuery {
  public constructor(public readonly payload: CountContentPerWeekQueryPayload) {}
}
