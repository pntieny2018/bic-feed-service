import { ICommand } from '@nestjs/cqrs';

export class SavePostCommand implements ICommand {
  public constructor(public readonly postId: string, public readonly userId: string) {
      
  }
}
