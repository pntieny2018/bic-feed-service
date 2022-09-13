import { RedisService } from '@app/redis';
import { ConfigModule } from '@nestjs/config';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { ReactionService } from '..';
import { SentryService } from '@app/sentry';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { HTTP_STATUS_ID } from '../../../common/constants';
import { LogicException } from '../../../common/exceptions';
import { CommentReactionModel } from '../../../database/models/comment-reaction.model';
import { CommentModel } from '../../../database/models/comment.model';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { PostReactionModel } from '../../../database/models/post-reaction.model';
import { PostModel } from '../../../database/models/post.model';
import { NotificationService } from '../../../notification';
import { ReactionActivityService } from '../../../notification/activities';
import { GroupService } from '../../../shared/group';
import { ReactionCountService } from '../../../shared/reaction-count';
import { UserService } from '../../../shared/user';
import { CommentService } from '../../comment';
import { FollowService } from '../../follow';
import { PostPolicyService } from '../../post/post-policy.service';
import { PostService } from '../../post/post.service';
import { ReactionEnum } from '../reaction.enum';
import {
  mockCommentReactionModel,
  mockCommentReactionModels,
  mockCommentResponseDto,
  mockCreateCommentReactionProcedureReturn,
  mockCreatePostReactionProcedureReturn,
  mockCreateReactionDto,
  mockDeleteReactionDto,
  mockGetReactionDto,
  mockICommentReaction,
  mockIPostReaction,
  mockPostReactionModel,
  mockPostReactionModels,
  mockPostResponseDto,
  mockReactionResponseDto,
  mockReactionResponseDtos,
  mockReactionsResponseDto,
  mockUserDto,
} from './mocks/input.mock';
import { ExternalService } from '../../../app/external.service';

