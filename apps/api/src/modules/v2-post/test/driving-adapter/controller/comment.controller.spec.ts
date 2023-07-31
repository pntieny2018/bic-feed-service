import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';
import { userMock } from '../../mock/user.dto.mock';
import { OrderEnum } from '../../../../../common/dto';
import { CommentController } from '../../../driving-apdater/controller/comment.controller';
import { GetListCommentsDto } from '../../../driving-apdater/dto/request';
import {
  CommentNotFoundException,
  CommentReplyNotExistException,
  ContentNoCommentPermissionException,
  ContentNotFoundException,
  InvalidCursorParamsException,
} from '../../../domain/exception';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { commentMock } from '../../mock/comment.model.mock';

describe('CommentController', () => {
  let commentController: CommentController;
  let command: CommandBus;
  let query: QueryBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentController, CommandBus, QueryBus],
    }).compile();

    commentController = module.get<CommentController>(CommentController);
    command = module.get<CommandBus>(CommandBus);
    query = module.get<QueryBus>(QueryBus);

    jest.spyOn(I18nContext, 'current').mockImplementation(
      () =>
        ({
          t: (...args) => {},
        } as any)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getList', () => {
    it('should return an array of comments', async () => {
      const listCommentDto = {
        postId: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
        order: OrderEnum.DESC,
      } as GetListCommentsDto;
      jest.spyOn(query, 'execute').mockImplementation(() =>
        Promise.resolve({
          list: [commentMock],
          meta: {},
        })
      );

      const res = await commentController.getList(userMock, listCommentDto);
      expect(res).toEqual({
        list: [commentMock],
        meta: {},
      });
      expect(query.execute).toBeCalledWith({
        payload: {
          postId: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
          order: OrderEnum.DESC,
          authUser: userMock,
        },
      });
    });

    it('should throw NotFoundException when post not found', async () => {
      const listCommentDto = {
        postId: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
        order: OrderEnum.DESC,
      } as GetListCommentsDto;
      jest
        .spyOn(query, 'execute')
        .mockImplementation(() => Promise.reject(new ContentNotFoundException('Post not found')));

      await expect(commentController.getList(userMock, listCommentDto)).rejects.toThrow(
        new NotFoundException('Post not found')
      );
    });

    it('should throw BadRequestException when case invalid cursor params ', async () => {
      const listCommentDto = {
        postId: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
        order: OrderEnum.DESC,
        before: '1',
      } as GetListCommentsDto;
      jest
        .spyOn(query, 'execute')
        .mockImplementation(() => Promise.reject(new InvalidCursorParamsException()));

      await expect(commentController.getList(userMock, listCommentDto)).rejects.toThrow(
        new BadRequestException('Invalid Cursor Params Exception')
      );
    });

    it('should throw error', async () => {
      const listCommentDto = {
        postId: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
        order: OrderEnum.DESC,
        before: '1',
      } as GetListCommentsDto;
      jest.spyOn(query, 'execute').mockImplementation(() => Promise.reject(new Error()));

      await expect(commentController.getList(userMock, listCommentDto)).rejects.toThrow(
        new Error()
      );
    });
  });

  describe('getCommentsArroundId', () => {
    it('should get comments around a comment successfully', async () => {
      jest.spyOn(query, 'execute').mockImplementation(() =>
        Promise.resolve({
          list: [
            {
              ...commentMock,
              child: {
                list: [commentMock],
                meta: {},
              },
            },
          ],
          meta: {
            start_cursor: 'eyJjcmVhdGVkQXQiOiIyMDIyLTA5LTMwVDAzOjA3OjU3LjIxNloifQ==',
            end_cursor: 'eyJjcmVhdGVkQXQiOiIyMDIyLTA5LTMwVDAzOjA3OjU3LjIxNloifQ==',
            has_next_page: false,
            has_previous_page: false,
          },
        })
      );

      const res = await commentController.getCommentsArroundId(
        userMock,
        '7a821691-64cb-4846-9933-d31cbe5ce558',
        {
          limit: 10,
        }
      );
      expect(res).toEqual({
        list: [
          {
            ...commentMock,
            child: {
              list: [commentMock],
              meta: {},
            },
          },
        ],
        meta: {
          start_cursor: 'eyJjcmVhdGVkQXQiOiIyMDIyLTA5LTMwVDAzOjA3OjU3LjIxNloifQ==',
          end_cursor: 'eyJjcmVhdGVkQXQiOiIyMDIyLTA5LTMwVDAzOjA3OjU3LjIxNloifQ==',
          has_next_page: false,
          has_previous_page: false,
        },
      });
      expect(query.execute).toBeCalledWith({
        payload: {
          commentId: '7a821691-64cb-4846-9933-d31cbe5ce558',
          authUser: userMock,
          limit: 10,
        },
      });
    });

    it('should throw NotFoundException when comment not found', async () => {
      jest
        .spyOn(query, 'execute')
        .mockImplementation(() =>
          Promise.reject(new CommentNotFoundException('Comment Not Found Exception'))
        );

      await expect(
        commentController.getCommentsArroundId(userMock, '7a821691-64cb-4846-9933-d31cbe5ce558', {
          limit: 10,
        })
      ).rejects.toThrow(new NotFoundException('Comment Not Found Exception'));
    });

    it('should throw BadRequestException when domain model exception ', async () => {
      jest
        .spyOn(query, 'execute')
        .mockImplementation(() =>
          Promise.reject(new DomainModelException('Domain model exception'))
        );

      await expect(
        commentController.getCommentsArroundId(userMock, '7a821691-64cb-4846-9933-d31cbe5ce558', {
          limit: 10,
        })
      ).rejects.toThrow(new BadRequestException('Domain model exception'));
    });

    it('should throw error', async () => {
      jest.spyOn(query, 'execute').mockImplementation(() => Promise.reject(new Error()));

      await expect(
        commentController.getCommentsArroundId(userMock, '7a821691-64cb-4846-9933-d31cbe5ce558', {
          limit: 10,
        })
      ).rejects.toThrow(new Error());
    });
  });

  describe('create', () => {
    it('should create a comment successfully', async () => {
      const createCommentDto = {
        postId: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
        content: 'sample content',
        media: {
          images: [
            {
              id: 'b114b2dd-39b4-43ae-8643-c9e3228feeb1',
            },
          ],
          files: [
            {
              id: 'b114b2dd-39b4-43ae-8643-c9e3228feeb2',
            },
          ],
          videos: [
            {
              id: 'b114b2dd-39b4-43ae-8643-c9e3228feeb3',
            },
          ],
        },
      };
      jest.spyOn(command, 'execute').mockImplementation(() => Promise.resolve(commentMock));

      const res = await commentController.create(userMock, createCommentDto);
      expect(res).toEqual(commentMock);
      expect(command.execute).toBeCalledWith({
        payload: {
          postId: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
          content: 'sample content',
          actor: userMock,
          media: {
            images: ['b114b2dd-39b4-43ae-8643-c9e3228feeb1'],
            files: ['b114b2dd-39b4-43ae-8643-c9e3228feeb2'],
            videos: ['b114b2dd-39b4-43ae-8643-c9e3228feeb3'],
          },
        },
      });
    });

    it('should throw NotFoundException when post not found', async () => {
      const createCommentDto = {
        postId: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
        content: '1',
      };
      jest
        .spyOn(command, 'execute')
        .mockImplementation(() => Promise.reject(new ContentNotFoundException('Post not found')));

      await expect(commentController.create(userMock, createCommentDto)).rejects.toThrow(
        new NotFoundException('Post not found')
      );
    });

    it('should throw BadRequestException when domain model exception ', async () => {
      const createCommentDto = {
        postId: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
        content: '1',
      };
      jest
        .spyOn(command, 'execute')
        .mockImplementation(() =>
          Promise.reject(new DomainModelException('Domain model exception'))
        );

      await expect(commentController.create(userMock, createCommentDto)).rejects.toThrow(
        new BadRequestException('Domain model exception')
      );
    });

    it('should throw ForbiddenException when user is not allowed to comment', async () => {
      const createCommentDto = {
        postId: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
        content: '1',
      };
      jest
        .spyOn(command, 'execute')
        .mockImplementation(() =>
          Promise.reject(
            new ContentNoCommentPermissionException('Content No Comment Permission Exception')
          )
        );

      await expect(commentController.create(userMock, createCommentDto)).rejects.toThrow(
        new ForbiddenException('Content No Comment Permission Exception')
      );
    });

    it('should throw error', async () => {
      const createCommentDto = {
        postId: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
        content: '1',
      };
      jest.spyOn(command, 'execute').mockImplementation(() => Promise.reject(new Error('Error')));

      await expect(commentController.create(userMock, createCommentDto)).rejects.toThrow(
        new Error('Error')
      );
    });
  });
  describe('reply', () => {
    it('should reply a comment successfully', async () => {
      const replyCommentDto = {
        postId: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
        content: '1',
        media: {
          images: [
            {
              id: 'b114b2dd-39b4-43ae-8643-c9e3228feeb1',
            },
          ],
          files: [
            {
              id: 'b114b2dd-39b4-43ae-8643-c9e3228feeb2',
            },
          ],
          videos: [
            {
              id: 'b114b2dd-39b4-43ae-8643-c9e3228feeb3',
            },
          ],
        },
      };
      jest.spyOn(command, 'execute').mockImplementation(() => Promise.resolve(commentMock));

      const res = await commentController.reply(
        userMock,
        '7a821691-64cb-4846-9933-d31cbe5ce558',
        replyCommentDto
      );
      expect(res).toEqual(commentMock);
      expect(command.execute).toBeCalledWith({
        payload: {
          postId: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
          parentId: '7a821691-64cb-4846-9933-d31cbe5ce558',
          content: '1',
          actor: userMock,
          media: {
            images: ['b114b2dd-39b4-43ae-8643-c9e3228feeb1'],
            files: ['b114b2dd-39b4-43ae-8643-c9e3228feeb2'],
            videos: ['b114b2dd-39b4-43ae-8643-c9e3228feeb3'],
          },
        },
      });
    });
    it('should throw NotFoundException when comment not found', async () => {
      const replyCommentDto = {
        postId: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
        content: '1',
      };
      jest
        .spyOn(command, 'execute')
        .mockImplementation(() =>
          Promise.reject(new CommentReplyNotExistException('Comment Reply Not Exist Exception'))
        );

      await expect(
        commentController.reply(userMock, '7a821691-64cb-4846-9933-d31cbe5ce558', replyCommentDto)
      ).rejects.toThrow(new NotFoundException('Comment Reply Not Exist Exception'));
    });

    it('should throw BadRequestException when domain model exception ', async () => {
      const replyCommentDto = {
        postId: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
        content: '1',
      };
      jest
        .spyOn(command, 'execute')
        .mockImplementation(() =>
          Promise.reject(new DomainModelException('Domain model exception'))
        );

      await expect(
        commentController.reply(userMock, '7a821691-64cb-4846-9933-d31cbe5ce558', replyCommentDto)
      ).rejects.toThrow(new BadRequestException('Domain model exception'));
    });

    it('should throw ForbiddenException when user is not allowed to comment', async () => {
      const replyCommentDto = {
        postId: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
        content: '1',
      };
      jest
        .spyOn(command, 'execute')
        .mockImplementation(() =>
          Promise.reject(
            new ContentNoCommentPermissionException('Content No Comment Permission Exception')
          )
        );

      await expect(
        commentController.reply(userMock, '7a821691-64cb-4846-9933-d31cbe5ce558', replyCommentDto)
      ).rejects.toThrow(new ForbiddenException('Content No Comment Permission Exception'));
    });

    it('should throw error', async () => {
      const replyCommentDto = {
        postId: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
        content: '1',
      };
      jest.spyOn(command, 'execute').mockImplementation(() => Promise.reject(new Error('error')));

      await expect(
        commentController.reply(userMock, '7a821691-64cb-4846-9933-d31cbe5ce558', replyCommentDto)
      ).rejects.toThrow(new Error('error'));
    });
  });
  describe('update', () => {
    it('should update a comment successfully', async () => {
      const updateCommentDto = {
        content: '1',
        media: {
          images: [
            {
              id: 'b114b2dd-39b4-43ae-8643-c9e3228feeb1',
            },
          ],
          files: [
            {
              id: 'b114b2dd-39b4-43ae-8643-c9e3228feeb2',
            },
          ],
          videos: [
            {
              id: 'b114b2dd-39b4-43ae-8643-c9e3228feeb3',
            },
          ],
        },
      };
      jest.spyOn(command, 'execute').mockImplementation(() => Promise.resolve(commentMock));

      await commentController.update(
        userMock,
        '7a821691-64cb-4846-9933-d31cbe5ce558',
        updateCommentDto
      );
      expect(command.execute).toBeCalledWith({
        payload: {
          id: '7a821691-64cb-4846-9933-d31cbe5ce558',
          content: '1',
          actor: userMock,
          media: {
            images: ['b114b2dd-39b4-43ae-8643-c9e3228feeb1'],
            files: ['b114b2dd-39b4-43ae-8643-c9e3228feeb2'],
            videos: ['b114b2dd-39b4-43ae-8643-c9e3228feeb3'],
          },
        },
      });
    });

    it('should throw NotFoundException when comment not found', async () => {
      const updateCommentDto = {
        content: '1',
      };
      jest
        .spyOn(command, 'execute')
        .mockImplementation(() =>
          Promise.reject(new CommentNotFoundException('Comment Not Found Exception'))
        );

      await expect(
        commentController.update(userMock, '7a821691-64cb-4846-9933-d31cbe5ce558', updateCommentDto)
      ).rejects.toThrow(new NotFoundException('Comment Not Found Exception'));
    });

    it('should throw BadRequestException when domain model exception ', async () => {
      const updateCommentDto = {
        content: '1',
      };
      jest
        .spyOn(command, 'execute')
        .mockImplementation(() =>
          Promise.reject(new DomainModelException('Domain model exception'))
        );

      await expect(
        commentController.update(userMock, '7a821691-64cb-4846-9933-d31cbe5ce558', updateCommentDto)
      ).rejects.toThrow(new BadRequestException('Domain model exception'));
    });

    it('should throw ForbiddenException when user is not allowed to comment', async () => {
      const updateCommentDto = {
        content: '1',
      };
      jest
        .spyOn(command, 'execute')
        .mockImplementation(() =>
          Promise.reject(
            new ContentNoCommentPermissionException('Content No Comment Permission Exception')
          )
        );

      await expect(
        commentController.update(userMock, '7a821691-64cb-4846-9933-d31cbe5ce558', updateCommentDto)
      ).rejects.toThrow(new ForbiddenException('Content No Comment Permission Exception'));
    });

    it('should throw Error', async () => {
      const updateCommentDto = {
        content: '1',
      };
      jest
        .spyOn(command, 'execute')
        .mockImplementation(() =>
          Promise.reject(new Error('Content No Comment Permission Exception'))
        );

      await expect(
        commentController.update(userMock, '7a821691-64cb-4846-9933-d31cbe5ce558', updateCommentDto)
      ).rejects.toThrow(new Error('Content No Comment Permission Exception'));
    });
  });
  describe('destroy', () => {
    it('should destroy a comment successfully', async () => {
      jest.spyOn(command, 'execute').mockImplementation(() => Promise.resolve());

      await commentController.destroy(userMock, '7a821691-64cb-4846-9933-d31cbe5ce558');
      expect(command.execute).toBeCalledWith({
        payload: {
          id: '7a821691-64cb-4846-9933-d31cbe5ce558',
          actor: userMock,
        },
      });
    });

    it('should throw NotFoundException when comment not found', async () => {
      jest
        .spyOn(command, 'execute')
        .mockImplementation(() =>
          Promise.reject(new CommentNotFoundException('Comment Not Found Exception'))
        );

      await expect(
        commentController.destroy(userMock, '7a821691-64cb-4846-9933-d31cbe5ce558')
      ).rejects.toThrow(new NotFoundException('Comment Not Found Exception'));
    });

    it('should throw BadRequestException when domain model exception ', async () => {
      jest
        .spyOn(command, 'execute')
        .mockImplementation(() =>
          Promise.reject(new DomainModelException('Domain model exception'))
        );

      await expect(
        commentController.destroy(userMock, '7a821691-64cb-4846-9933-d31cbe5ce558')
      ).rejects.toThrow(new BadRequestException('Domain model exception'));
    });

    it('should throw ForbiddenException when user is not allowed to comment', async () => {
      jest
        .spyOn(command, 'execute')
        .mockImplementation(() =>
          Promise.reject(
            new ContentNoCommentPermissionException('Content No Comment Permission Exception')
          )
        );

      await expect(
        commentController.destroy(userMock, '7a821691-64cb-4846-9933-d31cbe5ce558')
      ).rejects.toThrow(new ForbiddenException('Content No Comment Permission Exception'));
    });

    it('should throw error', async () => {
      jest.spyOn(command, 'execute').mockImplementation(() => Promise.reject(new Error()));

      await expect(
        commentController.destroy(userMock, '7a821691-64cb-4846-9933-d31cbe5ce558')
      ).rejects.toThrow(new Error());
    });
  });
});
