import { CommandHandler } from '@nestjs/cqrs';
import { DeleteRecentSearchCommand } from './delete-recent-search.command';
import { Inject } from '@nestjs/common';
import {
  IRecentSearchDomainService,
  RECENT_SEARCH_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import {
  IRecentSearchRepository,
  RECENT_SEARCH_REPOSITORY_TOKEN,
} from '../../../driven-adapter/repository/interface/recent-search.repository.interface';
import { RecentSearchNotFoundException } from '../../../domain/exception';

@CommandHandler(DeleteRecentSearchCommand)
export class DeleteRecentSearchHandler {
  @Inject(RECENT_SEARCH_DOMAIN_SERVICE_TOKEN)
  private readonly _recentSearchDomainService: IRecentSearchDomainService;

  @Inject(RECENT_SEARCH_REPOSITORY_TOKEN)
  private readonly _recentSearchRepository: IRecentSearchRepository;

  public async execute(command: DeleteRecentSearchCommand): Promise<void> {
    const { id, userId } = command.payload;
    if (id) {
      const findRecentSearch = await this._recentSearchRepository.findOne({
        id,
        userId,
      });
      if (!findRecentSearch) {
        throw new RecentSearchNotFoundException();
      }
    }
    await this._recentSearchDomainService.deleteRecentSearch(command.payload);
  }
}
