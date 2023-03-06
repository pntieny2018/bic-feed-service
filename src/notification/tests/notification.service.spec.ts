import { ClientKafka } from '@nestjs/microservices';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { SentryService } from '@app/sentry';
import { KAFKA_PRODUCER } from '../../common/constants';
import { CommentModel, IComment } from '../../database/models/comment.model';
import { PostService } from '../../modules/post/post.service';
import {
  CommentActivityService,
  PostActivityService,
  ReactionActivityService,
} from '../activities';
import { CommentDissociationService } from '../dissociations';
import { NotificationActivity } from '../dto/requests/notification-activity.dto';
import { TypeActivity } from '../notification.constants';
import { NotificationService } from '../notification.service';
import { CommentNotificationService } from '../services';
import {
  mockNotificationPayloadDto,
  mockPostResponseDto,
  mockReactionResponseDto,
  mockCommentResponseDto,
  mockCommentResponseWithParentDto,
  mockUserDto,
  mockCommentModel,
  mockValidUserIds,
} from './mocks/input.mock';
import { CommentService } from '../../modules/comment';

describe.skip('NotificationService', () => {
  let notificationService: NotificationService;
  let postActivityService: PostActivityService;
  let reactionActivityService: ReactionActivityService;
  let commentActivityService: CommentActivityService;
  let commentDissociationService: CommentDissociationService;
  let commentNotificationService: CommentNotificationService;
  let sequelizeConnection: Sequelize;
  let kafkaProducer: ClientKafka;
  let commentModel: typeof CommentModel;
  let sentryService: SentryService;
  let postService: PostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        PostActivityService,
        ReactionActivityService,
        CommentActivityService,
        CommentDissociationService,
        CommentNotificationService,
        {
          provide: KAFKA_PRODUCER,
          useValue: {
            emit: jest.fn(),
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
      ],
    }).compile();

    notificationService = module.get<NotificationService>(NotificationService);
    postActivityService = module.get<PostActivityService>(PostActivityService);
    reactionActivityService = module.get<ReactionActivityService>(ReactionActivityService);
    commentActivityService = module.get<CommentActivityService>(CommentActivityService);
    commentDissociationService = module.get<CommentDissociationService>(CommentDissociationService);
    commentNotificationService = module.get<CommentNotificationService>(CommentNotificationService);
    sequelizeConnection = module.get<Sequelize>(Sequelize);
    kafkaProducer = module.get<ClientKafka>(KAFKA_PRODUCER);
    commentModel = module.get<typeof CommentModel>(getModelToken(CommentModel));
    sentryService = module.get<SentryService>(SentryService);
    postService = module.get<PostService>(PostService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('NotificationService', () => {
    it('Func: publishPostNotification', async () => {
      notificationService.publishPostNotification(mockNotificationPayloadDto);
      expect(kafkaProducer.emit).toBeCalledTimes(1);
    });

    it('Func: publishCommentNotification', async () => {
      notificationService.publishCommentNotification(mockNotificationPayloadDto);
      expect(kafkaProducer.emit).toBeCalledTimes(1);
    });

    it('Func: publishReactionNotification', async () => {
      notificationService.publishReactionNotification(mockNotificationPayloadDto);
      expect(kafkaProducer.emit).toBeCalledTimes(1);
    });
  });

  describe('PostActivityService', () => {
    it('Func: createPayload', async () => {
      const rsp = postActivityService.createPayload(mockPostResponseDto);
      expect(rsp).toBeInstanceOf(NotificationActivity);
    });
  });

  describe('ReactionActivityService', () => {
    it('Func: createPayload - TypeActivity.POST', async () => {
      const rsp = reactionActivityService.createPayload(
        TypeActivity.POST,
        {
          reaction: mockReactionResponseDto,
          post: mockPostResponseDto,
        },
        'create'
      );
      expect(rsp).toBeInstanceOf(NotificationActivity);
    });

    it('Func: createPayload - TypeActivity.COMMENT', async () => {
      const rsp = reactionActivityService.createPayload(
        TypeActivity.COMMENT,
        {
          reaction: mockReactionResponseDto,
          post: mockPostResponseDto,
          comment: mockCommentResponseDto,
        },
        'create'
      );
      expect(rsp).toBeInstanceOf(NotificationActivity);
    });

    it('Func: createPayload - TypeActivity.CHILD_COMMENT', async () => {
      const rsp = reactionActivityService.createPayload(
        TypeActivity.CHILD_COMMENT,
        {
          reaction: mockReactionResponseDto,
          post: mockPostResponseDto,
          comment: mockCommentResponseWithParentDto,
        },
        'create'
      );
      expect(rsp).toBeInstanceOf(NotificationActivity);
    });

    it('Func: createPayload - TypeActivity not defined', async () => {
      const rsp = reactionActivityService.createPayload(
        'something' as TypeActivity,
        {
          reaction: mockReactionResponseDto,
          post: mockPostResponseDto,
          comment: mockCommentResponseWithParentDto,
        },
        'create'
      );
      expect(rsp).toBeNull();
    });
  });

  describe('CommentActivityService', () => {
    it('Func: createCommentPayload', async () => {
      const rsp = commentActivityService.createCommentPayload(
        mockPostResponseDto,
        mockCommentResponseDto
      );
      expect(rsp).toBeInstanceOf(NotificationActivity);
    });

    it('Func: createReplyCommentPayload', async () => {
      const rsp = commentActivityService.createReplyCommentPayload(
        mockPostResponseDto,
        mockCommentResponseWithParentDto
      );
      expect(rsp).toBeInstanceOf(NotificationActivity);
    });
  });

  describe('CommentNotificationService', () => {
    it('Func: create', async () => {
      sentryService.captureException = jest.fn();
      kafkaProducer.emit = jest.fn();
      postService.get = jest.fn().mockResolvedValue(mockPostResponseDto);
      await commentNotificationService.create('event-name', mockUserDto, mockCommentResponseDto);
      expect(postService.get).toBeCalledTimes(1);
    });

    it('Func: update', async () => {
      sentryService.captureException = jest.fn();
      kafkaProducer.emit = jest.fn();
      postService.get = jest.fn().mockResolvedValue(mockPostResponseDto);
      await commentNotificationService.update(
        'event-name',
        mockUserDto,
        mockCommentModel as unknown as IComment,
        mockCommentResponseDto
      );
      expect(postService.get).toBeCalledTimes(1);
    });

    it('Func: destroy', async () => {
      await commentNotificationService.destroy(
        'event-name',
        mockCommentModel as unknown as IComment
      );
      expect(kafkaProducer.emit).toBeCalledTimes(1);
    });
  });
});
