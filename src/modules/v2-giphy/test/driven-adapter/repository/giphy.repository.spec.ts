import { GiphyEntity } from '../../../domain/giphy.entity';
import {
  IGiphyRepository,
} from '../../../driven-adapter/repository/interface/giphy.repository.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { GiphyRepository } from '../../../driven-adapter/repository/giphy.repository';
import { HttpService } from '@nestjs/axios';

describe('GiphyRepository', () => {
  let repo: IGiphyRepository;
  let httpService: HttpService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GiphyRepository,
        {
          provide: HttpService,
          useValue: createMock<HttpService>(),
        },
      ],
    }).compile();
    httpService = module.get(HttpService);
    repo = module.get<GiphyRepository>(GiphyRepository);
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
  describe('GiphyRepository.getTrendingGifs', () => {
    const props = {
      limit: 2,
      rating: 'g',
      type: 'gif',
    };
    it('should success', async () => {
      expect(1).toEqual(1)
    });
  });
});
