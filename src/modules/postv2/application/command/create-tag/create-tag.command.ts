import { ICommand } from '@nestjs/cqrs';

type Props = {
  groupId: string;
  name: string;
  userId: string;
};
export class CreatetagCommand implements ICommand {
  public constructor(public readonly payload: Props) {}
}
