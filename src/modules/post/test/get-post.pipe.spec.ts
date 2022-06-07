import { GetPostPipe } from '../pipes';

describe('GetPostPipe.transform', () => {
  const pipe = new GetPostPipe();

  it('expect transform', async () => {
    return expect(pipe.transform({})).toEqual({
      "childCommentLimit": 10,
      "childCommentOrder": "DESC",
      "commentLimit": 10,
      "commentOrder": "DESC",
      "withComment": false
    });
  })
})
