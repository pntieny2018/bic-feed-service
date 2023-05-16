import { GIPHY_APPLICATION_TOKEN } from '../../../application/interface/giphy.app-service.interface';
import { GiphyApplicationService } from '../../../application/giphy.app-service';
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { GifType, GiphyRating } from '../../../data-type';
import { GiphyController } from '../../../driving-adapter/controller/giphy.controller';

describe('GiphyController', () => {
  let controller: GiphyController;
  let appService: GiphyApplicationService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GiphyController,
        {
          provide: GIPHY_APPLICATION_TOKEN,
          useValue: createMock<GiphyApplicationService>(),
        },
      ],
    }).compile();
    controller = module.get<GiphyController>(GiphyController);
    appService = module.get(GIPHY_APPLICATION_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const giphyMocked = [
    {
      id: 'ka55CqnDNjQ7iIKtRa',
      type: 'gif',
      url: 'https://i.giphy.com/media/ka55CqnDNjQ7iIKtRa/giphy.gif',
      height: '69',
      width: '69',
      size: '47743',
    },
    {
      id: '11o5fBqY66IciQ',
      type: 'gif',
      url: 'https://i.giphy.com/media/11o5fBqY66IciQ/giphy.gif',
      height: '62',
      width: '85',
      size: '47374',
    },
  ];

  describe('GiphyController.getTrendingGifs', () => {
    const props = {
      limit: 2,
      rating: GiphyRating.g,
      type: GifType.PREVIEW_GIF,
    };
    it('should return an array of GiphyDto', async () => {
      jest.spyOn(appService, 'getTrendingGifs').mockResolvedValue(giphyMocked);
      const result = await controller.getTrendingGif(props);
      expect(result).toEqual(giphyMocked);
    });
  });

  describe('GiphyController.searchGifs', () => {
    const props = {
      limit: 2,
      rating: GiphyRating.g,
      type: GifType.PREVIEW_GIF,
      q: 'test',
    };
    it('should return an array of GiphyDto', async () => {
      jest.spyOn(appService, 'searchGifs').mockResolvedValue(giphyMocked);
      const result = await controller.searchGif(props);
      expect(result).toEqual(giphyMocked);
    });
  });
});
