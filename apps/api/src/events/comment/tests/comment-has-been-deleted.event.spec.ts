import { CommentHasBeenDeletedEvent } from '../comment-has-been-deleted.event';
import { CommentHasBeenDeleted } from '../../../common/constants';

describe('CommentHasBeenDeletedEvent', function () {
  let commentHasBeenDeletedEvent: CommentHasBeenDeletedEvent;
  beforeEach(() => {
    commentHasBeenDeletedEvent = new CommentHasBeenDeletedEvent(null);
  });
  it('should be defined with event name', function () {
    expect(commentHasBeenDeletedEvent.getEventName()).toEqual(CommentHasBeenDeleted);
  });
});
