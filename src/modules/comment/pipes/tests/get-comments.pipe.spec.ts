import { GetCommentsPipe } from '../get-comments.pipe';
import { OrderEnum } from '../../../../common/dto';

describe('GetCommentsPipe', function () {
  let getCommentsPipe: GetCommentsPipe;

  beforeEach(() => {
    getCommentsPipe = new GetCommentsPipe();
  });

  it('GetCommentsPipe.transform should set default value', () => {
    const response = getCommentsPipe.transform({
      postId: '1',
    });

    expect(response).toEqual({
      postId: '1',
      limit: 25,
      order: OrderEnum.DESC,
      childOrder: OrderEnum.DESC,
      childLimit: 0,
      parentId: '00000000-0000-0000-0000-000000000000',
    });
  });
});
