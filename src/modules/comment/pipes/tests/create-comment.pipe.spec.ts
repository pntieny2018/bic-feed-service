import { CreateCommentPipe } from '../create-comment.pipe';

describe('CreateCommentPipe', function () {
  let createCommentPipe: CreateCommentPipe;

  beforeEach(() => {
    createCommentPipe = new CreateCommentPipe();
  });

  it('CreateCommentPipe.transform should set default value', () => {
    const response = createCommentPipe.transform({
      postId: 1,
      mentions: null,
      content: null,
      media: {        
        images: null,
        videos: null,
        files: null,
      },
    });

    expect(response).toEqual({
      postId: 1,
      mentions: [],
      content: null,
      media: {        
        images: [],
        videos: [],
        files: [],
      },
    });
  });

  it('CreateCommentPipe.transform should set default value when missing key', () => {
    const response = createCommentPipe.transform({
      postId: 1,
      content: null,
      media: {
        files: null,
      },
    });

    expect(response).toEqual({
      postId: 1,
      mentions: [],
      content: null,
      media: {        
        images: [],
        videos: [],
        files: [],
      },
    });
  });
});
