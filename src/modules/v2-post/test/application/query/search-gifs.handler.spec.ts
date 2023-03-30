import { GiphyQuery } from '../../../driven-adapter/query';
import { Test, TestingModule } from '@nestjs/testing';
import { GIPHY_QUERY_TOKEN } from '../../../domain/query-interface';
import { createMock } from '@golevelup/ts-jest';
import { GiphyEntity } from '../../../domain/model/giphy/giphy.entity';
import { SearchGifsHandler } from '../../../application/query/find-giphy/search-gifs.handler';

describe('SearchGifsHandler', () => {
  let handler: SearchGifsHandler;
  let query: GiphyQuery;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchGifsHandler,
        {
          provide: GIPHY_QUERY_TOKEN,
          useValue: createMock<GiphyQuery>(),
        }
      ],
    }).compile();
    handler = module.get<SearchGifsHandler>(SearchGifsHandler);
    query = module.get(GIPHY_QUERY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const queryRecords = [
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
  ]
  const queryEntities = queryRecords.map((record) => new GiphyEntity(record));
  describe('execute', () => {
    it('Should search gifs success', async () => {
      jest.spyOn(query, 'searchGifs').mockResolvedValue(queryEntities);
      const result = await handler.execute({payload: {limit: 10, rating: 'g', type: 'preview_gif', q: 'test'}});
      expect(result).toEqual(queryRecords);
    });
  });
});
