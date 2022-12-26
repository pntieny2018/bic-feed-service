import {
  AccountImplement,
  AccountProperties
} from 'src/account/domain/Account';
import { AccountOpenedEvent } from 'src/account/domain/event/AccountOpenedEvent';
import { PostImplement } from '../post/post';


describe('Post', () => {
  describe('update', () => {
    it('should apply PostUpdatedEvent', () => {
      const account = new PostImplement({
        id: 'id',
        title: 'title',
      } as AccountProperties);

      account.update();

      const appliedEvent = account.getUncommittedEvents();

      expect(appliedEvent).toEqual([new AccountOpenedEvent('id', 'email')]);
    });
  });
});
