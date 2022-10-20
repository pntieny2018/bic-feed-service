import { CreateCommentPipe, GetCommentsPipe } from '../pipes';
import { GetCommentLinkPipe } from '../pipes/get-comment-link.pipe';

describe('CreateCommentPipe.transform', () => {
  const pipe = new CreateCommentPipe();

  it('expect transform', async () => {
    return expect(pipe.transform({ content: 'asd', postId: '123', media: {} })).toEqual({
      "content": "asd",
      "media": {
        "files": [],
        "images": [],
        "videos": []
      },
      "mentions": [],
      "postId": "123"
    });
  })
})

describe('GetCommentLinkPipe.transform', () => {
  const pipe = new GetCommentLinkPipe();

  it('expect transform', async () => {
    return expect(pipe.transform({})).toEqual({
      "childLimit": 0,
      "limit": 10,
      "targetChildLimit": 0
    });
  })
})


describe('GetCommentsPipe.transform', () => {
  const pipe = new GetCommentsPipe();

  it('expect transform', async () => {
    return expect(pipe.transform({ postId: '1' })).toEqual({
      "childLimit": 0,
      "childOrder": "DESC",
      "limit": 25,
      "order": "DESC",
      "parentId": "00000000-0000-0000-0000-000000000000",
      "postId": "1"
    });
  })
})
