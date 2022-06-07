import { Test, TestingModule } from '@nestjs/testing';
import { CommentListener } from '../comment';
import { CommentService } from '../../modules/comment';
import { CommentNotificationService } from '../../notification/services';
import { SentryService } from '@app/sentry';
import { authUserMock } from '../../modules/comment/tests/mocks/user.mock';
import { mockCommentResponseDto, mockICommentReaction } from '../../modules/reaction/tests/mocks/input.mock';
import {
  CommentHasBeenCreatedEvent,
  CommentHasBeenDeletedEvent,
  CommentHasBeenUpdatedEvent,
} from '../../events/comment';
import { CommentHasBeenUpdatedEventPayload } from '../../events/comment/payload';

describe('CommentListener', () => {

  let commentListener;
  let commentNotificationService;
  let commentService;
  let sentryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentListener,
        {
          provide: CommentService,
          useValue: {
            getComment: jest.fn(),
          },
        },
        {
          provide: CommentNotificationService,
          useValue: {
            create: jest.fn(),
            destroy: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
        },
      ],
    }).compile();

    commentListener = module.get<CommentListener>(CommentListener);
    commentService = module.get<CommentService>(CommentService);
    commentNotificationService = module.get<CommentNotificationService>(CommentNotificationService);
    sentryService = module.get<SentryService>(SentryService);
  })
  const errorMessage = 'Error'

  describe('CommentListener.onCommentHasBeenCreated', () => {
    it('should success', async () => {
      const loggerSpy = jest.spyOn(commentListener['_logger'], 'debug').mockReturnThis();
      commentService.getComment.mockResolvedValue([]);
      commentNotificationService.create.mockResolvedValue()
      mockCommentResponseDto.parentId = '1234'
      await commentListener.onCommentHasBeenCreated(new CommentHasBeenCreatedEvent({
        actor: authUserMock,
        commentResponse: mockCommentResponseDto,
      }))
      expect(loggerSpy).toBeCalled()
      expect(commentService.getComment).toBeCalled()
      expect(commentNotificationService.create).toBeCalled()
    })

    it('should fail', async () => {
      const loggerSpy = jest.spyOn(commentListener['_logger'], 'error').mockReturnThis();
      commentNotificationService.create.mockRejectedValue(errorMessage)
      await commentListener.onCommentHasBeenCreated(new CommentHasBeenCreatedEvent({
        actor: authUserMock,
        commentResponse: mockCommentResponseDto,
      }))
      expect(loggerSpy).toBeCalled()
      expect(commentNotificationService.create).toBeCalled()
      expect(sentryService.captureException).toBeCalled()
    })
  })

  describe('CommentListener.onCommentHasBeenUpdated', () => {

    const commentHasBeenUpdatedEvent = new CommentHasBeenUpdatedEvent(new CommentHasBeenUpdatedEventPayload())
    it('should success', async () => {
      const loggerSpy = jest.spyOn(commentListener['_logger'], 'debug').mockReturnThis();
      commentNotificationService.update.mockResolvedValue()
      await commentListener.onCommentHasBeenUpdated(commentHasBeenUpdatedEvent)
      expect(loggerSpy).toBeCalled()
      expect(commentNotificationService.update).toBeCalled()
    })

    it('should fail', async () => {
      const loggerSpy = jest.spyOn(commentListener['_logger'], 'error').mockReturnThis();
      commentNotificationService.update.mockRejectedValue(errorMessage)
      await commentListener.onCommentHasBeenUpdated(commentHasBeenUpdatedEvent)
      expect(loggerSpy).toBeCalled()
      expect(commentNotificationService.update).toBeCalled()
      expect(sentryService.captureException).toBeCalled()
    })
  })

  describe('CommentListener.onCommentHasBeenDeleted', () => {
    const commentHasBeenDeletedEvent = new CommentHasBeenDeletedEvent({
      comment: {id: '1', actor: authUserMock, postId: '1', createdBy: 1, updatedBy: 1, post: null},
      actor: authUserMock
    })
    it('should success', async () => {
      const loggerSpy = jest.spyOn(commentListener['_logger'], 'debug').mockReturnThis();
      commentNotificationService.destroy.mockResolvedValue()
      await commentListener.onCommentHasBeenDeleted(commentHasBeenDeletedEvent)
      expect(loggerSpy).toBeCalled()
      expect(commentNotificationService.destroy).toBeCalled()
    })

    it('should fail', async () => {
      const loggerSpy = jest.spyOn(commentListener['_logger'], 'error').mockReturnThis();
      commentNotificationService.destroy.mockRejectedValue(errorMessage)
      await commentListener.onCommentHasBeenDeleted(commentHasBeenDeletedEvent)
      expect(loggerSpy).toBeCalled()
      expect(commentNotificationService.destroy).toBeCalled()
      expect(sentryService.captureException).toBeCalled()
    })
  })
})
