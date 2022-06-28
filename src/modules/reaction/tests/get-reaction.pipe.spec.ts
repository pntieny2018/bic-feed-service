import { GetReactionPipe } from '../pipes';

describe('GetReactionPipe.transform', () => {
  const pipe = new GetReactionPipe();

  it('expect transform', async () => {
    return expect(pipe.transform({
      latestId: '',
      limit: 0,
      order: undefined,
      reactionName: '',
      target: undefined,
      targetId: ''
    })).toEqual({
      latestId: '00000000-0000-0000-0000-000000000000',
      limit: 25,
      order: 'DESC',
      reactionName: '',
      target: undefined,
      targetId: ''
    });
  })
})
