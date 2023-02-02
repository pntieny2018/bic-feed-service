import { ICommand } from '@nestjs/cqrs';

export type UpdateTagPayload = {
  id: string;
  name: string;
  userId: string;
};
export class UpdatetagCommand implements ICommand {
  public constructor(public readonly payload: UpdateTagPayload) {}
}
