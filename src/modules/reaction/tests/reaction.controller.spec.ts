import { RedisService } from '@app/redis';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateOrDeleteReactionService,
  CreateReactionService,
  DeleteReactionService,
} from '../services';
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
import { ReactionResponseDto } from '../dto/response';
import { ActionReaction } from '../dto/request';
import { Sequelize } from 'sequelize-typescript';
import { NotificationService } from '../../../notification';
import { ConfigModule } from '@nestjs/config';

describe('ReactionController', () => {
  let createReactionService: CreateReactionService;
  let deleteReactionService: DeleteReactionService;
  let reactionController: ReactionController;
  let createOrDeleteReactionService: CreateOrDeleteReactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      controllers: [ReactionController],
      providers: [
        UserService,
        GroupService,
        CommonReactionService,
        CreateOrDeleteReactionService,
        CreateReactionService,
        DeleteReactionService,
        {
          provide: NotificationService,
          useClass: jest.fn(),
        },
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
        {
          provide: Sequelize,
          useValue: {
            query: jest.fn(),
            transaction: jest.fn(async () => ({
              commit: jest.fn(),
              rollback: jest.fn(),
            })),
          },
        },
      ],
    }).compile();

    createReactionService = module.get<CreateReactionService>(CreateReactionService);
    deleteReactionService = module.get<DeleteReactionService>(DeleteReactionService);
    reactionController = module.get<ReactionController>(ReactionController);
    createOrDeleteReactionService = module.get<CreateOrDeleteReactionService>(
      CreateOrDeleteReactionService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Create reaction', () => {
    describe('Create post reaction', () => {
      it('Create post reaction successfully', async () => {
        const input = mockCreateReactionDto[0];
        const response = {
          action: ActionReaction.ADD,
          reactionName: input.reactionName,
          target: input.target,
          targetId: input.targetId,
        };
        createOrDeleteReactionService.addToQueueReaction = jest.fn().mockResolvedValue(response);
        expect(await reactionController.create(mockUserDto, input)).toEqual(response);
        expect(createOrDeleteReactionService.addToQueueReaction).toBeCalledTimes(1);
      });
    });
  });

  describe('Create comment reaction', () => {
    it('Create comment reaction successfully', async () => {
      const input = mockCreateReactionDto[1];
      const response = {
        action: ActionReaction.ADD,
        reactionName: input.reactionName,
        target: input.target,
        targetId: input.targetId,
      };
      createOrDeleteReactionService.addToQueueReaction = jest.fn().mockResolvedValue(response);
      expect(await reactionController.create(mockUserDto, input)).toEqual(response);
      expect(createOrDeleteReactionService.addToQueueReaction).toBeCalledTimes(1);
    });
  });

  describe('Delete reaction', () => {
    it('Delete post reaction successfully', async () => {
      const input = mockCreateReactionDto[0];
      const response = {
        action: ActionReaction.REMOVE,
        reactionName: input.reactionName,
        target: input.target,
        targetId: input.targetId,
      };
      createOrDeleteReactionService.addToQueueReaction = jest.fn().mockResolvedValue(response);
      expect(await reactionController.delete(mockUserDto, input)).toEqual(response);
      expect(createOrDeleteReactionService.addToQueueReaction).toBeCalledTimes(1);
    });

    it('Delete post reaction failed because of non-existed reaction', async () => {
      const input = mockCreateReactionDto[1];
      const response = {
        action: ActionReaction.REMOVE,
        reactionName: input.reactionName,
        target: input.target,
        targetId: input.targetId,
      };
      createOrDeleteReactionService.addToQueueReaction = jest.fn().mockResolvedValue(response);
      expect(await reactionController.delete(mockUserDto, input)).toEqual(response);
      expect(createOrDeleteReactionService.addToQueueReaction).toBeCalledTimes(1);
    });
  });
});
