import { Test, TestingModule } from '@nestjs/testing';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { ArticleService } from '../article.service';
import { ArticleController } from '../article.controller';
import { mockedUserAuth } from './mocks/user-auth.mock';
import { SearchArticlesDto } from '../dto/requests/search-article.dto';
import { GetArticleDto } from '../dto/requests';

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

  describe('searchArticles', () => {
    it('Should call searchArticles', async () => {
      articleService.searchArticle = jest.fn().mockResolvedValue(true);
      const searchArticlesDto: SearchArticlesDto = {
        categories: ['a'],
      };
      const result = await articleController.searchArticles(userDto, searchArticlesDto);
      expect(articleService.searchArticle).toBeCalledTimes(1);
      expect(articleService.searchArticle).toBeCalledWith(userDto, searchArticlesDto);
    });
  });

  describe('getArticle', () => {
    it('Get article successfully', async () => {
      articleService.getArticle = jest.fn().mockResolvedValue(true);
      const getArticleDto: GetArticleDto = {
        categories: ['a'],
      };
      const result = await articleController.getArticle(
        userDto,
        '8f80cce8-3318-4ce5-8750-275425677a41',
        getArticleDto
      );
      expect(articleService.getArticle).toBeCalledTimes(1);
      expect(articleService.getArticle).toBeCalledWith(
        '8f80cce8-3318-4ce5-8750-275425677a41',
        userDto,
        getArticleDto
      );
    });
  });

  describe('deleteArticle', () => {
    it('Delete article successfully', async () => {
      articleService.deleteArticle = jest.fn().mockResolvedValue(true);
      const postId = '123';
      const result = await articleController.deleteArticle(userDto, postId);

      expect(articleService.deleteArticle).toBeCalledTimes(1);
      expect(articleService.deleteArticle).toBeCalledWith(postId, userDto);
      expect(result).toBe(true);
    });
  });
});
