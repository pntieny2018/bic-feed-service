import { Test, TestingModule } from '@nestjs/testing';
import { CommentController } from '../comment.controller';
import { CommentService } from '../comment.service';
import { authUserMock } from './mocks/user.mock';
import { createTextCommentDto } from './mocks/create-comment-dto.mock';

describe('CommentController', () => {
  let controller: CommentController;
  let commentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [
        {
          provide: CommentService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
            getComment: jest.fn(),
            getComments: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CommentController>(CommentController);
    commentService = module.get<CommentService>(CommentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('CommentController.getList', () => {
    it('logger should be called', async () => {
      const logSpy = jest.spyOn(controller['_logger'], 'debug').mockReturnThis();
      await controller.getList(authUserMock, {
        postId: 1,
        limit: 10,
        childLimit: 10,
      });
      expect(logSpy).toBeCalled();
    });

    it('CommentService.getComments should be called', async () => {
      commentService.getComments.mockResolvedValue([]);
      await controller.getList(authUserMock, {
        postId: 1,
        limit: 10,
        childLimit: 10,
      });
      expect(commentService.getComments).toBeCalled();
    });
  });

  describe('CommentController.create', () => {
    it('logger should be called', async () => {
      const logSpy = jest.spyOn(controller['_logger'], 'debug').mockReturnThis();
      await controller.create(authUserMock, createTextCommentDto);
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
      await controller.reply(authUserMock, 1, createTextCommentDto);
      expect(logSpy).toBeCalled();
    });

    it('CommentService.create should be called', async () => {
      commentService.create.mockResolvedValue({});
      await controller.reply(authUserMock, 1, createTextCommentDto);
      expect(commentService.create).toBeCalled();
    });
  });

  describe('CommentController.get', () => {
    it('logger should be called', async () => {
      const logSpy = jest.spyOn(controller['_logger'], 'debug').mockReturnThis();
      await controller.get(authUserMock, 1);
      expect(logSpy).toBeCalled();
    });

    it('CommentService.get should be called', async () => {
      commentService.getComment.mockResolvedValue([]);
      await controller.get(authUserMock, 1);
      expect(commentService.getComment).toBeCalled();
    });
  });

  describe('CommentController.update', () => {
    it('logger should be called', async () => {
      const logSpy = jest.spyOn(controller['_logger'], 'debug').mockReturnThis();
      await controller.update(authUserMock, 1, {
        data: {
          content: '1,2,3',
        },
      });
      expect(logSpy).toBeCalled();
    });

    it('CommentService.update should be called', async () => {
      commentService.update.mockResolvedValue([]);
      await controller.update(authUserMock, 1, {
        data: {
          content: '1,2,3',
        },
      });
      expect(commentService.update).toBeCalled();
    });
  });

  describe('CommentController.destroy', () => {
    it('logger should be called', async () => {
      const logSpy = jest.spyOn(controller['_logger'], 'debug').mockReturnThis();
      await controller.destroy(authUserMock, 1);
      expect(logSpy).toBeCalled();
    });

    it('CommentService.destroy should be called', async () => {
      commentService.destroy.mockResolvedValue([]);
      await controller.destroy(authUserMock, 1);
      expect(commentService.destroy).toBeCalled();
    });
  });
});
