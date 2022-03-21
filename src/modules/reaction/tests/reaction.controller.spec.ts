import { RedisService } from '@app/redis';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateReactionService } from '../services';
import { mockCreateReactionDto, mockUserDto } from './mocks/input.mock';
import { ReactionController } from '../reaction.controller';
import { REACTION_SERVICE } from '../reaction.constant';
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
import { CommonReactionService } from '../services/common-reaction.service';

describe('ReactionService', () => {
  let createReactionService: CreateReactionService;
  let reactionController: ReactionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReactionController],
      providers: [
        UserService,
        GroupService,
        CommonReactionService,
        CreateReactionService,
        CommonReactionService,
        {
          provide: REACTION_SERVICE,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useClass: jest.fn(),
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
          userId: mockUserDto.userId,
        });
        const createReactionServiceCreatePostSpy = jest
          .spyOn(createReactionService, 'createReaction')
          .mockResolvedValue(response);
        expect(await reactionController.create(mockUserDto, input)).toEqual(true);
        expect(createReactionServiceCreatePostSpy).toBeCalledTimes(1);
      });

      it('Create post reaction failed', async () => {
        const input = mockCreateReactionDto[0];
        const createReactionServiceCreatePostSpy = jest
          .spyOn(createReactionService, 'createReaction')
          .mockRejectedValue(
            new HttpException('Can not create reaction.', HttpStatus.INTERNAL_SERVER_ERROR)
          );
        try {
          await reactionController.create(mockUserDto, input);
        } catch (e) {
          expect(e.message).toEqual('Can not create reaction.');
        }
        expect(createReactionServiceCreatePostSpy).toBeCalledTimes(1);
      });
    });

    describe('Create comment reaction', () => {
      it('Create comment reaction successfully', async () => {
        const input = mockCreateReactionDto[1];
        const response = createMock<ReactionDto>({
          ...input,
          userId: mockUserDto.userId,
        });
        const createReactionServiceCreatePostSpy = jest
          .spyOn(createReactionService, 'createReaction')
          .mockResolvedValue(response);
        expect(await reactionController.create(mockUserDto, input)).toEqual(true);
        expect(createReactionServiceCreatePostSpy).toBeCalledTimes(1);
      });

      it('Create comment reaction failed', async () => {
        const input = mockCreateReactionDto[1];
        const createReactionServiceCreatePostSpy = jest
          .spyOn(createReactionService, 'createReaction')
          .mockRejectedValue(
            new HttpException('Can not create reaction.', HttpStatus.INTERNAL_SERVER_ERROR)
          );
        try {
          await reactionController.create(mockUserDto, input);
        } catch (e) {
          expect(e.message).toEqual('Can not create reaction.');
        }
        expect(createReactionServiceCreatePostSpy).toBeCalledTimes(1);
      });
    });
  });
});
