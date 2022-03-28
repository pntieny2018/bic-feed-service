import { CommentHasBeenCreatedEvent } from '../comment-has-been-created.event';
import { CommentHasBeenCreated } from '../../../common/constants';

describe('CommentHasBeenCreatedEvent', function () {
  let commentHasBeenCreatedEvent: CommentHasBeenCreatedEvent;
  beforeEach(() => {
    commentHasBeenCreatedEvent = new CommentHasBeenCreatedEvent(null);
  });
  it('should be defined with event name', function () {
    expect(commentHasBeenCreatedEvent.getEventName()).toEqual(CommentHasBeenCreated);
  });
});
