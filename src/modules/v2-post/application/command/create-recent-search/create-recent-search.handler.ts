import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateRecentSearchCommand } from './create-recent-search.command';
import { CreateRecentSearchDto } from './create-recent-search.dto';

@CommandHandler(CreateRecentSearchCommand)
export class CreateRecentSearchHandler
  implements ICommandHandler<CreateRecentSearchCommand, CreateRecentSearchDto>
{
  public async execute(command: CreateRecentSearchCommand): Promise<CreateRecentSearchDto> {
    const { target, keyword, userId } = command.payload;

    return null ;
  }
}
