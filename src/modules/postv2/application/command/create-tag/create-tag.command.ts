import { ICommand } from '@nestjs/cqrs';

type Props = {
  groupId: string;
  name: string;
  userId: string;
};
export class CreateTagCommand implements ICommand {
  public constructor(public readonly payload: Props) {}
}
