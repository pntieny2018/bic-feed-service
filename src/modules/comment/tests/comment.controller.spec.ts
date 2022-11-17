import { Test, TestingModule } from '@nestjs/testing';
import { CommentController } from '../comment.controller';
import { CommentService } from '../comment.service';
import { authUserMock } from './mocks/user.mock';
import { createdComment, createTextCommentDto } from './mocks/create-comment-dto.mock';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { SentryService } from '../../../../libs/sentry/src';
import { CommentHistoryService } from '../comment-history.service';

describe.skip('CommentController', () => {
  let controller: CommentController;
  let commentService;
  let commentHistoryService;
  let internalEventEmitterService: InternalEventEmitterService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [
        {
          provide: CommentHistoryService,
          useValue: {
            getCommentEditedHistory: jest.fn()
          },
        },
        {
          provide: CommentService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
            getComment: jest.fn(),
            getComments: jest.fn(),
            getCommentsArroundId: jest.fn()
          },
        },
        {
          provide: InternalEventEmitterService,
          useValue: {
            emit: jest.fn(),
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

    controller = module.get<CommentController>(CommentController);
    commentService = module.get<CommentService>(CommentService);
    commentHistoryService = module.get<CommentHistoryService>(CommentHistoryService);
    internalEventEmitterService = module.get<InternalEventEmitterService>(
      InternalEventEmitterService
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('CommentController.getList', () => {
    it('logger should be called', async () => {
      const logSpy = jest.spyOn(controller['_logger'], 'debug').mockReturnThis();
      await controller.getList(authUserMock, {
        postId: createdComment.postId,
        limit: 10,
        childLimit: 10,
      });
      expect(logSpy).toBeCalled();
    });

    it('CommentService.getComments should be called', async () => {
      commentService.getComments.mockResolvedValue([]);
      await controller.getList(authUserMock, {
        postId: createdComment.postId,
        limit: 10,
        childLimit: 10,
      });
      expect(commentService.getComments).toBeCalled();
    });
  });

  describe('CommentController.create', () => {
    it('logger should be called', async () => {
      const logSpy = jest.spyOn(controller['_logger'], 'debug').mockReturnThis();
      await controller.create(authUserMock, createTextCommentDto).catch(() => {});
      expect(logSpy).toBeCalled();
    });

    it('CommentService.create should be called', async () => {
      commentService.create.mockResolvedValue({});
      await controller.create(authUserMock, createTextCommentDto);
      expect(commentService.create).toBeCalled();
    });
  });

  describe('CommentController.reply', () => {
    it('logger should be called', async () => {
      const logSpy = jest.spyOn(controller['_logger'], 'debug').mockReturnThis();
      await controller.reply(authUserMock, createdComment.id, createTextCommentDto).catch(() => {});
      expect(logSpy).toBeCalled();
    });

    it('CommentService.create should be called', async () => {
      commentService.create.mockResolvedValue({});
      await controller.reply(authUserMock, createdComment.id, createTextCommentDto);
      expect(commentService.create).toBeCalled();
    });
  });

  describe('CommentController.get', () => {
    it('logger should be called', async () => {
      const logSpy = jest.spyOn(controller['_logger'], 'debug').mockReturnThis();
      await controller.get(authUserMock, createdComment.id, {});
      expect(logSpy).toBeCalled();
    });

    it('CommentService.getCommentsArroundId should be called', async () => {
      commentService.getCommentsArroundId.mockResolvedValue([]);
      await controller.get(authUserMock, createdComment.id, {});
      expect(commentService.getCommentsArroundId).toBeCalled();
    });
  });

  describe('CommentController.update', () => {
    it('logger should be called', async () => {
      const logSpy = jest.spyOn(controller['_logger'], 'debug').mockReturnThis();
      commentService.update = jest.fn().mockResolvedValue({ comment: { id: createdComment.id } });
      internalEventEmitterService.emit = jest.fn().mockResolvedValue(Promise.resolve());
      commentService.getComment = jest.fn().mockResolvedValue('OK');
      await controller
        .update(authUserMock, createdComment.id, {
          content: '1,2,3',
        })
      expect(logSpy).toBeCalled();
    });

    it('CommentService.update should be called', async () => {
      commentService.update.mockResolvedValue([]);
      await controller
        .update(authUserMock, createdComment.id, {
          content: '1,2,3',
        })
        .catch(() => {});
      expect(commentService.update).toBeCalled();
    });
  });

  describe('CommentController.destroy', () => {
    it('logger should be called', async () => {
      const logSpy = jest.spyOn(controller['_logger'], 'debug').mockReturnThis();
      await controller.destroy(authUserMock, createdComment.id);
      expect(logSpy).toBeCalled();
    });

    it('CommentService.destroy should be called', async () => {
      commentService.destroy.mockResolvedValue([]);
      await controller.destroy(authUserMock, createdComment.id);
      expect(commentService.destroy).toBeCalled();
    });
  });

  describe('CommentController.getCommentEditedHistory', () => {
    it('Should successfully', async () => {
      commentHistoryService.getCommentEditedHistory = jest.fn().mockResolvedValue(Promise.resolve());
      await controller.getCommentEditedHistory(authUserMock, createdComment.id, null);
      expect(commentHistoryService.getCommentEditedHistory).toBeCalledTimes(1);
    });
  });
});
