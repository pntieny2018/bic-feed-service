import { GIPHY_APPLICATION_TOKEN } from '../application/interface/giphy.app-service.interface';
import { GiphyApplicationService } from '../application/giphy.app-service';
import { GIPHY_REPOSITORY_TOKEN } from '../driven-adapter/repository/interface/giphy.repository.interface';
import { GiphyRepository } from '../driven-adapter/repository/giphy.repository';

export const giphyProvider = [
  {
    provide: GIPHY_APPLICATION_TOKEN,
    useClass: GiphyApplicationService,
  },
  {
    provide: GIPHY_REPOSITORY_TOKEN,
    useClass: GiphyRepository,
  },
];
