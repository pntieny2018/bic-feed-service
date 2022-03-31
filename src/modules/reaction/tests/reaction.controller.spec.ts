import { RedisService } from '@app/redis';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateReactionService, DeleteReactionService } from '../services';
import { mockCreateReactionDto, mockDeleteReactionDto, mockUserDto } from './mocks/input.mock';
import { ReactionController } from '../reaction.controller';
import { CommentReactionModel } from '../../../database/models/comment-reaction.model';
import { PostReactionModel } from '../../../database/models/post-reaction.model';
import { PostModel } from '../../../database/models/post.model';
import { CommentModel } from '../../../database/models/comment.model';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { UserService } from '../../../shared/user';
import { GroupService } from '../../../shared/group';
import { HttpException, HttpStatus } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { ReactionDto } from '../dto/reaction.dto';
import { CommonReactionService } from '../services';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { mockUserSharedDto } from './mocks/input.mock';

describe('ReactionController', () => {
  let createReactionService: CreateReactionService;
  let deleteReactionService: DeleteReactionService;
  let reactionController: ReactionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReactionController],
      providers: [
        UserService,
        GroupService,
        CommonReactionService,
        CreateReactionService,
        DeleteReactionService,
        {
          provide: RedisService,
          useClass: jest.fn(),
        },
        {
          provide: InternalEventEmitterService,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostReactionModel),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: getModelToken(CommentReactionModel),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostModel),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostGroupModel),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: getModelToken(CommentModel),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
          },
        },
      ],
    }).compile();

    createReactionService = module.get<CreateReactionService>(CreateReactionService);
    deleteReactionService = module.get<DeleteReactionService>(DeleteReactionService);
    reactionController = module.get<ReactionController>(ReactionController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Create reaction', () => {
    describe('Create post reaction', () => {
      it('Create post reaction successfully', async () => {
        const input = mockCreateReactionDto[0];
        const response = createMock<ReactionDto>({
          ...input,
          userSharedDto: mockUserSharedDto,
        });
        const createReactionServiceCreateReactionSpy = jest
          .spyOn(createReactionService, 'createReaction')
          .mockResolvedValue(response);
        expect(await reactionController.create(mockUserDto, input)).toEqual(true);
        expect(createReactionServiceCreateReactionSpy).toBeCalledTimes(1);
      });

      it('Create post reaction failed', async () => {
        const input = mockCreateReactionDto[0];
        const createReactionServiceCreateReactionSpy = jest
          .spyOn(createReactionService, 'createReaction')
          .mockRejectedValue(
            new HttpException('Can not create reaction.', HttpStatus.INTERNAL_SERVER_ERROR)
          );
        try {
          await reactionController.create(mockUserDto, input);
        } catch (e) {
          expect(e.message).toEqual('Can not create reaction.');
        }
        expect(createReactionServiceCreateReactionSpy).toBeCalledTimes(1);
      });
    });

    describe('Create comment reaction', () => {
      it('Create comment reaction successfully', async () => {
        const input = mockCreateReactionDto[1];
        const response = createMock<ReactionDto>({
          ...input,
          userSharedDto: mockUserSharedDto,
        });
        const createReactionServiceCreateCommentSpy = jest
          .spyOn(createReactionService, 'createReaction')
          .mockResolvedValue(response);
        expect(await reactionController.create(mockUserDto, input)).toEqual(true);
        expect(createReactionServiceCreateCommentSpy).toBeCalledTimes(1);
      });

      it('Create comment reaction failed', async () => {
        const input = mockCreateReactionDto[1];
        const createReactionServiceCreateCommentSpy = jest
          .spyOn(createReactionService, 'createReaction')
          .mockRejectedValue(
            new HttpException('Can not create reaction.', HttpStatus.INTERNAL_SERVER_ERROR)
          );
        try {
          await reactionController.create(mockUserDto, input);
        } catch (e) {
          expect(e.message).toEqual('Can not create reaction.');
        }
        expect(createReactionServiceCreateCommentSpy).toBeCalledTimes(1);
      });
    });
  });

  describe('Delete reaction', () => {
    it('Delete post reaction successfully', async () => {
      const input = mockDeleteReactionDto[0];
      const deleteReactionServiceDeleteReactionSpy = jest
        .spyOn(deleteReactionService, 'deleteReaction')
        .mockResolvedValue(true);
      expect(await reactionController.delete(mockUserDto, input)).toEqual(true);
      expect(deleteReactionServiceDeleteReactionSpy).toBeCalledTimes(1);
    });

    it('Delete post reaction failed because of non-existed reaction', async () => {
      const input = mockDeleteReactionDto[0];
      const deleteReactionServiceDeleteReactionSpy = jest
        .spyOn(deleteReactionService, 'deleteReaction')
        .mockRejectedValue(
          new HttpException('Can not delete reaction.', HttpStatus.INTERNAL_SERVER_ERROR)
        );
      try {
        await reactionController.delete(mockUserDto, input);
      } catch (e) {
        expect(e.message).toEqual('Can not delete reaction.');
      }
      expect(deleteReactionServiceDeleteReactionSpy).toBeCalledTimes(1);
    });
  });
});
