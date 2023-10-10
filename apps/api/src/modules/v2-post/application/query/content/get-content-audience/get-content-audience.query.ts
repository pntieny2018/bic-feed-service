import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

export type GetContentAudienceProps = {
  authUser: UserDto;
  contentId: string;
  pinnable?: boolean;
};

export class GetContentAudienceQuery implements IQuery {
  public constructor(public readonly payload: GetContentAudienceProps) {}
}
