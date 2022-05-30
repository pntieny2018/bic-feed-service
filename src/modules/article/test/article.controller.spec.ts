import { Test, TestingModule } from '@nestjs/testing';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { ArticleService } from '../article.service';
import { ArticleController } from '../article.controller';
import { mockedUserAuth } from './mocks/data/user-auth.mock';

describe('ArticleController', () => {
  let articleService: ArticleService;
  let articleController: ArticleController;
  let eventEmitter: InternalEventEmitterService;

  const userDto = mockedUserAuth;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ArticleController],
      providers: [
        {
          provide: ArticleService,
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

    articleService = moduleRef.get<ArticleService>(ArticleService);
    articleController = moduleRef.get<ArticleController>(ArticleController);
    eventEmitter = moduleRef.get<InternalEventEmitterService>(InternalEventEmitterService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('deleteArticle', () => {
    it('Delete post successfully', async () => {
      articleService.deleteArticle = jest.fn().mockResolvedValue(true);
      const postId = '123';
      const result = await articleController.deleteArticle(userDto, postId);

      expect(articleService.deleteArticle).toBeCalledTimes(1);
      expect(articleService.deleteArticle).toBeCalledWith(postId, userDto);
      expect(result).toBe(true);
    });
  });
});
