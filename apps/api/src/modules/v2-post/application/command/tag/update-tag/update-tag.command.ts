import { ICommand } from '@nestjs/cqrs';

export type UpdateTagPayload = {
  id: string;
  name: string;
  userId: string;
};
export class UpdateTagCommand implements ICommand {
  public constructor(public readonly payload: UpdateTagPayload) {}
}
