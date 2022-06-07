import { GetSeriesPipe } from '../pipes';

describe('GetSeriesPipe.transform', () => {
  const pipe = new GetSeriesPipe();

  it('expect transform', async () => {
    return expect(pipe.transform({})).toEqual({
      "limit": 10,
      "offset": 0,
      "orderField": "updatedAt"
    });
  })
})
