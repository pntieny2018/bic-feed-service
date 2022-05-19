import { RedisService } from '@app/redis';
import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../../shared/user';
import {
  mock15ReactionOnAComment,
  mock15ReactionOnAPost,
  mock21ReactionOnAComment,
  mock21ReactionOnAPost,
  mockComment,
  mockCommentReactionModelFindOne,
  mockCommentSmileReaction,
  mockCreateReactionDto,
  mockDeleteReactionDto,
  mockGetReactionDto,
  mockPostCannotReact,
  mockPostCanReact,
  mockPostGroup,
  mockPostReactionModelFindOne,
  mockPostSmileReaction,
  mockReactionDto,
  mockUserDto,
  mockUserSharedDto,
  mockUserSharedDtoNotInTheGroup,
} from './mocks/input.mock';
import { PostModel } from '../../../database/models/post.model';
import { CommentReactionModel } from '../../../database/models/comment-reaction.model';
import { CommentModel } from '../../../database/models/comment.model';
import { UserSharedDto } from '../../../shared/user/dto';
import { GroupService } from '../../../shared/group';
import { PostReactionModel } from '../../../database/models/post-reaction.model';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { ReactionDto } from '../dto/reaction.dto';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { NotificationModule, NotificationService } from '../../../notification';
import { ReactionEnum } from '../reaction.enum';
import { Sequelize } from 'sequelize-typescript';
import { ConfigModule } from '@nestjs/config';
import { ReactionResponseDto } from '../dto/response';
import { LogicException } from '../../../common/exceptions';
import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ReactionService } from '..';
import { SentryService } from '../../../../libs/sentry/src';

describe('ReactionService', () => {
  let reactionService: ReactionService;
  let commentReactionModel: typeof CommentReactionModel;
  let postReactionModel: typeof PostReactionModel;
  let postModel: typeof PostModel;
  let commentModel: typeof CommentModel;
  let postGroupModel: typeof PostGroupModel;
  let userService: UserService;
  let groupService: GroupService;
  let notificationService: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        UserService,
        GroupService,
        ReactionService,
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
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
          provide: NotificationService,
          useValue: {
            publishReactionNotification: jest.fn(),
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

    reactionService = module.get<ReactionService>(ReactionService);
    commentReactionModel = module.get<typeof CommentReactionModel>(
      getModelToken(CommentReactionModel)
    );
    userService = module.get<UserService>(UserService);
    groupService = module.get<GroupService>(GroupService);
    commentReactionModel = module.get<typeof CommentReactionModel>(
      getModelToken(CommentReactionModel)
    );
    postReactionModel = module.get<typeof PostReactionModel>(getModelToken(PostReactionModel));
    postModel = module.get<typeof PostModel>(getModelToken(PostModel));
    commentModel = module.get<typeof CommentModel>(getModelToken(CommentModel));
    postGroupModel = module.get<typeof PostGroupModel>(getModelToken(PostGroupModel));
    notificationService = module.get<NotificationService>(NotificationService);
  });

  describe('Create post reaction', () => {
    it('Create post reaction successfully', async () => {
      
    })
  })
});
