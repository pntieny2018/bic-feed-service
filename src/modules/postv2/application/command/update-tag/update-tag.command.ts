import { ICommand } from '@nestjs/cqrs';

type Props = {
  id: string;
  name: string;
  userId: string;
};
export class UpdatetagCommand implements ICommand {
  public constructor(public readonly payload: Props) {}
}
