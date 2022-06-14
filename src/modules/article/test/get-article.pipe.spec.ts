import { GetPostPipe } from '../pipes';

describe('GetArticlePipe.transform', () => {
  const pipe = new GetPostPipe();

  it('expect transform', async () => {
    return expect(pipe.transform({ categories: [] })).toEqual({
      "categories": [],
      "childCommentLimit": 10,
      "childCommentOrder": "DESC",
      "commentLimit": 10,
      "commentOrder": "DESC"
    });
  })
})
