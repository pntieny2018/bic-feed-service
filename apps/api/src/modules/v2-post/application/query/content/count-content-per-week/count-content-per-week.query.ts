import { RootGroupRequestDto } from '@api/modules/v2-post/driving-apdater/dto/request';
import { IQuery } from '@nestjs/cqrs';

type CountContentPerWeekQueryPayload = {
  rootGroups: RootGroupRequestDto[];
};
export class CountContentPerWeekQuery implements IQuery {
  public constructor(public readonly payload: CountContentPerWeekQueryPayload) {}
}
