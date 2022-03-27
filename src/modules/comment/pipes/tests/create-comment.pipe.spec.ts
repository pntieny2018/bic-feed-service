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
      data: {
        content: null,
        images: null,
        videos: null,
        files: null,
      },
    });

    expect(response).toEqual({
      postId: 1,
      mentions: [],
      data: {
        content: null,
        images: [],
        videos: [],
        files: [],
      },
    });
  });

  it('CreateCommentPipe.transform should set default value when missing key', () => {
    const response = createCommentPipe.transform({
      postId: 1,
      data: {
        files: null,
      },
    });

    expect(response).toEqual({
      postId: 1,
      mentions: [],
      data: {
        content: null,
        images: [],
        videos: [],
        files: [],
      },
    });
  });
});
