import { ICommand } from '@nestjs/cqrs';

export type DeleteTagCommandPayload = {
  id: string;
  userId: string;
};
export class DeleteTagCommand implements ICommand {
  public constructor(public readonly payload: DeleteTagCommandPayload) {}
}
