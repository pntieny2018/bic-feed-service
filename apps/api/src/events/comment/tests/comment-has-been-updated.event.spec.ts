import { CommentHasBeenUpdated } from '../../../common/constants';
import { CommentHasBeenUpdatedEvent } from '../comment-has-been-updated.event';

describe('CommentHasBeenUpdatedEvent', function () {
  let commentHasBeenUpdatedEvent: CommentHasBeenUpdatedEvent;
  beforeEach(() => {
    commentHasBeenUpdatedEvent = new CommentHasBeenUpdatedEvent(null);
  });
  it('should be defined with event name', function () {
    expect(commentHasBeenUpdatedEvent.getEventName()).toEqual(CommentHasBeenUpdated);
  });
});