const SERIALIZE_TRANSACTION_MAX_ATTEMPT = 3;

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
  let postService: PostService;
  let sequelizeConnection: Sequelize;
  let followService: FollowService;
  let reactionNotificationService: ReactionActivityService;
  let sentryService: SentryService;
  let commentService: CommentService;
  let postPolicyService: PostPolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        UserService,
        GroupService,
        ReactionService,
        {
          provide: FollowService,
          useClass: jest.fn(),
        },
        {
          provide: ExternalService,
          useClass: jest.fn(),
        },
        ReactionActivityService,
        {
          provide: SentryService,
          useClass: jest.fn(),
        },
        {
          provide: PostService,
          useClass: jest.fn(),
        },
        {
          provide: CommentService,
          useClass: jest.fn(),
        },
        {
          provide: PostPolicyService,
          useClass: jest.fn(),
        },
        {
          provide: ReactionCountService,
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
    postService = module.get<PostService>(PostService);
    sequelizeConnection = module.get<Sequelize>(Sequelize);
    followService = module.get<FollowService>(FollowService);
    reactionNotificationService = module.get<ReactionActivityService>(ReactionActivityService);
    sentryService = module.get<SentryService>(SentryService);
    commentService = module.get<CommentService>(CommentService);
    postPolicyService = module.get<PostPolicyService>(PostPolicyService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Create post reaction', () => {
    describe('Happy case', () => {
      it('Should successfully', async () => {
        postService.getPost = jest.fn().mockResolvedValue(mockPostResponseDto);

        postPolicyService.allow = jest.fn();

        sequelizeConnection.transaction = jest
          .fn()
          .mockResolvedValue(mockCreatePostReactionProcedureReturn);

        postReactionModel.findByPk = jest.fn().mockResolvedValue(mockPostReactionModel);

        followService.getValidUserIds = jest.fn().mockResolvedValue([1, 2, 3, 4, 5]);

        reactionNotificationService.createPayload = jest.fn();

        notificationService.publishReactionNotification = jest.fn();

        sentryService.captureException = jest.fn();

        const response = await reactionService.create(
          mockUserDto,
          mockCreateReactionDto.post
        );

        expect(JSON.stringify(response)).toEqual(JSON.stringify(mockReactionResponseDto.post));
        expect(postService.getPost).toBeCalledTimes(1);
        expect(sequelizeConnection.transaction).toBeCalledTimes(1);
        expect(postReactionModel.findByPk).toBeCalledTimes(1);
        expect(followService.getValidUserIds).toBeCalledTimes(1);
        expect(reactionNotificationService.createPayload).toBeCalledTimes(1);
        expect(notificationService.publishReactionNotification).toBeCalledTimes(1);
        expect(sentryService.captureException).toBeCalledTimes(0);
      });
    });

    describe("Reaction is existed | Post isn't allow to react | Post is draft", () => {
      it('Should failed', async () => {
        postService.getPost = jest.fn().mockResolvedValue(mockPostResponseDto);

        postPolicyService.allow = jest.fn();

        sequelizeConnection.transaction = jest
          .fn()
          .mockRejectedValue(new Error('Error in database layer'));

        sentryService.captureException = jest.fn();

        try {
          await reactionService.create(mockUserDto, mockCreateReactionDto.post);
        } catch (e) {
          expect(e.message).toEqual('Error in database layer');
        }

        expect(postService.getPost).toBeCalledTimes(1);
        expect(postPolicyService.allow).toBeCalledTimes(1);
        expect(sequelizeConnection.transaction).toBeCalledTimes(1);
      });
    });

    describe('User is not in the any groups of post', () => {
      it('Should failed', async () => {
        postService.getPost = jest
          .fn()
          .mockRejectedValue(new LogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING));

        try {
          await reactionService.create(mockUserDto, mockCreateReactionDto.post);
        } catch (e) {
          expect(e.message).toEqual(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
        }

        expect(postService.getPost).toBeCalledTimes(1);
      });
    });

    describe('Exceed max attempt to create reaction', () => {
      it('Should failed', async () => {
        try {
          await reactionService['_createPostReaction'](
            mockUserDto,
            mockCreateReactionDto.post,
            SERIALIZE_TRANSACTION_MAX_ATTEMPT
          );
        } catch (e) {
          expect(e.message).toEqual(HTTP_STATUS_ID.API_SERVER_INTERNAL_ERROR);
        }
      });
    });

    describe('Reaction type is not match', () => {
      it('Should failed', async () => {
        try {
          await reactionService.create(mockUserDto, {
            ...mockCreateReactionDto.post,
            target: 'POSTT' as ReactionEnum,
          });
        } catch (e) {
          expect(e.message).toEqual(HTTP_STATUS_ID.APP_REACTION_TARGET_EXISTING);
        }
      });
    });
  });

  describe('Create comment reaction', () => {
    describe('Happy case', () => {
      it('Should successfully', async () => {
        commentService.findComment = jest.fn().mockResolvedValue(mockCommentResponseDto);

        postService.getPost = jest.fn().mockResolvedValue(mockPostResponseDto);

        postPolicyService.allow = jest.fn();

        sequelizeConnection.transaction = jest
          .fn()
          .mockResolvedValue(mockCreateCommentReactionProcedureReturn);

        commentReactionModel.findByPk = jest.fn().mockResolvedValue(mockCommentReactionModel);

        followService.getValidUserIds = jest.fn().mockResolvedValue([1, 2, 3, 4, 5]);

        reactionNotificationService.createPayload = jest.fn();

        notificationService.publishReactionNotification = jest.fn();

        sentryService.captureException = jest.fn();

        const response = await reactionService.create(
          mockUserDto,
          mockCreateReactionDto.comment
        );

        expect(JSON.stringify(response)).toEqual(JSON.stringify(mockReactionResponseDto.comment));
        expect(commentService.findComment).toBeCalledTimes(1);
        expect(postService.getPost).toBeCalledTimes(1);
        expect(sequelizeConnection.transaction).toBeCalledTimes(1);
        expect(commentReactionModel.findByPk).toBeCalledTimes(1);
        expect(followService.getValidUserIds).toBeCalledTimes(1);
        expect(reactionNotificationService.createPayload).toBeCalledTimes(1);
        expect(notificationService.publishReactionNotification).toBeCalledTimes(1);
        expect(sentryService.captureException).toBeCalledTimes(0);
      });
    });

    describe('Reaction is existed', () => {
      it('Should failed', async () => {
        commentService.findComment = jest.fn().mockResolvedValue(mockCommentResponseDto);

        postService.getPost = jest.fn().mockResolvedValue(mockPostResponseDto);

        postPolicyService.allow = jest.fn();

        sequelizeConnection.transaction = jest
          .fn()
          .mockRejectedValue(new Error('Error in database layer'));

        try {
          await reactionService.create(mockUserDto, mockCreateReactionDto.comment);
        } catch (e) {
          expect(e.message).toEqual('Error in database layer');
        }

        expect(commentService.findComment).toBeCalledTimes(1);
        expect(postService.getPost).toBeCalledTimes(1);
        expect(postPolicyService.allow).toBeCalledTimes(1);
        expect(sequelizeConnection.transaction).toBeCalledTimes(1);
      });
    });

    describe('Comment is not existed', () => {
      it('Should failed', async () => {
        commentService.findComment = jest.fn().mockResolvedValue(null);

        try {
          await reactionService.create(mockUserDto, mockCreateReactionDto.comment);
        } catch (e) {
          expect(e.message).toEqual(HTTP_STATUS_ID.APP_COMMENT_NOT_EXISTING);
        }

        expect(commentService.findComment).toBeCalledTimes(1);
      });
    });

    describe("User is not in the any groups of comment's post", () => {
      it('Should failed', async () => {
        commentService.findComment = jest.fn().mockResolvedValue(mockCommentResponseDto);

        postService.getPost = jest.fn().mockResolvedValue(null);

        try {
          await reactionService.create(mockUserDto, mockCreateReactionDto.comment);
        } catch (e) {
          expect(e.message).toEqual(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
        }

        expect(commentService.findComment).toBeCalledTimes(1);
        expect(postService.getPost).toBeCalledTimes(1);
      });
    });

    describe('Exceed max attempt to create reaction', () => {
      it('Should failed', async () => {
        try {
          await reactionService['_createCommentReaction'](
            mockUserDto,
            mockCreateReactionDto.comment,
            SERIALIZE_TRANSACTION_MAX_ATTEMPT
          );
        } catch (e) {
          expect(e.message).toEqual(HTTP_STATUS_ID.API_SERVER_INTERNAL_ERROR);
        }
      });
    });
  });

  describe('Delete post reaction', () => {
    describe('Happy case', () => {
      it('Should successfully', async () => {
        postService.getPost = jest.fn().mockResolvedValue(mockPostResponseDto);

        postPolicyService.allow = jest.fn();

        postReactionModel.findOne = jest.fn().mockResolvedValue(mockPostReactionModel);

        reactionNotificationService.createPayload = jest.fn();

        notificationService.publishReactionNotification = jest.fn();

        const response = await reactionService.delete(
          mockUserDto,
          mockDeleteReactionDto.post
        );

        expect(response).toEqual(mockIPostReaction);
        expect(postService.getPost).toBeCalledTimes(1);
        expect(postPolicyService.allow).toBeCalledTimes(1);
        expect(postReactionModel.findOne).toBeCalledTimes(1);
        expect(reactionNotificationService.createPayload).toBeCalledTimes(1);
        expect(notificationService.publishReactionNotification).toBeCalledTimes(1);
      });
    });

    describe("User isn't in the any groups of post", () => {
      it('Should failed', async () => {
        postService.getPost = jest
          .fn()
          .mockRejectedValue(new LogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING));

        try {
          await reactionService.delete(mockUserDto, mockDeleteReactionDto.post);
        } catch (e) {
          expect(e.message).toEqual(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
        }

        expect(postService.getPost).toBeCalledTimes(1);
      });
    });

    describe("Post isn't not allow to react", () => {
      it('Should failed', async () => {
        postService.getPost = jest.fn().mockResolvedValue(mockPostResponseDto);

        postPolicyService.allow = jest
          .fn()
          .mockRejectedValue(new LogicException(HTTP_STATUS_ID.APP_POST_SETTING_DISABLE));

        try {
          await reactionService.delete(mockUserDto, mockDeleteReactionDto.post);
        } catch (e) {
          expect(e.message).toEqual(HTTP_STATUS_ID.APP_POST_SETTING_DISABLE);
        }

        expect(postService.getPost).toBeCalledTimes(1);
        expect(postPolicyService.allow).toBeCalledTimes(1);
      });
    });

    describe('Reaction is not existed', () => {
      it('Should failed', async () => {
        postService.getPost = jest.fn().mockResolvedValue(mockPostResponseDto);

        postPolicyService.allow = jest.fn();

        postReactionModel.findOne = jest.fn().mockResolvedValue(null);

        try {
          await reactionService.delete(mockUserDto, mockDeleteReactionDto.post);
        } catch (e) {
          expect(e.message).toEqual(HTTP_STATUS_ID.APP_REACTION_NOT_EXISTING);
        }

        expect(postService.getPost).toBeCalledTimes(1);
        expect(postPolicyService.allow).toBeCalledTimes(1);
        expect(postReactionModel.findOne).toBeCalledTimes(1);
      });
    });

    describe('Reaction type is not match', () => {
      it('Should failed', async () => {
        try {
          await reactionService.delete(mockUserDto, {
            ...mockCreateReactionDto.post,
            target: 'POSTT' as ReactionEnum,
          });
        } catch (e) {
          expect(e.message).toEqual('Reaction type not match.');
        }
      });
    });

    describe('Exceed max attempt to delete reaction', () => {
      it('Should failed', async () => {
        try {
          await reactionService['_deletePostReaction'](
            mockUserDto,
            mockDeleteReactionDto.post,
            SERIALIZE_TRANSACTION_MAX_ATTEMPT
          );
        } catch (e) {
          expect(e.message).toEqual(HTTP_STATUS_ID.API_SERVER_INTERNAL_ERROR);
        }
      });
    });
  });

  describe('Delete comment reaction', () => {
    describe('Happy case', () => {
      it('Should successfully', async () => {
        commentService.findComment = jest.fn().mockResolvedValue(mockCommentResponseDto);

        postService.getPost = jest.fn().mockResolvedValue(mockPostResponseDto);

        postPolicyService.allow = jest.fn();

        commentReactionModel.findOne = jest.fn().mockResolvedValue(mockCommentReactionModel);

        reactionNotificationService.createPayload = jest.fn();

        notificationService.publishReactionNotification = jest.fn();

        const response = await reactionService.delete(
          mockUserDto,
          mockDeleteReactionDto.comment
        );

        expect(response).toEqual(mockICommentReaction);
        expect(commentService.findComment).toBeCalledTimes(1);
        expect(postService.getPost).toBeCalledTimes(1);
        expect(commentReactionModel.findOne).toBeCalledTimes(1);
        expect(reactionNotificationService.createPayload).toBeCalledTimes(1);
        expect(notificationService.publishReactionNotification).toBeCalledTimes(1);
      });
    });

    describe("User isn't in the any groups of comment's post", () => {
      it('Should failed', async () => {
        commentService.findComment = jest.fn().mockResolvedValue(mockCommentResponseDto);

        postService.getPost = jest.fn().mockResolvedValue(null);

        try {
          await reactionService.delete(mockUserDto, mockDeleteReactionDto.comment);
        } catch (e) {
          expect(e.message).toEqual(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
        }

        expect(commentService.findComment).toBeCalledTimes(1);
        expect(postService.getPost).toBeCalledTimes(1);
      });
    });

    describe('Comment is not existed', () => {
      it('Should failed', async () => {
        commentService.findComment = jest.fn().mockResolvedValue(null);

        try {
          await reactionService.delete(mockUserDto, mockDeleteReactionDto.comment);
        } catch (e) {
          expect(e.message).toEqual(HTTP_STATUS_ID.APP_COMMENT_NOT_EXISTING);
        }

        expect(commentService.findComment).toBeCalledTimes(1);
      });
    });

    describe('Reaction is not existed', () => {
      it('Should failed', async () => {
        commentService.findComment = jest.fn().mockResolvedValue(mockCommentResponseDto);

        postService.getPost = jest.fn().mockResolvedValue(mockPostResponseDto);

        postPolicyService.allow = jest.fn();

        commentReactionModel.findOne = jest.fn().mockResolvedValue(null);

        try {
          await reactionService.delete(mockUserDto, mockDeleteReactionDto.comment);
        } catch (e) {
          expect(e.message).toEqual(HTTP_STATUS_ID.APP_REACTION_NOT_EXISTING);
        }

        expect(commentService.findComment).toBeCalledTimes(1);
        expect(postService.getPost).toBeCalledTimes(1);
        expect(postPolicyService.allow).toBeCalledTimes(1);
        expect(commentReactionModel.findOne).toBeCalledTimes(1);
      });
    });

    describe('Exceed max attempt to delete reaction', () => {
      it('Should failed', async () => {
        try {
          await reactionService['_deleteCommentReaction'](
            mockUserDto,
            mockDeleteReactionDto.comment,
            SERIALIZE_TRANSACTION_MAX_ATTEMPT
          );
        } catch (e) {
          expect(e.message).toEqual(HTTP_STATUS_ID.API_SERVER_INTERNAL_ERROR);
        }
      });
    });
  });

  describe('Get reaction', () => {
    describe('Get post reaction', () => {
      it('Should successfully', async () => {
        postReactionModel.findAll = jest.fn().mockResolvedValue(mockPostReactionModels);

        reactionService['_bindActorToReaction'] = jest
          .fn()
          .mockResolvedValue(mockReactionResponseDtos.post);

        const rsp = await reactionService.gets(mockGetReactionDto.post);

        expect(rsp).toEqual(mockReactionsResponseDto.post);
        expect(postReactionModel.findAll).toBeCalledTimes(1);
        expect(reactionService['_bindActorToReaction']).toBeCalledTimes(1);
      });
    });

    describe('Get comment reaction', () => {
      it('Should successfully', async () => {
        commentReactionModel.findAll = jest.fn().mockResolvedValue(mockCommentReactionModels);

        reactionService['_bindActorToReaction'] = jest
          .fn()
          .mockResolvedValue(mockReactionResponseDtos.comment);

        const rsp = await reactionService.gets(mockGetReactionDto.comment);

        expect(rsp).toEqual(mockReactionsResponseDto.comment);
        expect(commentReactionModel.findAll).toBeCalledTimes(1);
        expect(reactionService['_bindActorToReaction']).toBeCalledTimes(1);
      });
    });
  });

  describe('Utility function', () => {
    describe('Function: deleteReactionByPostIds', () => {
      it('Should successfully', async () => {
        postReactionModel.destroy = jest.fn().mockResolvedValue(3);
        const result = await reactionService.deleteByPostIds([
          'b0f2f8fc-2a13-4408-9a7a-564e15e9a895',
          '6039c8c3-0511-465a-b9a9-a2666c98f946',
          'edc7ec02-fc29-4e48-96e8-f93d2c593054',
        ]);
        expect(result).toEqual(3);
      });
    });

    describe('Function: deleteReactionByCommentIds', () => {
      it('Should successfully', async () => {
        commentReactionModel.destroy = jest.fn().mockResolvedValue(3);
        const result = await reactionService.deleteByCommentIds(
          [
            '158c94a0-3e89-4b2b-9731-f7a5ad313dc7',
            '70fd7a3f-d200-45b0-8f43-637bd5823055',
            'd16e555e-006f-4e63-bce7-56760f315a6e',
          ],
          null
        );
        expect(result).toEqual(3);
      });
    });

    describe('Function: bindReactionToPosts', () => {
      it('Should successfully', async () => {
        sequelizeConnection.query = jest.fn().mockResolvedValue([]);

        await reactionService.bindToPosts([mockPostResponseDto]);

        expect(sequelizeConnection.query).toBeCalledTimes(1);
      });
    });

    describe('Function: bindReactionToComments', () => {
      it('Should successfully', async () => {
        sequelizeConnection.query = jest.fn().mockResolvedValue([]);

        await reactionService.bindToComments([mockCommentResponseDto]);

        expect(sequelizeConnection.query).toBeCalledTimes(1);
      });
    });
  });
});
