import { ICommand } from '@nestjs/cqrs';

export class CreatetagCommand implements ICommand {
  public constructor(
    public readonly groupId: string,
    public readonly name: string,
    public readonly userId: string
  ) {}
}
