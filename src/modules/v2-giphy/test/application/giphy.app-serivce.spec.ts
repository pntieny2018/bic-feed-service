import {
  GIPHY_REPOSITORY_TOKEN,
  IGiphyRepository,
} from '../../driven-adapter/repository/interface/giphy.repository.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { GiphyApplicationService } from '../../application/giphy.app-service';
import { createMock } from '@golevelup/ts-jest';
import { GiphyRepository } from '../../driven-adapter/repository/giphy.repository';
import { GiphyEntity } from '../../domain/giphy.entity';

describe('GiphyApplicationService', () => {
  let giphyAppService;
  let repo: IGiphyRepository;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GiphyApplicationService,
        {
          provide: GIPHY_REPOSITORY_TOKEN,
          useValue: createMock<GiphyRepository>(),
        },
      ],
    }).compile();
    giphyAppService = module.get<GiphyApplicationService>(GiphyApplicationService);
    repo = module.get(GIPHY_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const giphyMocked =  [
    {
      "id": "ka55CqnDNjQ7iIKtRa",
      "type": "gif",
      "url": "https://i.giphy.com/media/ka55CqnDNjQ7iIKtRa/giphy.gif",
      "height": "69",
      "width": "69",
      "size": "47743"
    },
    {
      "id": "11o5fBqY66IciQ",
      "type": "gif",
      "url": "https://i.giphy.com/media/11o5fBqY66IciQ/giphy.gif",
      "height": "62",
      "width": "85",
      "size": "47374"
    }
  ];

  const giphyEntityMocked =  giphyMocked.map(giphy => new GiphyEntity(giphy));
  describe('GiphyApplicationService.getTrendingGifs', () => {
    const props = {
      limit: 2,
      rating: 'g',
      type: 'gif',
    };

    it('should return an array of GiphyEntity', async () => {
      jest.spyOn(repo, 'getTrendingGifs').mockResolvedValue(giphyEntityMocked);
      const result = await giphyAppService.getTrendingGifs(props);
      expect(result).toEqual(giphyMocked);
    });
  });

  describe('GiphyApplicationService.searchGifs', () => {
    const props = {
      q: 'test',
      limit: 2,
      rating: 'g',
      type: 'gif',
      offset: 0,
      lang: 'en',
    };

    it('should return an array of GiphyEntity', async () => {
      jest.spyOn(repo, 'searchGifs').mockResolvedValue(giphyEntityMocked);
      const result = await giphyAppService.searchGifs(props);
      expect(result).toEqual(giphyMocked);
    });
  });
});
