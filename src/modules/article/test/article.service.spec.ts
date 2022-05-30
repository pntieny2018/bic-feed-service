import { Test, TestingModule } from '@nestjs/testing';
import { PostModel } from '../../../database/models/post.model';
import { getModelToken } from '@nestjs/sequelize';
import { createMock } from '@golevelup/ts-jest';
import { SentryService } from '@app/sentry';
import { RedisModule } from '@app/redis';
import { UserService } from '../../../shared/user';
import { GroupService } from '../../../shared/group';
import { MediaService } from '../../media';
import { MentionService } from '../../mention';
import { Transaction } from 'sequelize';
import { CommentService } from '../../comment';
import { AuthorityService } from '../../authority';
import { Sequelize } from 'sequelize-typescript';
import { ReactionService } from '../../reaction';

import { ClientsModule } from '@nestjs/microservices';
import { ArticleService } from '../article.service';
import { mockedUserAuth } from './mocks/data/user-auth.mock';
import { PostService } from '../../post/post.service';

describe('ArticleService', () => {
  let articleService: ArticleService;
  let postService: PostService;
  let postModelMock;
  let authorityService: AuthorityService;
  let transactionMock;
  let sequelize: Sequelize;
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [RedisModule, ClientsModule],
      providers: [
        ArticleService,
        AuthorityService,
        {
          provide: PostService,
          useValue: {
            deletePost: jest.fn()
          }
        },
        {
          provide: CommentService,
          useValue: {
            getComments: jest.fn(),
            deleteCommentsByPost: jest.fn(),
          },
        },
        {
          provide: ReactionService,
          useValue: {
            bindReactionToPosts: jest.fn(),
            deleteReactionByPostIds: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            get: jest.fn(),
            getMany: jest.fn(),
          },
        },
        {
          provide: GroupService,
          useValue: {
            get: jest.fn(),
            getMany: jest.fn(),
            isMemberOfGroups: jest.fn(),
            getGroupIdsCanAccess: jest.fn(),
          },
        },
        {
          provide: MediaService,
          useValue: {
            checkValidMedia: jest.fn(),
            countMediaByPost: jest.fn(),
            sync: jest.fn(),
            getMediaList: jest.fn(),
          },
        },
        {
          provide: MentionService,
          useValue: {
            checkValidMentions: jest.fn(),
            bindMentionsToPosts: jest.fn(),
            setMention: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: Sequelize,
          useValue: {
            transaction: jest.fn(),
            query: jest.fn(),
          },
        },
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostModel),
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            findByPk: jest.fn(),
            addMedia: jest.fn(),
            destroy: jest.fn(),
            findAll: jest.fn(),
            findAndCountAll: jest.fn(),
          },
        },
      ],
    }).compile();

    articleService = moduleRef.get<ArticleService>(ArticleService);
    postService = moduleRef.get<PostService>(PostService);
    postModelMock = moduleRef.get<typeof PostModel>(getModelToken(PostModel));
    authorityService = moduleRef.get<AuthorityService>(AuthorityService);
    sequelize = moduleRef.get<Sequelize>(Sequelize);
    transactionMock = createMock<Transaction>({
      rollback: jest.fn(),
      commit: jest.fn(),
    });
    jest.spyOn(sequelize, 'transaction').mockResolvedValue(transactionMock);
  });
  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });
  it('should be defined', () => {
    expect(articleService).toBeDefined();
  });

  describe('deleteArticle', () => {
    it('Should delete article successfully', async () => {
      jest.spyOn(postService, 'deletePost').mockResolvedValueOnce({
        id: 'abcd'
      });
      const result = await articleService.deleteArticle('abcd', mockedUserAuth);
      expect(result).toStrictEqual({
        id: 'abcd'
      });
    });

  });
});
