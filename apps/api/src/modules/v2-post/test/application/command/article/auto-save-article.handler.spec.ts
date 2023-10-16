import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { AutoSaveArticleHandler } from '../../../../application/command/article';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';
import { createMockUserDto } from '../../../mock/user.mock';

const userMock = createMockUserDto();

describe('AutoSaveArticleHandler', () => {
  let service: AutoSaveArticleHandler;
  let articleDomainService: IArticleDomainService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoSaveArticleHandler,
        {
          provide: ARTICLE_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IArticleDomainService>(),
        },
      ],
    }).compile();
    service = module.get<AutoSaveArticleHandler>(AutoSaveArticleHandler);
    articleDomainService = module.get<IArticleDomainService>(ARTICLE_DOMAIN_SERVICE_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should execute auto save article', async () => {
      jest.spyOn(articleDomainService, 'autoSave').mockResolvedValueOnce();
      await service.execute({
        payload: {
          actor: userMock,
          id: 'id',
        },
      });
      expect(articleDomainService.autoSave).toBeCalledWith({
        id: 'id',
        actor: userMock,
      });
    });
  });
});
