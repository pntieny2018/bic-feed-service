import { CreateCommentPipe } from '../create-comment.pipe';

describe('CreateCommentPipe', function () {
  let createCommentPipe: CreateCommentPipe;

  beforeEach(() => {
    createCommentPipe = new CreateCommentPipe();
  });

  it('CreateCommentPipe.transform should set default value', () => {
    const response = createCommentPipe.transform({
      postId: '5aa47b25-14d9-429e-9afa-5512071313ca',
      mentions: null,
      content: null,
      media: {        
        images: null,
        videos: null,
        files: null,
      },
    });

    expect(response).toEqual({
      postId: '5aa47b25-14d9-429e-9afa-5512071313ca',
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
      postId: '5aa47b25-14d9-429e-9afa-5512071313ca',
      content: null,
      media: {
        files: null,
      },
    });

    expect(response).toEqual({
      postId: '5aa47b25-14d9-429e-9afa-5512071313ca',
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
