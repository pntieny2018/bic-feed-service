import { RedisService } from '@app/redis';
import { ConfigModule } from '@nestjs/config';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { CommentReactionModel } from '../../../database/models/comment-reaction.model';
import { CommentModel } from '../../../database/models/comment.model';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { PostReactionModel } from '../../../database/models/post-reaction.model';
import { PostModel } from '../../../database/models/post.model';
import { NotificationService } from '../../../notification';
import { GroupService } from '../../../shared/group';
import { UserService } from '../../../shared/user';
import { mockUserDto } from '../../post/test/mocks/input.mock';
import { ReactionController } from '../reaction.controller';
import { ReactionService } from '../reaction.service';
import {
  mockCreateReactionDto,
  mockGetReactionDto,
  mockReactionResponseDto,
  mockReactionsResponseDto,
} from './mocks/input.mock';
import { ExternalService } from '../../../app/external.service';

describe('ReactionController', () => {
  let reactionController: ReactionController;
  let reactionService: ReactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      controllers: [ReactionController],
      providers: [
        UserService,
        GroupService,
        {
          provide: ReactionService,
          useClass: jest.fn(),
        },
        {
          provide: ExternalService,
          useClass: jest.fn(),
        },
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

    reactionController = module.get<ReactionController>(ReactionController);
    reactionService = module.get<ReactionService>(ReactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Create reaction', () => {
    describe('Create post reaction', () => {
      it('Create post reaction successfully', async () => {
        reactionService.create = jest.fn().mockResolvedValue(mockReactionResponseDto.post);
        const rsp = await reactionController.create(mockUserDto, mockCreateReactionDto.post);
        expect(rsp).toEqual(mockReactionResponseDto.post);
      });
    });
  });

  describe('Create comment reaction', () => {
    it('Create comment reaction successfully', async () => {
      reactionService.create = jest.fn().mockResolvedValue(mockReactionResponseDto.comment);
      const rsp = await reactionController.create(mockUserDto, mockCreateReactionDto.comment);
      expect(rsp).toEqual(mockReactionResponseDto.comment);
    });
  });

  describe('Delete reaction', () => {
    it('Delete post reaction successfully', async () => {
      reactionService.delete = jest.fn().mockResolvedValue(mockReactionResponseDto.post);
      const rsp = await reactionController.delete(mockUserDto, mockCreateReactionDto.post);
      expect(rsp).toEqual(mockReactionResponseDto.post);
    });
  });

  describe('Get reaction', () => {
    it('Should successfully', async () => {
      reactionService.gets = jest.fn().mockResolvedValue(mockReactionsResponseDto);
      const rsp = await reactionController.gets(mockUserDto, mockGetReactionDto.post);
      expect(rsp).toEqual(mockReactionsResponseDto);
    });
  });
});
