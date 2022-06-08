import { Test, TestingModule } from '@nestjs/testing';
import { ReactionService } from '../../modules/reaction';
import { SentryService } from '@app/sentry';
import { ReactionListener } from '../reaction';
import { PostService } from '../../modules/post/post.service';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { UserService } from '../../shared/user';
import { Sequelize } from 'sequelize-typescript';
import { NotificationService } from '../../notification';
import { CreateReactionInternalEvent, DeleteReactionInternalEvent } from '../../events/reaction';
import { CreateReactionEventInternalPayload, DeleteReactionEventInternalPayload } from '../../events/reaction/payload';

describe('ReactionListener', () => {

  let reactionListener;
  let notificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionListener,
        {
          provide: NotificationService,
          useValue: {
            publishReactionNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    reactionListener = module.get<ReactionListener>(ReactionListener);
    notificationService = module.get<NotificationService>(NotificationService);
  })

  describe('ReactionListener.onCreatedReactionEvent', () => {
    const usersHasBeenReactionedEvent = new CreateReactionInternalEvent(
      new CreateReactionEventInternalPayload()
    )
    it('should success', async () => {
      const loggerSpy = jest.spyOn(reactionListener['_logger'], 'debug').mockReturnThis();
      await reactionListener.onCreatedReactionEvent(usersHasBeenReactionedEvent)
      expect(loggerSpy).toBeCalled()
      expect(notificationService.publishReactionNotification).toBeCalled()
    })
  })

  describe('ReactionListener.onDeleteReactionEvent', () => {
    const deleteReactionInternalEvent = new DeleteReactionInternalEvent(
      new DeleteReactionEventInternalPayload()
    )
    it('should success', async () => {
      const loggerSpy = jest.spyOn(reactionListener['_logger'], 'debug').mockReturnThis();
      await reactionListener.onDeleteReactionEvent(deleteReactionInternalEvent)
      expect(loggerSpy).toBeCalled()
      expect(notificationService.publishReactionNotification).toBeCalled()
    })
  })

})
