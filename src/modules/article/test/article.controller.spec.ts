import { Test, TestingModule } from '@nestjs/testing';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { ArticleController } from '../article.controller';
import { mockedUserAuth } from './mocks/user-auth.mock';
import { GetArticleDto } from '../dto/requests';
import { PostService } from '../../post/post.service';
import { AuthorityService } from '../../authority';
import { ArticleAppService } from '../application/article.app-service';

describe('ArticleController', () => {
  let articleService: ArticleAppService;
  let articleController: ArticleController;
  let eventEmitter: InternalEventEmitterService;

  const userDto = mockedUserAuth;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ArticleController],
      providers: [
        {
          provide: ArticleAppService,
          useClass: jest.fn(),
        },
        {
          provide: PostService,
          useClass: jest.fn(),
        },
        {
          provide: AuthorityService,
          useClass: jest.fn(),
        },
        {
          provide: InternalEventEmitterService,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    articleService = moduleRef.get<ArticleAppService>(ArticleAppService);
    articleController = moduleRef.get<ArticleController>(ArticleController);
    eventEmitter = moduleRef.get<InternalEventEmitterService>(InternalEventEmitterService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('get', () => {
    it('Get article successfully', async () => {
      articleService.get = jest.fn().mockResolvedValue(true);
      const getDto: GetArticleDto = {
      };
      await articleController.get(
        userDto,
        '8f80cce8-3318-4ce5-8750-275425677a41',
        getDto
      );
      expect(articleService.get).toBeCalledTimes(1);
      expect(articleService.get).toBeCalledWith(
        userDto,
        '8f80cce8-3318-4ce5-8750-275425677a41',
        getDto
      );
    });
  });

  describe('delete', () => {
    it('Delete article successfully', async () => {
      articleService.delete = jest.fn().mockResolvedValue(true);
      const postId = '123';
      const result = await articleController.delete(userDto, postId);

      expect(articleService.delete).toBeCalledTimes(1);
      expect(articleService.delete).toBeCalledWith(userDto, postId);
      expect(result).toBe(true);
    });
  });
});
