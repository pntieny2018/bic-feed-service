import { ICommand } from '@nestjs/cqrs';

type Props = {
  id: string;
  userId: string;
};
export class DeleteTagCommand implements ICommand {
  public constructor(public readonly payload: Props) {}
}
