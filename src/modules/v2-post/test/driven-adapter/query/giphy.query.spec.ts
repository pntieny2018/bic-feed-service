import { GiphyQuery } from '../../../driven-adapter/query';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { GifType, GiphyRating } from '../../../data-type';

describe('GiphyQuery', () => {
  let query: GiphyQuery;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GiphyQuery,
        {
          provide: HttpService,
          useValue: createMock<HttpService>(),
        },
      ],
    }).compile();

    query = module.get<GiphyQuery>(GiphyQuery);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GetTrendingGif', () => {
    const getTrendingGifsDto = {
      limit: 10,
      rating: GiphyRating.g,
      type: GifType.PREVIEW_GIF,
    };

    it('Should get trending gifs successfully', async () => {
      const result = await query.getTrendingGifs(getTrendingGifsDto);
      expect(result).toEqual([]);
    });
  });

  describe('SearchGif', () => {
    const searchGifsDto = {
      limit: 10,
      rating: GiphyRating.g,
      type: GifType.PREVIEW_GIF,
      q: 'test',
    };

    it('Should search gifs successfully', async () => {
      const result = await query.searchGifs(searchGifsDto);
      expect(result).toEqual([]);
    });
  });
});
