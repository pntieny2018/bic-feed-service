import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateRecentSearchCommand } from './create-recent-search.command';
import { CreateRecentSearchDto } from './create-recent-search.dto';
import { Inject } from '@nestjs/common';
import {
  IRecentSearchRepository,
  RECENT_SEARCH_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import {
  IRecentSearchDomainService,
  RECENT_SEARCH_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';

@CommandHandler(CreateRecentSearchCommand)
export class CreateRecentSearchHandler
  implements ICommandHandler<CreateRecentSearchCommand, CreateRecentSearchDto>
{
  @Inject(RECENT_SEARCH_REPOSITORY_TOKEN)
  private readonly _recentSearchRepository: IRecentSearchRepository;
  @Inject(RECENT_SEARCH_DOMAIN_SERVICE_TOKEN)
  private readonly _recentSearchDomainService: IRecentSearchDomainService;

  public async execute(command: CreateRecentSearchCommand): Promise<CreateRecentSearchDto> {
    const { target, keyword, userId } = command.payload;

    const findRecentSearch = await this._recentSearchRepository.findOne({
      target,
      keyword,
    });
    if (findRecentSearch) {
    } else {
      // create new recent search with totalUsed = 1
    }
    return {
      id: findRecentSearch.get('id'),
      keyword: findRecentSearch.get('keyword'),
    };
  }
}
